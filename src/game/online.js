// Fase 2 — capa online (Supabase). Si no hay credenciales en .env el juego
// funciona 100 % offline; con ellas se activan sesión, sincronización,
// validación de recogidas en servidor, presencia y trueques.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY
const configured = url && anon && !url.includes('TU-PROYECTO') && !anon.startsWith('TU-')

export const supabase = configured ? createClient(url, anon) : null
export const isOnline = Boolean(supabase)

let userId = null

export function getUserId() {
  return userId
}

const NOUNS = ['Mapache', 'Urraca', 'Robot', 'Tejón', 'Pulpo', 'Cuervo', 'Gaviota', 'Zorro']
const ADJS = ['Cósmico', 'Oxidado', 'Veloz', 'Brillante', 'Errante', 'Curioso', 'Chatarra', 'Lunar']

async function ensureProfile() {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle()
  if (data?.username) return
  const seed = parseInt(userId.replaceAll('-', '').slice(0, 8), 16)
  const username = `${NOUNS[seed % NOUNS.length]} ${ADJS[(seed >>> 4) % ADJS.length]} #${userId.slice(0, 4)}`
  await supabase.from('profiles').upsert({ id: userId, username })
}

// Los enlaces de email (confirmar cuenta / iniciar sesión) redirigen aquí
// con el resultado en la URL: éxito como #access_token=... o fallo como
// #error=...&error_description=... (típico si el enlace ya caducó o ya se
// usó — los enlaces mágicos son de un solo uso). Sin este chequeo, un
// enlace caducado simplemente no hacía nada y parecía un botón roto.
// Se consume una sola vez al arrancar y se limpia la URL después.
export function consumeAuthRedirect() {
  const hash = window.location.hash
  if (!hash || hash.length < 2) return null
  const params = new URLSearchParams(hash.slice(1))
  const result = params.has('error')
    ? { ok: false, message: params.get('error_description') ?? params.get('error') }
    : params.has('access_token')
      ? { ok: true }
      : null
  if (result) history.replaceState(null, '', window.location.pathname + window.location.search)
  return result
}

// Singleton: React StrictMode (y los cambios de zona) pueden pedir la sesión
// varias veces en paralelo; solo debe crearse un usuario anónimo.
let sessionPromise = null

export function ensureSession() {
  if (!supabase) return Promise.resolve(null)
  // eslint-disable-next-line no-use-before-define
  sessionPromise ??= createSession()
  return sessionPromise
}

function createSession() {
  return (async () => {
    const { data } = await supabase.auth.getSession()
    let user = data.session?.user
    if (!user) {
      const { data: signed, error } = await supabase.auth.signInAnonymously()
      if (error) {
        console.warn('[online] no se pudo iniciar sesión:', error.message)
        return null
      }
      user = signed.user
    }
    userId = user.id
    await ensureProfile()
    return user
  })().then((user) => {
    // no cachear fallos: un corte de red no debe dejar la sesión muerta
    if (!user) sessionPromise = null
    return user
  })
}

export async function fetchProfile() {
  if (!supabase || !userId) return null
  const { data } = await supabase
    .from('profiles')
    .select(
      'username, xp, scrap, faction, streak, last_day, title, skin, explored, camp_lat, camp_lng, camp_moved_at, camp_claim_day',
    )
    .eq('id', userId)
    .maybeSingle()
  return data
}

// ---------- Campamento ----------

export async function setCamp(pos) {
  const { error } = await supabase.rpc('set_camp', { p_lat: pos.lat, p_lng: pos.lng })
  if (error) throw new Error(error.message)
}

// Devuelve la nueva Chatarra
export async function claimCamp(pos) {
  const { data, error } = await supabase.rpc('claim_camp', { p_lat: pos.lat, p_lng: pos.lng })
  if (error) throw new Error(error.message)
  return data
}

// ---------- El Reclamador (jefe de zona) ----------

export async function fetchBossStatus(pos) {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('boss_status', { p_lat: pos.lat, p_lng: pos.lng })
  if (error) throw new Error(error.message)
  return data?.[0] ?? null
}

// El Núcleo del Desechador: ¿ya se lo llevó alguien hoy (y quién)?
export async function fetchDailyUniqueStatus() {
  if (!supabase) return null
  const { data, error } = await supabase.rpc('daily_unique_status')
  if (error) throw new Error(error.message)
  return data?.[0] ?? null
}

