// Cuestionario de estilo de juego: recomienda una facción y, a la vez,
// pondera la especie que tendrá más probabilidad de salir cuando eclosione
// el Huevo del Compañero (ver pet.js: weightedSpecies). No obliga a nada —
// solo orienta; el jugador sigue eligiendo la facción a mano.
// Índices de especie: 0 Bit, 1 Pinza, 2 Zeta, 3 Trasho, 4 Púa (ver pet.js).

export const QUIZ = [
  {
    q: '¿Qué haces cuando encuentras un alijo de desechos sin reclamar?',
    options: [
      { label: 'Lo clasifico todo: nada se tira si aún sirve.', faction: 'recicladores', species: 3 },
      { label: 'Busco la pieza más antigua y la examino con calma.', faction: 'anticuarios', species: 2 },
      { label: 'Cojo lo valioso y desaparezco antes de que llegue nadie.', faction: 'contrabandistas', species: 1 },
    ],
  },
  {
    q: 'Un forastero te ofrece un trueque que suena demasiado bueno. ¿Qué piensas?',
    options: [
      { label: 'Prefiero rechazarlo: mejor ganarlo reciclando con mis manos.', faction: 'recicladores', species: 4 },
      { label: 'Acepto solo si demuestra que la pieza es auténtica.', faction: 'anticuarios', species: 0 },
      { label: 'Acepto sin preguntas: el riesgo también es negocio.', faction: 'contrabandistas', species: 0 },
    ],
  },
  {
    q: 'De noche, en el yermo, ¿qué te hace sentir a salvo?',
    options: [
      { label: 'Un buen refugio hecho con lo que otros descartaron.', faction: 'recicladores', species: 3 },
      { label: 'Tener catalogado cada objeto raro que llevo encima.', faction: 'anticuarios', species: 2 },
      { label: 'Conocer una ruta que nadie más conoce.', faction: 'contrabandistas', species: 1 },
    ],
  },
  {
    q: 'El Reclamador de la región despierta. ¿Cuál es tu papel en el asalto?',
    options: [
      { label: 'Aguantar en primera línea: proteger lo que recuperamos.', faction: 'recicladores', species: 4 },
      { label: 'Documentar el combate: esto será historia algún día.', faction: 'anticuarios', species: 2 },
      { label: 'Aprovechar el caos para colarme donde no debo.', faction: 'contrabandistas', species: 0 },
    ],
  },
  {
    q: 'Si pudieras quedarte con un solo hallazgo de toda tu carrera, ¿cuál sería?',
    options: [
      { label: 'Algo roto que reparé con mis propias manos.', faction: 'recicladores', species: 3 },
      { label: 'La reliquia más rara que haya visto jamás.', faction: 'anticuarios', species: 0 },
      { label: 'Algo que nadie más sabe que tengo.', faction: 'contrabandistas', species: 1 },
    ],
  },
]

// answers: array de opciones elegidas (una por pregunta)
export function scoreQuiz(answers) {
  const factionScore = { recicladores: 0, anticuarios: 0, contrabandistas: 0 }
  const speciesScore = [0, 0, 0, 0, 0]
  for (const a of answers) {
    factionScore[a.faction]++
    speciesScore[a.species]++
  }
  const recommended = Object.entries(factionScore).sort((a, b) => b[1] - a[1])[0][0]
  return { factionScore, speciesScore, recommended }
}
