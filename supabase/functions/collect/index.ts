// Edge function `collect`: el servidor es la autoridad sobre las recogidas.
// Valida que el objeto existe de verdad (regenerándolo con la misma semilla),
// que el jugador estaba lo bastante cerca y que no se mueve a velocidad
// imposible; solo entonces lo añade a su inventario.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import {
  spawnCell,
  hideoutFor,
  anomalyFor,
  vigilance,
  distanceM,
  COLLECT_RADIUS,
  BUCKET_MS,
  ZONE,
  REGION,
  TYPES_BY_RARITY,
} from '../_shared/spawn.ts'

const DAY_MS = 24 * 60 * 60 * 1000
const HIDEOUT_BONUS_XP = 150
const ANOMALY_BONUS_XP = 25

// Códigos open-meteo de lluvia/nieve/tormenta (debe coincidir con weather.js)
const STORM_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99,
])

function utcDate(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10)
}

function weekStartUTC(): string {
  const d = new Date()
  const monday = (d.getUTCDay() + 6) % 7
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - monday))
    .toISOString()
    .slice(0, 10)
}

// Debe coincidir con RARITIES de src/game/items.js
const XP_BY_RARITY: Record<string, number> = {
  comun: 5,
  pocoComun: 12,
  raro: 30,
  epico: 80,
  reliquia: 200,
  alien: 500,
}

const RARITY_BY_TYPE: Record<string, string> = {}
for (const [rarity, types] of Object.entries(TYPES_BY_RARITY))
  for (const t of types) RARITY_BY_TYPE[t] = rarity