// Devuelve la nueva Chatarra
export async function claimBoss(pos) {
  const { data, error } = await supabase.rpc('claim_boss', { p_lat: pos.lat, p_lng: pos.lng })
  if (error) throw new Error(error.message)
  return data
}

// ---------- Territorio cartografiado ----------

// Sube tu acumulado de sectores; el servidor solo lo deja crecer
export async function reportExplored(n) {
  if (!supabase || !userId) return
  const { error } = await supabase.rpc('report_explored', { n })
  if (error) throw new Error(error.message)
}

export async function fetchExploredTop() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, faction, explored')
    .gt('explored', 0)
    .order('explored', { ascending: false })
    .limit(5)
  if (error) throw new Error(error.message)
  return data
}

export async function fetchFactionExplored() {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('faction_explored')
  if (error) throw new Error(error.message)
  return data
}

// ---------- Anomalías radiactivas ----------

// Huiste sin recoger: la radiación borra tu racha (solo la tuya)
export async function anomalyFlee() {
  if (!supabase || !userId) return
  const { error } = await supabase.rpc('anomaly_flee')
  if (error) throw new Error(error.message)
}

// ---------- Sets del catálogo ----------

export async function fetchSetStatus() {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('set_status')
  if (error) throw new Error(error.message)
  return data
}

// Devuelve la nueva Chatarra
export async function claimSet(rarity) {
  const { data, error } = await supabase.rpc('claim_set', { r: rarity })
  if (error) throw new Error(error.message)
  return data
}

// ---------- Títulos ----------

export async function fetchTitles() {
  if (!supabase) return []
  const { data, error } = await supabase.from('titles').select('*')
  if (error) throw new Error(error.message)
  return data
}

export async function fetchMyTitles() {
  if (!supabase || !userId) return []
  const { data, error } = await supabase
    .from('player_titles')
    .select('title_id')
    .eq('player', userId)
  if (error) throw new Error(error.message)
  return data.map((r) => r.title_id)
}

// Devuelve la nueva Chatarra
export async function buyTitle(titleId) {
  const { data, error } = await supabase.rpc('buy_title', { t: titleId })
  if (error) throw new Error(error.message)
  return data
}

export async function equipTitle(titleId) {
  const { error } = await supabase.rpc('equip_title', { t: titleId })
  if (error) throw new Error(error.message)
}

// ---------- Skins del robot ----------

export async function fetchMySkins() {
  if (!supabase || !userId) return []
  const { data, error } = await supabase.from('player_skins').select('skin_id').eq('player', userId)
  if (error) throw new Error(error.message)
  return data.map((r) => r.skin_id)
}

export async function buySkin(skinId) {
  const { data, error } = await supabase.rpc('buy_skin', { s: skinId })
  if (error) throw new Error(error.message)
  return data
}

export async function equipSkin(skinId) {
  const { error } = await supabase.rpc('equip_skin', { s: skinId })
  if (error) throw new Error(error.message)
}

// ---------- Duelos → guerra semanal ----------

// Devuelve true si el duelo contó para la guerra de tu facción, false si ya
// llegaste al tope diario (el duelo se gana igual, solo deja de sumar puntos)
export async function submitDuelWin() {
  if (!supabase || !userId) return false
  const { data, error } = await supabase.rpc('submit_duel_win')
  if (error) return false // sin facción, sin conexión, etc. — no interrumpir la victoria por esto
  return Boolean(data)
}

// ---------- Guerra semanal ----------

export async function fetchWarStatus() {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('war_status')
  if (error) throw new Error(error.message)
  return data
}

// ---------- Facciones ----------

export async function joinFaction(faction) {
  const { error } = await supabase.rpc('join_faction', { f: faction })
  if (error) throw new Error(error.message)
}

export async function fetchFactionTotals() {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('faction_totals')
  if (error) throw new Error(error.message)
  return data
}

// ---------- Mercado ----------

export async function fetchMarket() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('market_listings')
    .select(
      'id, price, seller, item:inventory_items(id, type_id), sellerProfile:profiles!market_listings_seller_fkey(username, faction)',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) throw new Error(error.message)
  // un anuncio puede quedar huérfano si el objeto se vendió al Gremio
  return data.filter((l) => l.item)
}

