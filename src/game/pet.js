// El Compañero: el Huevo de incubadora del Fragmento X. Se incuba caminando
// km reales, eclosiona en una criatura que te sigue y olfatea tesoros raros.
// Todo vive en el guardado local: es cariño, no economía.

export const HATCH_M = 2000 // metros andados para eclosionar
export const LEVEL_M = 3000 // metros por nivel a partir de la eclosión
export const MAX_LEVEL = 20

// Cada especie tiene 3 etapas (huevo aparte): cría → adulto → veterano. El
// emoji y el nombre cambian con cada una — evolución "de verdad", no solo
// subir un número — manteniendo el tono del yermo (nada de fantasía).
export const SPECIES = [
  {
    stages: [
      { emoji: '👾', name: 'Bit' },
      { emoji: '📡', name: 'Baudio' },
      { emoji: '🛰️', name: 'Vector' },
    ],
  },
  {
    // criatura del yermo: encaja con la arena y la radiación
    stages: [
      { emoji: '🦂', name: 'Pinza' },
      { emoji: '🦞', name: 'Tenaza' },
      { emoji: '🐊', name: 'Coraza' },
    ],
  },
  {
    // guiño a Zeta-9, la inventora
    stages: [
      { emoji: '🦎', name: 'Zeta' },
      { emoji: '🦕', name: 'Relé' },
      { emoji: '🦖', name: 'Voltio' },
    ],
  },
  {
    stages: [
      { emoji: '🐛', name: 'Trasho' },
      { emoji: '🪳', name: 'Cucaracho' }, // superviviente nato, como el propio yermo
      { emoji: '🪲', name: 'Escarabajo' },
    ],
  },
  {
    stages: [
      { emoji: '🦔', name: 'Púa' },
      { emoji: '🐗', name: 'Colmillo' },
      { emoji: '🦏', name: 'Bastión' },
    ],
  },
  // Los 15 índices de abajo son nuevos (índices 5-19) — los 5 de arriba se
  // dejan intactos y en el mismo orden a propósito: partidas ya guardadas
  // referencian la especie por índice numérico (pet.species) y no debe
  // desplazarse ninguna.
  {
    stages: [
      { emoji: '🐀', name: 'Rata' },
      { emoji: '🦫', name: 'Roequín' },
      { emoji: '🦣', name: 'Coloso' },
    ],
  },
  {
    stages: [
      { emoji: '🐦', name: 'Grajo' },
      { emoji: '🐦‍⬛', name: 'Carroñero' },
      { emoji: '🦅', name: 'Rapaz' },
    ],
  },
  {
    stages: [
      { emoji: '🐸', name: 'Renacuajo' },
      { emoji: '🐢', name: 'Caparazón' },
      { emoji: '🦑', name: 'Abisal' },
    ],
  },
  {
    stages: [
      { emoji: '🦀', name: 'Cangrejo' },
      { emoji: '🐙', name: 'Pulpo' },
      { emoji: '🪼', name: 'Medusa' },
    ],
  },
  {
    stages: [
      { emoji: '🦇', name: 'Murciélago' },
      { emoji: '🦉', name: 'Nictálope' },
      { emoji: '🦨', name: 'Tóxico' },
    ],
  },
  {
    // organizada: cada etapa es más numerosa/peligrosa en enjambre, no solo más grande
    stages: [
      { emoji: '🐜', name: 'Hormiga' },
      { emoji: '🐝', name: 'Aguijón' },
      { emoji: '🦟', name: 'Plaga' },
    ],
  },
  {
    stages: [
      { emoji: '🐺', name: 'Lobo' },
      { emoji: '🦊', name: 'Cazador' },
      { emoji: '🐕‍🦺', name: 'Alfa' },
    ],
  },
  {
    stages: [
      { emoji: '🐐', name: 'Cabra' },
      { emoji: '🐏', name: 'Carnero' },
      { emoji: '🦬', name: 'Titán' },
    ],
  },
  {
    stages: [
      { emoji: '🐪', name: 'Camello' },
      { emoji: '🐫', name: 'Jorobado' },
      { emoji: '🐘', name: 'Gigante' },
    ],
  },
  {
    stages: [
      { emoji: '🦝', name: 'Mapache' },
      { emoji: '🦡', name: 'Tejón' },
      { emoji: '🐻', name: 'Oso' },
    ],
  },
  {
    stages: [
      { emoji: '🐿️', name: 'Ardilla' },
      { emoji: '🦦', name: 'Nutria' },
      { emoji: '🦭', name: 'Foca' },
    ],
  },
  {
    stages: [
      { emoji: '🐇', name: 'Conejo' },
      { emoji: '🦘', name: 'Canguro' },
      { emoji: '🐎', name: 'Corredor' },
    ],
  },
  {
    // lago radiactivo, no océano — pero el tamaño no lo sabe
    stages: [
      { emoji: '🦈', name: 'Tiburón' },
      { emoji: '🐬', name: 'Orca' },
      { emoji: '🐋', name: 'Leviatán' },
    ],
  },
  {
    stages: [
      { emoji: '🐔', name: 'Gallina' },
      { emoji: '🦃', name: 'Pavo' },
      { emoji: '🦤', name: 'Dodo' }, // el yermo revive lo que ya se había extinguido
    ],
  },
  {
    // mutación no siempre es fea: a veces solo es rosa por los minerales del agua
    stages: [
      { emoji: '🦜', name: 'Loro' },
      { emoji: '🦢', name: 'Cisne' },
      { emoji: '🦩', name: 'Flamenco' },
    ],
  },
]

