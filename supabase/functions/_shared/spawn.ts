// Port a Deno/TS del motor de spawning del cliente.
// ⚠️ Debe producir EXACTAMENTE los mismos resultados que src/game/spawn.js
// (mismo PRNG, mismas constantes): es lo que hace imposible inventarse objetos.

export const COLLECT_RADIUS = 60
export const CELL = 0.0012
export const ZONE = 0.01
export const BUCKET_MS = 10 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

// Debe coincidir con los pesos de src/game/items.js
const RARITY_WEIGHTS: [string, number][] = [
  ['comun', 55],
  ['pocoComun', 25],
  ['raro', 12],
  ['epico', 5.5],
  ['reliquia', 2],
  ['alien', 0.5],
]

// Debe coincidir con el orden de src/game/items.js (CATALOG por rareza)
export const TYPES_BY_RARITY: Record<string, string[]> = {
  comun: ['lata', 'brik', 'periodico', 'bolsa', 'vaso', 'platano', 'calcetin', 'caja'],
  pocoComun: ['osito', 'paraguas', 'radio', 'bota', 'vhs', 'silla'],
  raro: ['camara', 'reloj', 'trompeta', 'llave', 'brujula'],
  // corona/espada retirados del spawn (ver items.js): no tocar sin revisar
  // también byRarity en src/game/spawn.js — deben ser SIEMPRE el mismo pool.
  epico: ['mapa', 'orbe', 'guitarra', 'videocamara'],
  reliquia: ['anfora', 'doblon', 'fosil', 'collar'],
  alien: ['nave', 'plasma', 'anomalia', 'huevo'],
}

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Eventos de zona — espejo exacto de src/game/spawn.js
export function zoneEvent(zoneX: number, zoneY: number, bucket: number): string | null {
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

interface WeightTable {
  weights: Record<string, number>
  total: number
}

function weightsFor(event: string | null): WeightTable {
  const weights = Object.fromEntries(RARITY_WEIGHTS)
  if (event === 'eco') {
    weights.epico = 18
    weights.reliquia = 10
  }
  if (event === 'senal') {
    weights.alien = 8
  }
  const total = Object.values(weights).reduce((s, w) => s + w, 0)
  return { weights, total }
}

const WEIGHT_TABLES: Record<string, WeightTable> = {
  none: weightsFor(null),
  marea: weightsFor('marea'),
  eco: weightsFor('eco'),
  senal: weightsFor('senal'),
}

function rollRarity(rng: () => number, table: WeightTable): string {
  let r = rng() * table.total
  for (const [key] of RARITY_WEIGHTS) {
    r -= table.weights[key]
    if (r <= 0) return key
  }
  return 'comun'
}

export interface SpawnedItem {
  id: string
  lat: number
  lng: number
  typeId: string
}

// Escondites de los Desechadores — espejo exacto de src/game/spawn.js
export const REGION = 0.02

export function hideoutFor(rx: number, ry: number, day: number): SpawnedItem {
  const rng = mulberry32((rx * 1103515245 + ry * 12345) ^ Math.imul(day, 2654435761))
  const lat = (ry + 0.15 + rng() * 0.7) * REGION
  const lng = (rx + 0.15 + rng() * 0.7) * REGION
  const roll = rng()
  const rarity = roll < 0.5 ? 'epico' : roll < 0.85 ? 'reliquia' : 'alien'
  const pool = TYPES_BY_RARITY[rarity]
  const typeId = pool[Math.floor(rng() * pool.length)]
  return { id: `H:${day}:${rx}:${ry}`, lat, lng, typeId }
}

export function spawnCell(x: number, y: number, bucket: number): SpawnedItem[] {
  const event = zoneEvent(
    Math.floor((x * CELL) / ZONE),
    Math.floor((y * CELL) / ZONE),
    bucket,
  )
  const table = WEIGHT_TABLES[event ?? 'none']
  const rng = mulberry32((x * 374761393 + y * 668265263) ^ Math.imul(bucket, 2246822519))
  const roll = rng()
  const [t0, t1] = event === 'marea' ? [0.35, 0.7] : [0.68, 0.9]
  const count = roll < t0 ? 0 : roll < t1 ? 1 : 2
  const items: SpawnedItem[] = []
  for (let i = 0; i < count; i++) {
    const lat = (y + rng()) * CELL
    const lng = (x + rng()) * CELL
    const rarity = rollRarity(rng, table)
    const pool = TYPES_BY_RARITY[rarity]
    const typeId = pool[Math.floor(rng() * pool.length)]
    items.push({ id: `${bucket}:${x}:${y}:${i}`, lat, lng, typeId })
    rng() // seedFrac: mantener el flujo del PRNG idéntico al cliente
  }
  return items
}

// Anomalías Radiactivas — espejo exacto de src/game/spawn.js
// (mismo orden de rolls del PRNG: gate, lat, lng, rareza del 3.º, y por
// objeto: ángulo, distancia, tipo, seedFrac)
export const ANOMALY_RADIUS = 100

export interface Anomaly {
  id: string
  lat: number
  lng: number
  radius: number
  items: SpawnedItem[]
}

export function anomalyFor(rx: number, ry: number, day: number): Anomaly | null {
  const rng = mulberry32((rx * 2246822519 + ry * 3266489917) ^ Math.imul(day, 668265263))
  if (rng() >= 0.4) return null
  const lat = (ry + 0.1 + rng() * 0.8) * REGION
  const lng = (rx + 0.1 + rng() * 0.8) * REGION
  const rarities = ['raro', 'epico', rng() < 0.25 ? 'alien' : 'reliquia']
  const items: SpawnedItem[] = []
  for (let i = 0; i < 3; i++) {
    const ang = rng() * Math.PI * 2
    const dist = 15 + rng() * 40
    const ilat = lat + (Math.sin(ang) * dist) / 111320
    const ilng = lng + (Math.cos(ang) * dist) / (111320 * Math.cos((lat * Math.PI) / 180))
    const pool = TYPES_BY_RARITY[rarities[i]]
    const typeId = pool[Math.floor(rng() * pool.length)]
    items.push({ id: `A:${day}:${rx}:${ry}:${i}`, lat: ilat, lng: ilng, typeId })
    rng() // seedFrac: mantener el flujo del PRNG idéntico al cliente
  }
  return { id: `A:${day}:${rx}:${ry}`, lat, lng, radius: ANOMALY_RADIUS, items }
}

// Vigilancia Alienígena — espejo exacto de src/game/spawn.js
export function vigilance(zoneX: number, zoneY: number, bucket: number): boolean {
  const rng = mulberry32((zoneX * 97531 + zoneY * 13579) ^ Math.imul(bucket, 374761393))
  return rng() < 0.08
}

// Núcleo del Desechador — espejo exacto de src/game/spawn.js (dailyUniqueFor)
export const WORLD_ANCHOR = { lat: 40.4168, lng: -3.7038 }
export const WORLD_UNIQUE_RADIUS_M = 15000

export function dailyUniqueFor(day: number): SpawnedItem {
  const rng = mulberry32(Math.imul(day, 2246822519) ^ 0x9e3779b9)
  const ang = rng() * Math.PI * 2
  const dist = rng() * WORLD_UNIQUE_RADIUS_M
  const lat = WORLD_ANCHOR.lat + (Math.sin(ang) * dist) / 111320
  const lng =
    WORLD_ANCHOR.lng + (Math.cos(ang) * dist) / (111320 * Math.cos((WORLD_ANCHOR.lat * Math.PI) / 180))
  return { id: `U:${day}`, lat, lng, typeId: 'nucleo' }
}

// Cofre del Gremio — espejo exacto de src/game/spawn.js (chestFor). Solo
// calcula DÓNDE está: si abre o no, y con qué, se decide en collect/index.ts.
export interface ChestSpot {
  id: string
  lat: number
  lng: number
}

export function chestFor(rx: number, ry: number, week: number): ChestSpot {
  const rng = mulberry32((rx * 668265263 + ry * 2246822519) ^ Math.imul(week, 1103515245))
  const lat = (ry + 0.2 + rng() * 0.6) * REGION
  const lng = (rx + 0.2 + rng() * 0.6) * REGION
  return { id: `K:${week}:${rx}:${ry}`, lat, lng }
}

export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