export async function listItem(itemId, price) {
  const { error } = await supabase.rpc('list_item', { p_item: itemId, p_price: price })
  if (error) throw new Error(error.message)
}

export async function cancelListing(listingId) {
  const { error } = await supabase.rpc('cancel_listing', { p_listing: listingId })
  if (error) throw new Error(error.message)
}

// Devuelve tu nueva Chatarra tras la compra
export async function buyItem(listingId) {
  const { data, error } = await supabase.rpc('buy_item', { p_listing: listingId })
  if (error) throw new Error(error.message)
  return data
}

// Recogida autoritativa: el servidor valida (anti-cheat), inserta en el
// inventario y concede el XP. Devuelve { itemId, typeId, xpGained, xp }.
export async function collectOnline(item, pos) {
  const { data, error } = await supabase.functions.invoke('collect', {
    body: { spawnId: item.id, typeId: item.type.id, lat: pos.lat, lng: pos.lng },
  })
  if (error) {
    let message = error.message
    try {
      message = (await error.context.json()).error ?? message
    } catch {
      /* sin cuerpo JSON */
    }
    throw new Error(message)
  }
  return data
}

// Forzar el Cofre del Gremio con una llave: consume del inventario del
// servidor, así que solo tiene sentido online — devuelve {opened, typeId?, xpGained?}
export async function openChestOnline(chest, pos) {
  const { data, error } = await supabase.functions.invoke('collect', {
    body: { spawnId: chest.id, typeId: 'llave', lat: pos.lat, lng: pos.lng },
  })
  if (error) {
    let message = error.message
    try {
      message = (await error.context.json()).error ?? message
    } catch {
      /* sin cuerpo JSON */
    }
    throw new Error(message)
  }
  return data
}

// Venta autoritativa: el servidor valida propiedad, calcula el valor desde
// catalog_items y abona la Chatarra. Devuelve el nuevo total de Chatarra.
export async function sellItemOnline(itemId) {
  const { data, error } = await supabase.rpc('sell_item', { item_id: itemId })
  if (error) throw new Error(error.message)
  return data
}

// Funde 5 unidades de typeId en 1 del siguiente escalón; devuelve el type_id resultante
export async function fuseItemsOnline(typeId) {
  const { data, error } = await supabase.rpc('fuse_items', { t: typeId })
  if (error) throw new Error(error.message)
  return data
}

function cellOf(pos) {
  return { cy: Math.floor(pos.lat / 0.01), cx: Math.floor(pos.lng / 0.01) }
}

export function zoneKey(pos) {
  const { cy, cx } = cellOf(pos)
  return `${cy}:${cx}`
}

// Presencia: te une al canal de tu celda (~1 km) Y escuchas (sin emitir) las
// 8 vecinas. Sin esto, dos jugadores muy cerca pero a cada lado exacto de un
// borde de celda (algo que no tiene ninguna relación con la geografía real:
// una misma calle o plaza puede partir la rejilla en dos) nunca compartían
// canal y no se veían el uno al otro — bug real reportado en pruebas.
// Solo TRACKEAS en tu propia celda (para no aparecer duplicado); las 8
// vecinas son puramente de escucha. meta (facción/nombre) va en cada
// track(): así viaja siempre fresca sin depender de un segundo canal.
export function joinZone(pos, onPeers, meta = {}) {
  if (!supabase || !userId) return { move() {}, leave() {} }
  const { cy: cy0, cx: cx0 } = cellOf(pos)
  const peersByChannel = new Map()
  const channels = []
  let ownChannel = null
  let ownSubscribed = false

  function emitMerged() {
    const merged = new Map()
    for (const list of peersByChannel.values()) for (const p of list) merged.set(p.id, p)
    onPeers([...merged.values()])
  }

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const isOwn = dy === 0 && dx === 0
      const key = `${cy0 + dy}:${cx0 + dx}`
      const channel = supabase.channel(`zone:${key}`, {
        config: { presence: { key: userId } },
      })
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState()
          const peers = Object.entries(state)
            .filter(([k]) => k !== userId)
            .map(([k, metas]) => ({ id: k, ...metas[0] }))
          peersByChannel.set(key, peers)
          emitMerged()
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED' && isOwn) {
            ownSubscribed = true
            channel.track({ lat: pos.lat, lng: pos.lng, at: Date.now(), ...meta })
          }
        })
      channels.push(channel)
      if (isOwn) ownChannel = channel
    }
  }

  return {
    move(p, meta = {}) {
      if (ownSubscribed) ownChannel.track({ lat: p.lat, lng: p.lng, at: Date.now(), ...meta })
    },
    leave() {
      for (const c of channels) supabase.removeChannel(c)
      onPeers([])
    },
  }
}

