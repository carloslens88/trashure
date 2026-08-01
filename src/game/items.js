export const RARITIES = {
  comun: { name: 'Común', color: '#94a3b8', xp: 5, value: 2, weight: 55 },
  pocoComun: { name: 'Poco común', color: '#34d399', xp: 12, value: 6, weight: 25 },
  raro: { name: 'Raro', color: '#38bdf8', xp: 30, value: 20, weight: 12 },
  epico: { name: 'Épico', color: '#a78bfa', xp: 80, value: 75, weight: 5.5 },
  reliquia: { name: 'Reliquia', color: '#fbbf24', xp: 200, value: 300, weight: 2 },
  alien: { name: 'Alienígena', color: '#22d3ee', xp: 500, value: 1500, weight: 0.5 },
}

export const RARITY_ORDER = ['comun', 'pocoComun', 'raro', 'epico', 'reliquia', 'alien']

export const CATALOG = [
  // Común
  { id: 'lata', name: 'Lata aplastada', emoji: '🥫', rarity: 'comun', desc: 'Alguien la pisó con ganas. Aún huele a atún.' },
  { id: 'brik', name: 'Brik de zumo', emoji: '🧃', rarity: 'comun', desc: 'La pajita sigue dentro. Un clásico del suelo urbano.' },
  { id: 'periodico', name: 'Periódico mojado', emoji: '🗞️', rarity: 'comun', desc: 'Noticias de ayer, humedad de hoy.' },
  { id: 'bolsa', name: 'Bolsa rota', emoji: '🛍️', rarity: 'comun', desc: 'Prometía ser reutilizable. Mintió.' },
  { id: 'vaso', name: 'Vaso de refresco', emoji: '🥤', rarity: 'comun', desc: 'Tamaño gigante. Arrepentimiento incluido.' },
  { id: 'platano', name: 'Piel de plátano', emoji: '🍌', rarity: 'comun', desc: 'Peligro cómico nivel 1. Manéjese con respeto.' },
  { id: 'calcetin', name: 'Calcetín desparejado', emoji: '🧦', rarity: 'comun', desc: 'Su pareja está en otra dimensión, como todos.' },
  { id: 'caja', name: 'Caja empapada', emoji: '📦', rarity: 'comun', desc: 'Frágil, decía. La lluvia no sabía leer.' },
  // Poco común
  { id: 'osito', name: 'Osito abandonado', emoji: '🧸', rarity: 'pocoComun', desc: 'Le falta un ojo, le sobra dignidad.' },
  { id: 'paraguas', name: 'Paraguas del revés', emoji: '☂️', rarity: 'pocoComun', desc: 'Perdió su batalla contra el viento. Honor al caído.' },
  { id: 'radio', name: 'Radio oxidada', emoji: '📻', rarity: 'pocoComun', desc: 'Solo sintoniza una emisora… y no es de este país.' },
  { id: 'bota', name: 'Bota solitaria', emoji: '🥾', rarity: 'pocoComun', desc: 'Todo río respetable pesca una de estas.' },
  { id: 'vhs', name: 'Cinta VHS', emoji: '📼', rarity: 'pocoComun', desc: '"Rebobinar antes de devolver". Nadie rebobinó.' },
  { id: 'silla', name: 'Silla coja', emoji: '🪑', rarity: 'pocoComun', desc: 'Tres patas y media. Ideal para discusiones cortas.' },
  // Raro
  { id: 'camara', name: 'Cámara antigua', emoji: '📷', rarity: 'raro', desc: 'El carrete está a medias. ¿Qué habrá en las fotos?' },
  { id: 'reloj', name: 'Reloj de péndulo', emoji: '🕰️', rarity: 'raro', desc: 'Marca las 3:33 desde hace treinta años.' },
  { id: 'trompeta', name: 'Trompeta abollada', emoji: '🎺', rarity: 'raro', desc: 'Suena a jazz triste. Quizá siempre sonó así.' },
  { id: 'llave', name: 'Llave misteriosa', emoji: '🗝️', rarity: 'raro', desc: 'No abre nada conocido. Todavía.' },
  { id: 'brujula', name: 'Brújula inquieta', emoji: '🧭', rarity: 'raro', desc: 'No señala el norte. Señala "hacia allí".' },
  // Épico
  { id: 'mapa', name: 'Mapa del tesoro', emoji: '📜', rarity: 'epico', desc: 'La X está borrosa. El tesoro, esperemos que no.' },
  { id: 'orbe', name: 'Orbe nublado', emoji: '🔮', rarity: 'epico', desc: 'Dentro se ve el futuro: dice que sigas buscando.' },
  { id: 'guitarra', name: 'Guitarra astillada', emoji: '🎸', rarity: 'epico', desc: 'Solo le queda una cuerda. Con eso basta para el último acorde de alguien.' },
  { id: 'videocamara', name: 'Cámara de videovigilancia', emoji: '📹', rarity: 'epico', desc: 'Grabó algo la noche de la Invasión. La cinta desapareció. Convenientemente.' },
  // Retirados del spawn (desencajaban con el tono postapocalíptico), pero se
  // mantienen aquí para que quien ya los tenga siga viéndolos y pudiéndolos
  // vender con normalidad — ver byRarity en spawn.js y Catalog.jsx.
  { id: 'corona', name: 'Corona abollada', emoji: '👑', rarity: 'epico', desc: 'Algún rey tuvo un día muy malo.', retired: true },
  { id: 'espada', name: 'Espada oxidada', emoji: '⚔️', rarity: 'epico', desc: 'Legendaria según el óxido. El óxido no miente.', retired: true },
  // Reliquia
  { id: 'anfora', name: 'Ánfora romana', emoji: '🏺', rarity: 'reliquia', desc: 'Dos mil años esperando en un contenedor.' },
  { id: 'doblon', name: 'Doblón español', emoji: '🪙', rarity: 'reliquia', desc: 'Brilla con historias de galeones y tormentas.' },
  { id: 'fosil', name: 'Fósil imposible', emoji: '🦴', rarity: 'reliquia', desc: 'Los paleontólogos prefieren no hablar de esto.' },
  { id: 'collar', name: 'Collar faraónico', emoji: '📿', rarity: 'reliquia', desc: 'Maldición no confirmada. Probablemente.' },
  // Alienígena
  { id: 'nave', name: 'Fragmento de nave', emoji: '🛸', rarity: 'alien', desc: 'Los Desechadores no reciclaban. Qué suerte la nuestra.' },
  { id: 'plasma', name: 'Batería de plasma', emoji: '🔋', rarity: 'alien', desc: 'Al 2 % desde hace un milenio. Aún da calambre.' },
  { id: 'anomalia', name: 'Anomalía portátil', emoji: '🌀', rarity: 'alien', desc: 'No la mires fijamente. Ella sí te mira.' },
  { id: 'huevo', name: 'Huevo luminoso', emoji: '🥚', rarity: 'alien', desc: 'Está calentito. El Gremio dice que es normal. El Gremio miente.' },
]

export const BY_ID = Object.fromEntries(CATALOG.map((t) => [t.id, t]))

export const FACTIONS = {
  recicladores: {
    name: 'Recicladores',
    emoji: '♻️',
    motto: 'Nada es basura.',
    perk: '+25 % de Chatarra al vender comunes y poco comunes al Gremio.',
    color: '#10b981',
  },
  anticuarios: {
    name: 'Anticuarios',
    emoji: '🏺',
    motto: 'El pasado paga bien.',
    perk: '+25 % de XP con hallazgos raros, épicos y reliquias.',
    color: '#f59e0b',
  },
  contrabandistas: {
    name: 'Contrabandistas',
    emoji: '🛸',
    motto: 'El Gremio no hace preguntas.',
    perk: 'Tasa del mercado al 5 % cuando vendes (los demás pagan 10 %).',
    color: '#22d3ee',
  },
}

export function levelInfo(xp) {
  let level = 1
  let need = 60
  let into = xp
  while (into >= need) {
    into -= need
    level++
    need = 60 * level
  }
  return { level, into, need }
}