const MAX_SPEED_M_S = 14 // ~50 km/h: más rápido que eso no es "andar"
const TOLERANCE_M = 40 // margen por deriva de GPS

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  try {
    const { spawnId, typeId, lat, lng } = await req.json()
    if (typeof spawnId !== 'string' || typeof lat !== 'number' || typeof lng !== 'number') {
      return json({ error: 'petición inválida' }, 400)
    }

    // Identificar al jugador desde su JWT
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    )
    const { data: userData, error: userError } = await authClient.auth.getUser()
    if (userError || !userData.user) return json({ error: 'no autenticado' }, 401)
    const playerId = userData.user.id

    // 1. ¿El spawn existe? Regenerarlo con la misma semilla determinista.
    //    Tres formas: basura normal (`bucket:x:y:i`), escondite (`H:day:rx:ry`)
    //    o botín de anomalía radiactiva (`A:day:rx:ry:i`).
    let item: { id: string; lat: number; lng: number; typeId: string } | undefined
    let bonusXp = 0
    if (spawnId.startsWith('A:')) {
      const [, dayStr, rxStr, ryStr] = spawnId.split(':')
      const day = Number(dayStr)
      const today = Math.floor(Date.now() / DAY_MS)
      if (day !== today && day !== today - 1) return json({ error: 'anomalía disipada' }, 409)
      const a = anomalyFor(Number(rxStr), Number(ryStr), day)
      item = a?.items.find((i) => i.id === spawnId)
      bonusXp = ANOMALY_BONUS_XP
    } else if (spawnId.startsWith('H:')) {
      const [, dayStr, rxStr, ryStr] = spawnId.split(':')
      const day = Number(dayStr)
      const today = Math.floor(Date.now() / DAY_MS)
      if (day !== today && day !== today - 1) return json({ error: 'escondite caducado' }, 409)
      const h = hideoutFor(Number(rxStr), Number(ryStr), day)
      if (h.id === spawnId) item = h
      bonusXp = HIDEOUT_BONUS_XP
    } else {
      const [bucketStr, xStr, yStr] = spawnId.split(':')
      const bucket = Number(bucketStr)
      const currentBucket = Math.floor(Date.now() / BUCKET_MS)
      if (bucket !== currentBucket && bucket !== currentBucket - 1) {
        return json({ error: 'spawn caducado' }, 409)
      }
      item = spawnCell(Number(xStr), Number(yStr), bucket).find((i) => i.id === spawnId)
    }
    if (!item || item.typeId !== typeId) return json({ error: 'spawn inexistente' }, 409)

    // 2. ¿El jugador estaba cerca del objeto?
    if (distanceM({ lat, lng }, item) > COLLECT_RADIUS + TOLERANCE_M) {
      return json({ error: 'demasiado lejos' }, 409)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 3a. Límite de actividad: nadie recoge 90 objetos legítimos en una hora.
    //     (Frena el farmeo automatizado y el teletransporte con GPS falso.)
    const { count: lastHour } = await admin
      .from('collect_log')
      .select('*', { count: 'exact', head: true })
      .eq('player', playerId)
      .gte('at', new Date(Date.now() - 3600_000).toISOString())
    if ((lastHour ?? 0) >= 90) {
      return json({ error: 'el Gremio sospecha: demasiadas recogidas en una hora' }, 429)
    }

    // 3b. ¿Velocidad plausible desde su última recogida?
    const { data: last } = await admin
      .from('collect_log')
      .select('lat, lng, at')
      .eq('player', playerId)
      .order('at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (last) {
      const seconds = (Date.now() - new Date(last.at).getTime()) / 1000
      const meters = distanceM({ lat, lng }, last)
      if (seconds > 0 && meters / seconds > MAX_SPEED_M_S) {
        return json({ error: 'movimiento imposible' }, 409)
      }
    }

    // 4. Registrar: inventario (el unique collector+spawn_id evita duplicados) + log
    const { data: inserted, error: insertError } = await admin
      .from('inventory_items')
      .insert({ owner: playerId, collector: playerId, type_id: item.typeId, spawn_id: spawnId })
      .select('id')
      .single()
    if (insertError || !inserted) return json({ error: 'ya recogido' }, 409)

    await admin
      .from('collect_log')
      .insert({ player: playerId, spawn_id: spawnId, type_id: item.typeId, lat, lng })

    // 5. Conceder el XP (autoritativo: solo el servidor suma) con todos los
    //    multiplicadores: facción, racha diaria, guerra semanal y tormenta.
    const rarity = RARITY_BY_TYPE[item.typeId]
    const { data: profile } = await admin
      .from('profiles')
      .select('faction, streak, last_day')
      .eq('id', playerId)
      .maybeSingle()

    // Racha: días consecutivos con al menos una recogida
    const today = utcDate()
    let streak = profile?.streak ?? 0
    if (profile?.last_day !== today) {
      streak = profile?.last_day === utcDate(-1) ? streak + 1 : 1
      await admin.from('profiles').update({ streak, last_day: today }).eq('id', playerId)
    }

    let mult = 1
    if (profile?.faction === 'anticuarios' && ['raro', 'epico', 'reliquia'].includes(rarity)) {
      mult *= 1.25
    }
    mult *= 1 + Math.min(streak, 10) * 0.05 // +5 %/día, tope +50 %

    // Campeones de la guerra semanal: +10 % toda la semana
    const { data: reigning } = await admin
      .from('war_winners')
      .select('faction')
      .eq('week', weekStartUTC())
      .maybeSingle()
    if (reigning && reigning.faction === profile?.faction) mult *= 1.1

    // Tormenta real (open-meteo): la lluvia destapa cosas → +25 %
    let storm = false
    try {
      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&current=weather_code`,
        { signal: AbortSignal.timeout(1500) },
      )
      const w = await wRes.json()
      storm = STORM_CODES.has(w?.current?.weather_code)
    } catch {
      /* sin bonus si el clima no responde */
    }
    if (storm) mult *= 1.25

    // Vigilancia Alienígena sobre la zona del objeto: ×2 mientras dure
    const vigilBucket = /^[HA]:/.test(spawnId)
      ? Math.floor(Date.now() / BUCKET_MS)
      : Number(spawnId.split(':')[0])
    if (vigilance(Math.floor(item.lng / ZONE), Math.floor(item.lat / ZONE), vigilBucket)) {
      mult *= 2
    }

    const xpGained = Math.ceil((XP_BY_RARITY[rarity] ?? 0) * mult) + bonusXp
    const { data: newXp, error: xpError } = await admin.rpc('award_xp', {
      player: playerId,
      amount: xpGained,
    })
    if (xpError) console.warn('award_xp:', xpError.message)

    // Cada recogida daña al Reclamador de la región (~2 km) — jefe cooperativo
    const bossRegion = `${Math.floor(item.lng / REGION)}:${Math.floor(item.lat / REGION)}`
    await admin.from('boss_damage').insert({
      region: bossRegion,
      week: weekStartUTC(),
      player: playerId,
      damage: xpGained,
    })

    return json({
      ok: true,
      itemId: inserted.id,
      typeId: item.typeId,
      xpGained,
      xp: newXp ?? 0,
      streak,
      storm,
    })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}