export function petLevel(walkedM) {
  if (walkedM < HATCH_M) return 0
  return Math.min(MAX_LEVEL, 1 + Math.floor((walkedM - HATCH_M) / LEVEL_M))
}

// Etapa de evolución (0-2) según el nivel del Compañero
export function evoStage(level) {
  if (level >= 14) return 2
  if (level >= 7) return 1
  return 0
}

// Forma actual (emoji + nombre) de una especie según cuánto ha caminado —
// única fuente de verdad para no repetir el cálculo de etapa en cada sitio
// que pinta al Compañero.
export function petForm(speciesIndex, walkedM) {
  const stage = evoStage(petLevel(walkedM))
  return { ...SPECIES[speciesIndex].stages[stage], stage }
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

// Elige la especie al eclosionar. Con afinidad del cuestionario (ver
// factionQuiz.js) las especies más elegidas pesan más, pero +1 de base a
// todas mantiene siempre la sorpresa: ninguna queda en probabilidad cero.
export function weightedSpecies(affinity) {
  const weights = SPECIES.map((_, i) => (affinity?.[i] ?? 0) + 1)
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

// Particularidad de facción: además del cuestionario, unirte a una facción
// inclina un poco qué criatura te toca. 3 especies "afines" por facción,
// pensadas por temperamento (no exclusivas — todas siguen siendo posibles).
export const FACTION_SPECIES = {
  recicladores: [3, 14, 8], // Trasho, Mapache, Cangrejo: hurgan y reaprovechan
  anticuarios: [2, 19, 6], // Zeta, Loro, Grajo: memoria, ecos del pasado
  contrabandistas: [0, 1, 9], // Bit, Pinza, Murciélago: sigilo y tecnología
}

// Combina la afinidad del cuestionario (array de longitud 5, o null) con el
// empujón de la facción (si la tiene) en un único array de longitud
// SPECIES.length, listo para weightedSpecies().
export function combinedAffinity(quizAffinity, faction) {
  const combined = SPECIES.map((_, i) => quizAffinity?.[i] ?? 0)
  for (const i of FACTION_SPECIES[faction] ?? []) combined[i] += 2
  return combined
}
