// Evolución de objetos: 5 unidades iguales se funden en 1 del siguiente
// escalón. Incentiva el trueque (juntar 5 del mismo objeto entre varios es
// más fácil que en solitario) y da salida a los comunes que sobran.
// Particularidad de facción: el resultado varía según a quién sirvas — cada
// escalón tiene un pool de objetos del siguiente nivel, y la facción rota
// qué puesto del pool te toca. Mismos 5 objetos, resultado distinto según
// tu facción (divergentes sin facción caen en el resultado "base").
// No hay receta para lo alienígena a propósito: esa rareza se queda como
// premio de suerte/esfuerzo real, no fabricable.
// ⚠️ Espejo obligatorio en supabase/migrations (función fusion_target)

export const FUSION_COST = 5

const NEXT_TIER = {
  comun: ['radio', 'paraguas', 'vhs', 'osito', 'silla', 'bota'],
  pocoComun: ['reloj', 'brujula', 'camara', 'trompeta', 'llave'],
  raro: ['videocamara', 'orbe', 'guitarra', 'mapa'],
  epico: ['anfora', 'collar', 'doblon', 'fosil'],
}

// A qué escalón pertenece cada objeto fusionable (para saber en qué pool mirar)
const TIER_OF = {
  lata: 'comun',
  brik: 'comun',
  periodico: 'comun',
  bolsa: 'comun',
  calcetin: 'comun',
  vaso: 'comun',
  caja: 'comun',
  platano: 'comun',
  osito: 'pocoComun',
  paraguas: 'pocoComun',
  radio: 'pocoComun',
  vhs: 'pocoComun',
  bota: 'pocoComun',
  silla: 'pocoComun',
  camara: 'raro',
  reloj: 'raro',
  trompeta: 'raro',
  llave: 'raro',
  brujula: 'raro',
  mapa: 'epico',
  orbe: 'epico',
  guitarra: 'epico',
  videocamara: 'epico',
}

// Puesto base dentro del pool del siguiente escalón: es el resultado para
// divergentes (sin facción) y el punto de partida de la rotación por facción
const BASE_INDEX = {
  lata: 0,
  brik: 1,
  periodico: 2,
  bolsa: 3,
  calcetin: 3,
  vaso: 4,
  caja: 4,
  platano: 5,
  osito: 0,
  paraguas: 1,
  radio: 2,
  vhs: 2,
  bota: 3,
  silla: 4,
  camara: 0,
  reloj: 1,
  trompeta: 2,
  llave: 3,
  brujula: 3,
  mapa: 0,
  orbe: 1,
  guitarra: 2,
  videocamara: 3,
}

const FACTION_OFFSET = { recicladores: 0, anticuarios: 1, contrabandistas: 2 }

export function fusionTarget(typeId, faction = null) {
  const tier = TIER_OF[typeId]
  if (!tier) return null
  const pool = NEXT_TIER[tier]
  const offset = FACTION_OFFSET[faction] ?? 0
  const idx = (BASE_INDEX[typeId] + offset) % pool.length
  return pool[idx]
}
