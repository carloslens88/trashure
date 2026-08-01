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
  scrap: 0,
  xp: 0,
  muted: false,
  introSeen: false,
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
