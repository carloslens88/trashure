import { CATALOG, RARITIES } from './items'

export const COLLECT_RADIUS = 60 // metros
export const CELL = 0.0012 // ~130 m por celda
export const ZONE = 0.01 // ~1 km: la malla de eventos y presencia
export const BUCKET_MS = 10 * 60 * 1000 // la basura se renueva cada 10 min
const RADIUS_CELLS = 5
const DAY_MS = 24 * 60 * 60 * 1000

export function currentBucket() {
  return Math.floor(Date.now() / BUCKET_MS)
}

export function nextRefreshMs() {
  return BUCKET_MS - (Date.now() % BUCKET_MS)
}

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const byRarity = {}
// Los objetos "retired" (ver items.js) siguen en el catálogo por compatibilidad
// con inventarios ya existentes, pero no vuelven a generarse.
for (const t of CATALOG) if (!t.retired) (byRarity[t.rarity] ??= []).push(t)

const RARITY_KEYS = Object.keys(RARITIES)

// ---------- Eventos de zona (lore procedural) ----------
// Cada día algunas zonas (~1 km) despiertan con un evento que sesga el
// spawning. Determinista: el servidor calcula exactamente lo mismo al validar.
// ⚠️ Cualquier cambio aquí debe replicarse en supabase/functions/collect/spawn.ts

export const ZONE_EVENTS = {
  marea: {
    name: 'Marea de Chatarra',
    emoji: '🌊',
    desc: 'La zona rebosa de objetos abandonados.',
  },
  eco: {
    name: 'Eco de Reliquias',
    emoji: '🏺',
    desc: 'Los Desechadores pasaron por aquí: rarezas a flor de suelo.',
  },
  senal: {
    name: 'Señal Alienígena',
    emoji: '🛸',
    desc: 'Algo emite desde esta zona…',
  },
}

// El día se deriva del bucket para que validar un bucket anterior no cambie
// de evento justo a medianoche.
export function zoneEvent(zoneX, zoneY, bucket) {
  const day = Math.floor((bucket * BUCKET_MS) / DAY_MS)
  const rng = mulberry32(
    (zoneX * 2654435761 + zoneY * 1597334677) ^ Math.imul(day, 374761393),
  )
  const roll = rng()
  if (roll < 0.12) return 'marea'
  if (roll < 0.22) return 'eco'
  if (roll < 0.26) return 'senal'
  return null
}

export function eventAt(pos, bucket = currentBucket()) {
  return zoneEvent(Math.floor(pos.lng / ZONE), Math.floor(pos.lat / ZONE), bucket)
}

// ---------- Vigilancia Alienígena ----------
// En cada franja de 10 min, cada zona tiene un 8 % de probabilidad de que un
// Vigía la sobrevuele: tormenta de arena, objetos agitados y ×2 XP mientras
// dure. Determinista: el servidor valida el bonus con el mismo cálculo.
// ⚠️ Espejo obligatorio en supabase/functions/_shared/spawn.ts

export function vigilance(zoneX, zoneY, bucket) {
  const rng = mulberry32((zoneX * 97531 + zoneY * 13579) ^ Math.imul(bucket, 374761393))
  return rng() < 0.08
}

export function vigilanceAt(pos, bucket = currentBucket()) {
  return vigilance(Math.floor(pos.lng / ZONE), Math.floor(pos.lat / ZONE), bucket)
}

// ---------- Escondites de los Desechadores ----------
// Cada día hay UN escondite oculto en cada región (~2 km). No aparece en el
// mapa: hay que rastrearlo con la brújula. Determinista y validado en
// servidor. ⚠️ Espejo obligatorio en supabase/functions/collect/spawn.ts

export const REGION = 0.02 // ~2 km
export const HIDEOUT_REVEAL_M = 150 // a esta distancia aparece en el mapa

export function currentDay() {
  return Math.floor(Date.now() / DAY_MS)
}

export function hideoutFor(rx, ry, day) {
  const rng = mulberry32((rx * 1103515245 + ry * 12345) ^ Math.imul(day, 2654435761))
  const lat = (ry + 0.15 + rng() * 0.7) * REGION
  const lng = (rx + 0.15 + rng() * 0.7) * REGION
  const roll = rng()
  const rarity = roll < 0.5 ? 'epico' : roll < 0.85 ? 'reliquia' : 'alien'
  const pool = byRarity[rarity]
  const type = pool[Math.floor(rng() * pool.length)]
  return { id: `H:${day}:${rx}:${ry}`, lat, lng, type }
}

// Los 9 escondites de tu región y las vecinas, ordenados por cercanía
export function nearbyHideouts(pos, day = currentDay()) {
  const rx0 = Math.floor(pos.lng / REGION)
  const ry0 = Math.floor(pos.lat / REGION)
  const list = []
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) list.push(hideoutFor(rx0 + dx, ry0 + dy, day))
  return list.sort((a, b) => distanceM(pos, a) - distanceM(pos, b))
}

