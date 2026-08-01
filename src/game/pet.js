// El Compañero: el Huevo de incubadora del Fragmento X. Se incuba caminando
// km reales, eclosiona en una criatura que te sigue y olfatea tesoros raros.
// Todo vive en el guardado local: es cariño, no economía.

export const HATCH_M = 2000 // metros andados para eclosionar
export const LEVEL_M = 3000 // metros por nivel a partir de la eclosión
export const MAX_LEVEL = 20

export const SPECIES = [
  { emoji: '👾', name: 'Bit' },
  { emoji: '🦂', name: 'Pinza' }, // criatura del yermo: encaja con la arena y la radiación
  { emoji: '🦎', name: 'Zeta' }, // guiño a Zeta-9, la inventora
  { emoji: '🐛', name: 'Trasho' },
  { emoji: '🦔', name: 'Púa' },
]

export function petLevel(walkedM) {
  if (walkedM < HATCH_M) return 0
  return Math.min(MAX_LEVEL, 1 + Math.floor((walkedM - HATCH_M) / LEVEL_M))
}

// Radio de olfato: crece con el nivel
export function sniffRadius(level) {
  return 200 + level * 25
}

// Punto cardinal (para "algo huele a 180 m al NE")
export function cardinal(bearing) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
  return dirs[Math.round((((bearing % 360) + 360) % 360) / 45) % 8]
}