// ---------- Trueques ----------
// El inventario del servidor solo contiene recogidas validadas por la edge
// function: es lo único intercambiable ("verificado por el Gremio").

export async function fetchInventory(owner = userId) {
  if (!supabase || !owner) return []
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, type_id, owner, collected_at')
    .eq('owner', owner)
    .order('collected_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function fetchItemsByIds(ids) {
  if (!supabase || ids.length === 0) return []
  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, type_id, owner')
    .in('id', ids)
  if (error) throw new Error(error.message)
  return data
}

export async function fetchProfiles(ids) {
  if (!supabase || ids.length === 0) return []
  const { data, error } = await supabase.from('profiles').select('id, username').in('id', ids)
  if (error) throw new Error(error.message)
  return data
}

// ---------- Cuenta ----------

// Estado de autenticación actual (email vinculado, si es anónima…)
export async function getAccount() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}

// Convierte la cuenta anónima en permanente conservando el MISMO user id
// (todo el progreso queda vinculado). Envía un correo de confirmación.
export async function linkEmail(email) {
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: window.location.origin },
  )
  if (error) throw new Error(error.message)
}

// Entrar desde otro dispositivo: enlace mágico al correo ya vinculado.
export async function sendLoginLink(email) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
  })
  if (error) throw new Error(error.message)
}

export async function renameProfile(username) {
  const clean = username.trim()
  if (clean.length < 3 || clean.length > 24) {
    throw new Error('entre 3 y 24 caracteres')
  }
  const { error } = await supabase.from('profiles').update({ username: clean }).eq('id', userId)
  if (error) {
    throw new Error(error.message.includes('duplicate') ? 'ese nombre ya existe' : error.message)
  }
  return clean
}

// ---------- Misiones diarias ----------

export async function fetchMissions() {
  if (!supabase) return []
  const { data, error } = await supabase.rpc('mission_status')
  if (error) throw new Error(error.message)
  return data
}

// Devuelve la nueva Chatarra tras cobrar la recompensa
export async function claimMission(missionId) {
  const { data, error } = await supabase.rpc('claim_mission', { m: missionId })
  if (error) throw new Error(error.message)
  return data
}

// ---------- Notificaciones push ----------

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export async function enablePush(pos) {
  if (!supabase || !userId) throw new Error('necesitas el modo online')
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('tu navegador no soporta notificaciones')
  }
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!key) throw new Error('falta VITE_VAPID_PUBLIC_KEY')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('permiso denegado')
  const registration = await navigator.serviceWorker.ready
  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  })
  const j = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: j.endpoint,
      p256dh: j.keys.p256dh,
      auth: j.keys.auth,
      lat: pos?.lat ?? null,
      lng: pos?.lng ?? null,
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw new Error(error.message)
}

export async function fetchLeaderboard() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, xp, faction, title')
    .order('xp', { ascending: false })
    .limit(20)
  if (error) throw new Error(error.message)
  return data
}

export async function fetchTrades() {
  if (!supabase) return []
  // RLS ya limita a los trueques en los que participas
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw new Error(error.message)
  return data
}

export async function proposeTrade(receiver, giveIds, takeIds) {
  const { error } = await supabase.from('trades').insert({
    proposer: userId,
    receiver,
    proposer_items: giveIds,
    receiver_items: takeIds,
  })
  if (error) throw new Error(error.message)
}

export async function acceptTrade(tradeId) {
  const { error } = await supabase.rpc('accept_trade', { trade_id: tradeId })
  if (error) throw new Error(error.message)
}

export async function rejectTrade(tradeId) {
  const { error } = await supabase.rpc('reject_trade', { trade_id: tradeId })
  if (error) throw new Error(error.message)
}