// ---------- Anomalías Radiactivas ----------
// Cada día, cada región (~2 km) tiene un 40 % de albergar una anomalía: un
// cráter donde la Niebla Tóxica brilla en verde con 3 objetos de rareza alta.
// El riesgo: si entras y te vas sin recoger nada, la radiación te borra la
// racha. Determinista y validado en servidor.
// ⚠️ Espejo obligatorio en supabase/functions/_shared/spawn.ts

export const ANOMALY_RADIUS = 100 // metros: dentro de este radio estás expuesto

export function anomalyFor(rx, ry, day) {
  const rng = mulberry32((rx * 2246822519 + ry * 3266489917) ^ Math.imul(day, 668265263))
  if (rng() >= 0.4) return null
  const lat = (ry + 0.1 + rng() * 0.8) * REGION
  const lng = (rx + 0.1 + rng() * 0.8) * REGION
  // botín fijo: raro + épico + (reliquia | alien) — el orden de los rolls
  // del PRNG debe ser idéntico en el servidor
  const rarities = ['raro', 'epico', rng() < 0.25 ? 'alien' : 'reliquia']
  const items = []
  for (let i = 0; i < 3; i++) {
    const ang = rng() * Math.PI * 2
    const dist = 15 + rng() * 40
    const ilat = lat + (Math.sin(ang) * dist) / 111320
    const ilng = lng + (Math.cos(ang) * dist) / (111320 * Math.cos((lat * Math.PI) / 180))
    const pool = byRarity[rarities[i]]
    const type = pool[Math.floor(rng() * pool.length)]
    items.push({ id: `A:${day}:${rx}:${ry}:${i}`, lat: ilat, lng: ilng, type, seedFrac: rng() })
  }
  return { id: `A:${day}:${rx}:${ry}`, lat, lng, radius: ANOMALY_RADIUS, items }
}

// Las anomalías de tu región y las 8 vecinas
export function anomaliesNear(pos, day = currentDay()) {
  const rx0 = Math.floor(pos.lng / REGION)
  const ry0 = Math.floor(pos.lat / REGION)
  const list = []
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const a = anomalyFor(rx0 + dx, ry0 + dy, day)
      if (a) list.push(a)
    }
  return list
}

// Rumbo en grados (0 = norte, horario) de a hacia b — para la brújula
export function bearingDeg(a, b) {
  const toRad = (d) => (d * Math.PI) / 180
  const dLng = toRad(b.lng - a.lng)
  const y = Math.sin(dLng) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng)
  return (Math.atan2(y, x) * 180) / Math.PI
}

function weightsFor(event) {
  const weights = Object.fromEntries(RARITY_KEYS.map((k) => [k, RARITIES[k].weight]))
  if (event === 'eco') {
    weights.epico = 18
    weights.reliquia = 10
  }
  if (event === 'senal') {
    weights.alien = 8
  }
  const total = RARITY_KEYS.reduce((s, k) => s + weights[k], 0)
  return { weights, total }
}

const WEIGHT_TABLES = {
  none: weightsFor(null),
  marea: weightsFor('marea'),
  eco: weightsFor('eco'),
  senal: weightsFor('senal'),
}

function rollRarity(rng, table) {
  let r = rng() * table.total
  for (const k of RARITY_KEYS) {
    r -= table.weights[k]
    if (r <= 0) return k
  }
  return 'comun'
}

// Spawning determinista: misma celda + misma ventana de tiempo = mismos objetos.
// En fase 2 esta misma función corre en el servidor para validar recogidas.
export function spawnAround(pos, bucket) {
  const cx = Math.floor(pos.lng / CELL)
  const cy = Math.floor(pos.lat / CELL)
  const items = []
  for (let dy = -RADIUS_CELLS; dy <= RADIUS_CELLS; dy++) {
    for (let dx = -RADIUS_CELLS; dx <= RADIUS_CELLS; dx++) {
      const x = cx + dx
      const y = cy + dy
      const event = zoneEvent(
        Math.floor((x * CELL) / ZONE),
        Math.floor((y * CELL) / ZONE),
        bucket,
      )
      const table = WEIGHT_TABLES[event ?? 'none']
      const rng = mulberry32((x * 374761393 + y * 668265263) ^ Math.imul(bucket, 2246822519))
      const roll = rng()
      // la Marea de Chatarra llena la zona de spawns
      const [t0, t1] = event === 'marea' ? [0.35, 0.7] : [0.68, 0.9]
      const count = roll < t0 ? 0 : roll < t1 ? 1 : 2
      for (let i = 0; i < count; i++) {
        const lat = (y + rng()) * CELL
        const lng = (x + rng()) * CELL
        const rarity = rollRarity(rng, table)
        const pool = byRarity[rarity]
        const type = pool[Math.floor(rng() * pool.length)]
        items.push({ id: `${bucket}:${x}:${y}:${i}`, lat, lng, type, seedFrac: rng() })
      }
    }
  }
  return items
}

export function distanceM(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
