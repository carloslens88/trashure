const KEY = 'garbage-collector-save-v1'

const DEFAULTS = {
  pos: null,
  inventory: [], // [{ typeId, at }]
  collected: [], // ids de spawns ya recogidos (bucket actual)
  discovered: [], // typeIds vistos alguna vez (catálogo)
  claimedHideouts: [], // escondites ya reclamados (hoy/ayer)
  explored: [], // celdas despejadas de la Niebla Tóxica [[lat, lng, últimaVisitaMs]]
  exploredTotal: 0, // sectores cartografiados acumulados (histórico, nunca baja)
  loreCount: 0, // fragmentos del Diario desbloqueados
  pet: { stage: 'none', species: null, walkedM: 0 }, // el Compañero (Fragmento X)
  petAffinity: null, // pesos de especie [5] del cuestionario de facción, o null si no se hizo
  duelWins: 0, // duelos ganados contra rivales — cariño/orgullo, no economía (como el Compañero)
  scrap: 0,
  xp: 0,
  muted: false,
  introSeen: false,
  linkNudgeDismissed: false, // aviso de "vincula tu email" en nivel 3 (una vez)
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    /* guardado corrupto: empezar de cero */
  }
  return { ...DEFAULTS }
}

export function persist(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* sin storage disponible */
  }
}
