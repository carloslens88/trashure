// i18n minimalista: la clave ES el texto en español (fuente de verdad del
// juego) y EN aporta la traducción. t() devuelve la clave tal cual en español
// o si falta la traducción — imposible romper el juego por una clave olvidada.
// Los huecos se escriben {asi} y se rellenan con el segundo argumento.

const LANG_KEY = 'trashure-lang'

function detect() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'es' || saved === 'en') return saved
  } catch {
    /* sin storage */
  }
  return (navigator.language ?? 'es').toLowerCase().startsWith('es') ? 'es' : 'en'
}

let lang = detect()

export function getLang() {
  return lang
}

// Cambiar de idioma recarga la app: t() es estático por sesión y así no hay
// que replantear el árbol de React entero.
export function setLang(next) {
  try {
    localStorage.setItem(LANG_KEY, next)
  } catch {
    /* sin storage */
  }
  window.location.reload()
}

export function locale() {
  return lang === 'en' ? 'en' : 'es'
}

export function t(key, vars) {
  let out = lang === 'en' ? (EN[key] ?? key) : key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, v)
  }
  return out
}

const EN = {
  // ---------- Rarezas ----------
  'Común': 'Common',
  'Poco común': 'Uncommon',
  'Raro': 'Rare',
  'Épico': 'Epic',
  'Reliquia': 'Relic',
  'Alienígena': 'Alien',

  // ---------- Catálogo de objetos ----------
  'Lata aplastada': 'Crushed can',
  'Alguien la pisó con ganas. Aún huele a atún.': 'Someone stomped it with feeling. Still smells of tuna.',
  'Brik de zumo': 'Juice carton',
  'La pajita sigue dentro. Un clásico del suelo urbano.': 'The straw is still inside. A classic of the urban floor.',
  'Periódico mojado': 'Soggy newspaper',
  'Noticias de ayer, humedad de hoy.': "Yesterday's news, today's damp.",
  'Bolsa rota': 'Torn bag',
  'Prometía ser reutilizable. Mintió.': 'It promised to be reusable. It lied.',
  'Vaso de refresco': 'Soda cup',
  'Tamaño gigante. Arrepentimiento incluido.': 'Giant size. Regret included.',
  'Piel de plátano': 'Banana peel',
  'Peligro cómico nivel 1. Manéjese con respeto.': 'Comedy hazard level 1. Handle with respect.',
  'Calcetín desparejado': 'Odd sock',
  'Su pareja está en otra dimensión, como todos.': "Its partner is in another dimension, like they all are.",
  'Caja empapada': 'Soaked box',
  'Frágil, decía. La lluvia no sabía leer.': 'It said "fragile". The rain could not read.',
  'Osito abandonado': 'Abandoned teddy',
  'Le falta un ojo, le sobra dignidad.': 'Missing one eye, dignity intact.',
  'Paraguas del revés': 'Inside-out umbrella',
  'Perdió su batalla contra el viento. Honor al caído.': 'It lost its battle with the wind. Honor the fallen.',
  'Radio oxidada': 'Rusty radio',
  'Solo sintoniza una emisora… y no es de este país.': "Only tunes one station… and it's not from this country.",
  'Bota solitaria': 'Lonely boot',
  'Todo río respetable pesca una de estas.': 'Every respectable river catches one of these.',
  'Cinta VHS': 'VHS tape',
  '"Rebobinar antes de devolver". Nadie rebobinó.': '"Please rewind before returning." Nobody rewound.',
  'Silla coja': 'Wobbly chair',
  'Tres patas y media. Ideal para discusiones cortas.': 'Three and a half legs. Ideal for short arguments.',
  'Cámara antigua': 'Antique camera',
  'El carrete está a medias. ¿Qué habrá en las fotos?': "The film is half used. What's on those photos?",
  'Reloj de péndulo': 'Pendulum clock',
  'Marca las 3:33 desde hace treinta años.': "It's read 3:33 for thirty years.",
  'Trompeta abollada': 'Dented trumpet',
  'Suena a jazz triste. Quizá siempre sonó así.': 'It sounds like sad jazz. Maybe it always did.',
  'Llave misteriosa': 'Mysterious key',
  'No abre nada conocido. Todavía.': "Opens nothing known. Yet.",
  'Brújula inquieta': 'Restless compass',
  'No señala el norte. Señala "hacia allí".': 'It doesn\'t point north. It points "over there".',
  'Mapa del tesoro': 'Treasure map',
  'La X está borrosa. El tesoro, esperemos que no.': "The X is smudged. Let's hope the treasure isn't.",
  'Corona abollada': 'Dented crown',
  'Algún rey tuvo un día muy malo.': 'Some king had a very bad day.',
  'Orbe nublado': 'Clouded orb',
  'Dentro se ve el futuro: dice que sigas buscando.': 'You can see the future inside: it says keep searching.',
  'Espada oxidada': 'Rusty sword',
  'Legendaria según el óxido. El óxido no miente.': "Legendary, according to the rust. Rust doesn't lie.",
  'Guitarra astillada': 'Splintered guitar',
  'Solo le queda una cuerda. Con eso basta para el último acorde de alguien.': "It has one string left. That's enough for someone's last chord.",
  'Cámara de videovigilancia': 'CCTV camera',
  'Grabó algo la noche de la Invasión. La cinta desapareció. Convenientemente.': 'It recorded something the night of the Invasion. The tape went missing. Conveniently.',
  'Ánfora romana': 'Roman amphora',
  'Dos mil años esperando en un contenedor.': 'Two thousand years waiting in a dumpster.',
  'Doblón español': 'Spanish doubloon',
  'Brilla con historias de galeones y tormentas.': 'It gleams with tales of galleons and storms.',
  'Fósil imposible': 'Impossible fossil',
  'Los paleontólogos prefieren no hablar de esto.': 'Paleontologists prefer not to talk about this.',
  'Collar faraónico': "Pharaoh's necklace",
  'Maldición no confirmada. Probablemente.': 'Curse unconfirmed. Probably.',
  'Fragmento de nave': 'Ship fragment',
  'Los Desechadores no reciclaban. Qué suerte la nuestra.': "The Discarders didn't recycle. Lucky us.",
  'Batería de plasma': 'Plasma battery',
  'Al 2 % desde hace un milenio. Aún da calambre.': 'At 2% for a millennium. Still gives a jolt.',
  'Anomalía portátil': 'Portable anomaly',
  'No la mires fijamente. Ella sí te mira.': "Don't stare at it. It stares at you.",
  'Huevo luminoso': 'Glowing egg',
  'Está calentito. El Gremio dice que es normal. El Gremio miente.': "It's warm. The Guild says that's normal. The Guild lies.",

  // ---------- Facciones ----------
  'Recicladores': 'Recyclers',
  'Nada es basura.': 'Nothing is trash.',
  '+25 % de Chatarra al vender comunes y poco comunes al Gremio.': '+25% Scrap when selling commons and uncommons to the Guild.',
  'Anticuarios': 'Antiquarians',
  'El pasado paga bien.': 'The past pays well.',
  '+25 % de XP con hallazgos raros, épicos y reliquias.': '+25% XP from rare, epic and relic finds.',
  'Contrabandistas': 'Smugglers',
  'El Gremio no hace preguntas.': 'The Guild asks no questions.',
  'Tasa del mercado al 5 % cuando vendes (los demás pagan 10 %).': '5% market fee when you sell (everyone else pays 10%).',

  // ---------- Eventos de zona ----------
  'Marea de Chatarra': 'Scrap Tide',
  'La zona rebosa de objetos abandonados.': 'The area overflows with abandoned objects.',
  'Eco de Reliquias': 'Relic Echo',
  'Los Desechadores pasaron por aquí: rarezas a flor de suelo.': 'The Discarders passed through here: rarities just under the dust.',
  'Señal Alienígena': 'Alien Signal',
  'Algo emite desde esta zona…': 'Something is transmitting from this area…',

  // ---------- Diario del Desechador ----------
  'Fragmento I — La escala': 'Fragment I — The stopover',
  'Día 1 del tránsito. Este planeta azul no figura en las cartas. Nos detendremos solo a vaciar las bodegas.': 'Transit day 1. This blue planet is not on the charts. We stop only to empty the holds.',
  'Fragmento II — El vaciado': 'Fragment II — The dumping',
  'El capitán ordenó soltarlo todo: máquinas rotas, reliquias de mundos muertos, juguetes de la tripulación. "Que lo herede el barro", dijo.': 'The captain ordered everything dropped: broken machines, relics of dead worlds, the crew\'s toys. "Let the mud inherit it," he said.',
  'Fragmento III — Los nativos': 'Fragment III — The natives',
  'Hay criaturas aquí. Pequeñas, curiosas, incansables. Recogen lo que tiramos y lo llaman tesoro. Nos hace gracia. Nos hace algo más que gracia.': 'There are creatures here. Small, curious, tireless. They pick up what we throw away and call it treasure. It amuses us. It does something more than amuse us.',
  'Fragmento IV — La inventora': 'Fragment IV — The inventor',
  'Zeta-9 desobedeció: no tira su carga, la esconde. Dice que esconder es una forma de regalar despacio.': 'Zeta-9 disobeyed: she doesn\'t dump her cargo, she hides it. She says hiding is a way of giving slowly.',
  'Fragmento V — Los escondites': 'Fragment V — The caches',
  'Ahora todos lo hacemos. Cada amanecer, un alijo nuevo bajo el polvo. Marcamos las rutas con señales que solo una brújula terca sabría seguir.': 'Now we all do it. Every dawn, a new stash under the dust. We mark the routes with signs only a stubborn compass could follow.',
  'Fragmento VI — El Gremio': 'Fragment VI — The Guild',
  'Las criaturas se organizaron. Compran, venden, trocan. Le pusieron nombre a nuestro rastro: "basura". Qué palabra tan pequeña para tanto viaje.': 'The creatures organized. They buy, sell, barter. They gave our trail a name: "trash". Such a small word for such a long journey.',
  'Fragmento VII — La avería': 'Fragment VII — The breakdown',
  'La nave no arranca. La batería principal está al 2 %. Irónico: hemos tirado diez mil baterías en este planeta.': "The ship won't start. The main battery is at 2%. Ironic: we've dumped ten thousand batteries on this planet.",
  'Fragmento VIII — La búsqueda': 'Fragment VIII — The search',
  'Zeta-9 propone lo impensable: pedir ayuda a los recolectores. Nadie conoce nuestros desechos mejor que ellos.': 'Zeta-9 proposes the unthinkable: asking the collectors for help. Nobody knows our refuse better than they do.',
  'Fragmento IX — El pacto': 'Fragment IX — The pact',
  'Trato hecho: ellos rastrean, nosotros escondemos maravillas. El Gremio no hace preguntas. Los Contrabandistas, menos.': 'Deal struck: they track, we hide wonders. The Guild asks no questions. The Smugglers, even fewer.',
  'Fragmento X — El huevo': 'Fragment X — The egg',
  'Inventario final: falta un huevo de incubadora. Si alguien lo encuentra… que lo mantenga calentito. Y que no se encariñe. (Se encariñará.)': "Final inventory: one incubator egg missing. If someone finds it… keep it warm. And don't get attached. (They'll get attached.)",
  'Fragmento XI — La partida': 'Fragment XI — The departure',
  'Despegamos al alba. Dejamos atrás un planeta lleno de nuestras cosas y criaturas que las cuidan mejor que nosotros.': 'We lift off at dawn. We leave behind a planet full of our things and creatures who care for them better than we did.',
  'Fragmento XII — La promesa': 'Fragment XII — The promise',
  'Última anotación: volveremos. No a recoger lo nuestro, sino a ver en qué lo habéis convertido. Seguid buscando, recolectores.': "Last entry: we will return. Not to take back what's ours, but to see what you've turned it into. Keep searching, collectors.",

  // ---------- Títulos ----------
  'Barrendero del Yermo': 'Wasteland Sweeper',
  'Ropavejero': 'Ragpicker',
  'Ojo de Halcón': 'Hawk Eye',
  'Cazatesoros': 'Treasure Hunter',
  'Anticuario Legendario': 'Legendary Antiquarian',
  'Amigo de los Desechadores': 'Friend of the Discarders',
  'Superviviente': 'Survivor',
  'Rata del Yermo': 'Wasteland Rat',
  'Magnate de la Chatarra': 'Scrap Tycoon',
  'Leyenda del Páramo': 'Legend of the Barrens',

  // ---------- App: toasts, banners, intro, pestañas ----------
  '🎉 ¡Nivel {n}!': '🎉 Level {n}!',
  '🛰️ GPS activo: para moverte, ¡camina!': '🛰️ GPS active: to move, walk!',
  '📵 Activa la ubicación: Trashure se juega caminando': '📵 Enable location: Trashure is played by walking',
  '📵 Activa la ubicación para recoger objetos': '📵 Enable location to collect items',
  '¡Demasiado lejos! Acércate para recogerlo 🚶': 'Too far! Get closer to collect it 🚶',
  '⚖️ El Gremio rechazó la recogida: {e}': '⚖️ The Guild rejected the pickup: {e}',
  'No se pudo vender: {e}': "Couldn't sell: {e}",
  '📵 Activa la ubicación para abrir escondites': '📵 Enable location to open caches',
  '🧭 La brújula vibra… pero aún no estás encima': "🧭 The compass trembles… but you're not on top of it yet",
  '⚖️ El Gremio no lo reconoce: {e}': "⚖️ The Guild doesn't recognize it: {e}",
  '{emoji} ¡Bienvenido a los {name}!': '{emoji} Welcome to the {name}!',
  'No se pudo: {e}': "Couldn't do it: {e}",
  '🗺️ ¡{n} sectores del yermo cartografiados!': '🗺️ {n} wasteland sectors charted!',
  '🌪️ Tormenta tóxica: la niebla ha reclamado {n} sectores': '🌪️ Toxic storm: the fog has reclaimed {n} sectors',
  '☠️ Huiste de la anomalía: la radiación borró tu racha': '☠️ You fled the anomaly: the radiation erased your streak',
  '☢️ Anomalía radiactiva: recoge el botín antes de irte o perderás tu racha': '☢️ Radioactive anomaly: grab the loot before leaving or you\'ll lose your streak',
  '🛸 ¡VIGILANCIA ALIENÍGENA! ×2 XP mientras dure': '🛸 ALIEN SURVEILLANCE! ×2 XP while it lasts',
  '🛸 VIGILANCIA ALIENÍGENA — ×2 XP': '🛸 ALIEN SURVEILLANCE — ×2 XP',
  '☢️ ANOMALÍA RADIACTIVA — recoge el botín o perderás tu racha': "☢️ RADIOACTIVE ANOMALY — grab the loot or you'll lose your streak",
  '🛰️ Buscando tu señal GPS…': '🛰️ Searching for your GPS signal…',
  '🛰️ Llevamos un rato sin encontrar tu señal. Revisa que la Localización esté activada para ESTE navegador en los ajustes del sistema (no solo el permiso del sitio) y que no esté en modo avión.':
    "🛰️ We've been searching a while with no signal. Check that Location is turned on for THIS browser in your system settings (not just the site permission), and that airplane mode is off.",
  '📵 Tu navegador bloqueó la ubicación. Actívala en los ajustes del sitio (icono junto a la barra de direcciones) y toca aquí para reintentar.':
    '📵 Your browser blocked location access. Turn it on in the site settings (icon next to the address bar) and tap here to retry.',
  '🛰️ Buscando…': '🛰️ Searching…',
  '📵 Sin GPS': '📵 No GPS',
  '🚶 Paseo (pruebas)': '🚶 Stroll (testing)',
  'Sobreviviste, Recolector': 'You survived, Collector',
  'Los Desechadores arrasaron la Tierra y se marcharon. Entre las ruinas, cada objeto es supervivencia — y tu facción cuenta contigo.': 'The Discarders razed the Earth and left. Among the ruins, every object is survival — and your faction is counting on you.',
  'Camina de verdad': 'Walk for real',
  '(con la ubicación activada) y ': '(with location enabled) and ',
  'toca los objetos': 'tap the objects',
  ' dentro de tu círculo para recuperarlos. El yermo se renueva cada 10 minutos. Y cuidado: ': ' inside your circle to recover them. The wasteland renews every 10 minutes. And beware: ',
  'la Niebla Tóxica': 'the Toxic Fog',
  ' lo cubre todo — solo se despeja por donde tú caminas.': ' covers everything — it only clears where you walk.',
  '¡A chatarrear! 🚀': "Let's scavenge! 🚀",
  'Mapa': 'Map',
  'Mochila': 'Backpack',
  'Catálogo': 'Catalog',
  'Mercado': 'Market',
  'Ranking': 'Leaderboard',
  'Contratos del Gremio': 'Guild Contracts',

  // ---------- HUD ----------
  'Tu cuenta': 'Your account',
  'Racha diaria: +{p} % XP': 'Daily streak: +{p}% XP',
  '🔥 Racha en peligro: recoge algo hoy para mantenerla': '🔥 Streak at risk: collect something today to keep it',
  'La lluvia destapa cosas: +25 % XP': 'Rain uncovers things: +25% XP',
  '🌧️ Tormenta': '🌧️ Storm',
  '👥 {n} cerca': '👥 {n} nearby',
  'Sonido': 'Sound',
  '🛰️ GPS': '🛰️ GPS',

  // ---------- MapView ----------
  'Centrar en el jugador': 'Center on player',
  '📡 El mapa no consigue cargar. Si usas el ahorro de datos o una VPN del navegador, prueba a desactivarlo.':
    "📡 The map can't load. If you use your browser's data saver or a built-in VPN, try turning it off.",
  'Reintentar': 'Retry',

  // ---------- Mochila ----------
  '🎒 Mochila': '🎒 Backpack',
  'Tu mochila está vacía. ¡Sal al mapa y toca la basura que veas cerca!': 'Your backpack is empty. Head to the map and tap the trash you see nearby!',
  'Vender +{v} ⚙️': 'Sell +{v} ⚙️',
  'El Gremio de Recolectores compra cualquier cosa. Cualquiera.': "The Collectors' Guild buys anything. Anything.",

  // ---------- Catálogo ----------
  '📖 Catálogo': '📖 Catalog',
  '{d}/{t} objetos descubiertos': '{d}/{t} objects discovered',
  'Verificado por el Gremio: {a}/{b}': 'Verified by the Guild: {a}/{b}',
  '🏅 Reclamado': '🏅 Claimed',
  'Set completo: +{n} ⚙️': 'Set complete: +{n} ⚙️',
  '🏅 ¡Set completado! +{n} ⚙️ y título nuevo': '🏅 Set completed! +{n} ⚙️ and a new title',
  'No se pudo reclamar: {e}': "Couldn't claim: {e}",
  '¿?': '?¿',
  '📜 Diario del Desechador': "📜 The Discarder's Journal",
  '{a}/{b} fragmentos — cada Escondite que encuentres desbloquea el siguiente': '{a}/{b} fragments — every Cache you find unlocks the next one',
  'Sigue la brújula para descifrarlo…': 'Follow the compass to decipher it…',

  // ---------- Recogida ----------
  '¡A la mochila! 🎒': 'Into the backpack! 🎒',
  'Dejarlo en el suelo': 'Leave it on the ground',

  // ---------- Brújula y escondites ----------
  '🗝️ Escondite': '🗝️ Cache',
  '¡Muy cerca!': 'Very close!',
  'Escondite de los Desechadores': 'Discarders\' Cache',
  'Un Escondite de los Desechadores': "A Discarders' Cache",
  'La brújula no mentía: aquí hay algo enterrado hace mucho, esperándote.': "The compass wasn't lying: something was buried here long ago, waiting for you.",
  'Abrirlo 🗝️': 'Open it 🗝️',
  'Todavía no': 'Not yet',
  'Guardar el secreto 🎒': 'Keep the secret 🎒',

  // ---------- Facciones (modal) ----------
  'Elige tu facción': 'Choose your faction',
  'El Gremio exige lealtades. La decisión es ': 'The Guild demands loyalty. The decision is ',
  'para siempre': 'forever',
  'Decidir más tarde': 'Decide later',
  '★ Recomendada para ti': '★ Recommended for you',

  // ---------- Cuestionario de facción ----------
  '¿Qué clase de recolector eres?': 'What kind of collector are you?',
  'Responde y el Gremio te sugerirá una facción y verá algo de ti en tu Compañero.':
    'Answer and the Guild will suggest a faction — and something of you will show up in your Companion.',
  'Prefiero elegir sin cuestionario': "I'd rather choose without the quiz",
  '¿Qué haces cuando encuentras un alijo de desechos sin reclamar?':
    'What do you do when you find an unclaimed stash of scrap?',
  'Lo clasifico todo: nada se tira si aún sirve.': "I sort it all: nothing's thrown out if it still works.",
  'Busco la pieza más antigua y la examino con calma.': 'I look for the oldest piece and study it slowly.',
  'Cojo lo valioso y desaparezco antes de que llegue nadie.': "I grab what's valuable and vanish before anyone shows up.",
  'Un forastero te ofrece un trueque que suena demasiado bueno. ¿Qué piensas?':
    'A stranger offers you a trade that sounds too good. What do you think?',
  'Prefiero rechazarlo: mejor ganarlo reciclando con mis manos.': "I'd rather turn it down — better to earn it recycling with my own hands.",
  'Acepto solo si demuestra que la pieza es auténtica.': "I'll accept only if they prove the piece is authentic.",
  'Acepto sin preguntas: el riesgo también es negocio.': 'I accept no questions asked — risk is business too.',
  'De noche, en el yermo, ¿qué te hace sentir a salvo?': 'At night, in the wasteland, what makes you feel safe?',
  'Un buen refugio hecho con lo que otros descartaron.': 'A good shelter built from what others threw away.',
  'Tener catalogado cada objeto raro que llevo encima.': 'Having every rare item I carry fully catalogued.',
  'Conocer una ruta que nadie más conoce.': 'Knowing a route nobody else knows.',
  'El Reclamador de la región despierta. ¿Cuál es tu papel en el asalto?':
    "The region's Reclaimer wakes up. What's your role in the assault?",
  'Aguantar en primera línea: proteger lo que recuperamos.': 'Holding the front line: protecting what we recover.',
  'Documentar el combate: esto será historia algún día.': "Documenting the fight — this'll be history someday.",
  'Aprovechar el caos para colarme donde no debo.': 'Using the chaos to sneak in where I shouldn\'t.',
  'Si pudieras quedarte con un solo hallazgo de toda tu carrera, ¿cuál sería?':
    'If you could keep just one find from your whole career, what would it be?',
  'Algo roto que reparé con mis propias manos.': 'Something broken that I fixed with my own hands.',
  'La reliquia más rara que haya visto jamás.': "The rarest relic I've ever seen.",
  'Algo que nadie más sabe que tengo.': 'Something nobody else knows I have.',

  // ---------- Duelos ----------
  'Únete a una facción antes de retar a nadie.': 'Join a faction before challenging anyone.',
  '{name} aún no jura lealtad a ninguna facción. Nada que retar.':
    "{name} hasn't sworn loyalty to any faction yet. Nothing to challenge.",
  'Ese recolector': 'That collector',
  'Es de tu propia facción. Aquí no hay nada que demostrar.': "They're from your own faction. Nothing to prove here.",
  'Demasiado lejos para un duelo. Acércate.': "Too far for a duel. Get closer.",
  'Ya os habéis retado hace poco. Dadle un respiro.': "You two already faced off recently. Give it a rest.",
  '⚔️ ¡Victoria! El Gremio llevará la cuenta de tus duelos ganados.': "⚔️ Victory! The Guild will keep count of your duel wins.",
  '⚔️ ¡Victoria! +10 puntos para la guerra semanal de tu facción.': "⚔️ Victory! +10 points for your faction's weekly war.",
  'Nadie pierde nada por retar ni por perder. Los primeros 5 del día suman puntos a la guerra semanal de tu facción.':
    "Nobody loses anything by challenging or losing. Your first 5 wins each day add points to your faction's weekly war.",
  '⚔️ Has perdido este pulso… la próxima vez toca más rápido.': "⚔️ You lost this round… tap faster next time.",
  '¿Retar a {name}?': 'Challenge {name}?',
  'este recolector': 'this collector',
  'Es de los ': "They're from the ",
  '. Un pulso de reflejos, nada más — nadie pierde lo que lleva encima.':
    ". Just a tap contest — nobody loses what they're carrying.",
  '¡Adelante! ⚔️': 'Go for it! ⚔️',
  'Mejor no': 'Better not',
  '⚔️ Duelo contra {name}': '⚔️ Duel against {name}',
  'un rival': 'a rival',
  '¡TOCA! 👊': 'TAP! 👊',
  '{n} toques más para ganar': '{n} more taps to win',
  '⚔️ Duelos': '⚔️ Duels',
  '{n} duelos ganados contra rivales': '{n} duels won against rivals',
  'Solo cuenta orgullo, no Chatarra: nadie pierde nada por retar ni por perder.':
    "Only pride is on the line, not Scrap: nobody loses anything by challenging or losing.",

  // ---------- Reclutamiento de divergentes ----------
  'Te han echado el ojo': "They've got their eye on you",
  '{name}, de los {faction}, te ha visto merodear por su territorio.':
    '{name}, of the {faction}, has seen you lurking around their territory.',
  'Recuerda: unirte a una facción es ': 'Remember: joining a faction is ',
  'Unirme a los {faction}': 'Join the {faction}',
  'Seguir por libre': 'Stay independent',
  'Un recolector': 'A collector',

  // ---------- Núcleo del Desechador ----------
  'El Núcleo del Desechador — solo hay uno hoy en todo el yermo':
    "The Discarder's Core — there's only one today in the whole wasteland",
  '🌌 Núcleo': '🌌 Core',
  '🌌 ¡Eres el Portador del Núcleo de hoy! Título exclusivo conseguido — nadie más podrá tenerlo hasta mañana':
    "🌌 You're today's Core Bearer! Exclusive title unlocked — nobody else can get it until tomorrow",
  'alguien se te adelantó: el Núcleo de hoy ya tiene dueño': 'someone beat you to it: today\'s Core already has an owner',
  'el Núcleo de ese día ya cambió de sitio': "that day's Core has already moved on",
  'Cada día solo hay uno en todo el yermo. Hoy, alguien lo tendrá. ¿Serás tú?':
    "There's only one in the whole wasteland each day. Someone will have it today. Will it be you?",
  'Núcleo del Desechador': "Discarder's Core",
  'Portador del Núcleo': 'Core Bearer',

  // ---------- Fusión de objetos ----------
  '✨ ¡{a} evolucionó a {b}!': '✨ {a} evolved into {b}!',
  'No se pudo fusionar: {e}': "Couldn't fuse it: {e}",
  'Funde {n} de estos en 1 {name}': 'Fuse {n} of these into 1 {name}',
  '✨ Fusionar ({have}/{need}) → {emoji}': '✨ Fuse ({have}/{need}) → {emoji}',
  'ese objeto no se puede fusionar': "that item can't be fused",
  'necesitas 5 unidades libres de ese objeto para fusionar': 'you need 5 free units of that item to fuse',

  // ---------- Cofre del Gremio ----------
  'Cofre del Gremio': "Guild's Chest",
  'Sellado hace quién sabe cuánto. Una Llave misteriosa podría forzarlo — aunque no todas abren algo.':
    "Sealed who knows how long ago. A Mysterious key might force it open — though not every key works.",
  'Tienes {n} llave(s). Forzarlo consume una, abra o no.': 'You have {n} key(s). Forcing it uses one, whether it opens or not.',
  'Forzar la cerradura 🗝️': 'Force the lock 🗝️',
  'Necesitas una Llave misteriosa (objeto raro) para intentarlo.': 'You need a Mysterious key (a rare item) to try.',
  'La llave encajó. El Gremio se pregunta qué más habrá cerrado.': 'The key fit. The Guild wonders what else it might have locked.',
  'La llave no encajaba…': "The key didn't fit…",
  'Se rompió en el intento. El cofre sigue ahí, cerrado, para el siguiente que lo intente.':
    'It broke in the attempt. The chest is still there, locked, for the next one to try.',
  'Necesitas estar conectado para forzar cofres.': 'You need to be online to force chests open.',
  '📵 Activa la ubicación para forzar cofres': '📵 Turn on location to force chests open',
  'No se pudo forzar el cofre: {e}': "Couldn't force the chest: {e}",
  'Cofre del Gremio — hace falta una Llave misteriosa': "Guild's Chest — needs a Mysterious key",
  '🔒 Cofre': '🔒 Chest',
  'ese cofre ya cambió de sitio': 'that chest already moved elsewhere',
  'necesitas una Llave misteriosa libre (que no esté en venta) para forzarlo':
    'you need a free Mysterious key (not listed for sale) to force it',
  'no se pudo abrir el cofre': "couldn't open the chest",

  // ---------- Skins ----------
  '🤖 Tu robot': '🤖 Your robot',
  '👕 Vestuario': '👕 Wardrobe',
  'Sin skin': 'No skin',
  'Exclusiva de {faction}': 'Exclusive to {faction}',
  '✨ ¡Skin adquirida!': '✨ Skin acquired!',
  'No se pudo equipar: {e}': "Couldn't equip it: {e}",
  'esa skin no existe': "that skin doesn't exist",
  'esa skin es exclusiva de otra facción': 'that skin is exclusive to another faction',
  'ya tienes esa skin': 'you already have that skin',
  'no tienes esa skin': "you don't have that skin",

  // ---------- Tarjeta de hallazgo ----------
  '📤 Compartir hallazgo': '📤 Share find',
  '📤 Tarjeta de hallazgo': '📤 Find card',
  'Compartir 📤': 'Share 📤',
  'Descargar imagen': 'Download image',
  'Cerrar': 'Close',
  '¡Mira lo que he encontrado en Trashure!': 'Look what I found in Trashure!',
  'Encontrado por {name} en el yermo': 'Found by {name} in the wasteland',
  'Encontrado en el yermo': 'Found in the wasteland',

  // ---------- Mercado y trueques ----------
  '🏪 Mercado': '🏪 Market',
  '🛒 Comprar': '🛒 Buy',
  '🏷️ Vender': '🏷️ Sell',
  '🤝 Trueques': '🤝 Barter',
  'El mercado y los trueques necesitan el modo online.': 'The market and barter need online mode.',
  'Consultando el mercado…': 'Checking the market…',
  'El mercado está vacío. ¡Sé quien estrene el tablón!': 'The market is empty. Be the first on the board!',
  '🛒 ¡Comprado! Ya está en tu mochila': "🛒 Bought! It's in your backpack",
  'No se pudo comprar: {e}': "Couldn't buy: {e}",
  'tuyo': 'yours',
  'Recolector': 'Collector',
  'Abriendo tu alijo…': 'Opening your stash…',
  '🏷️ Tus anuncios': '🏷️ Your listings',
  'Retirar': 'Withdraw',
  '🎒 Publicar del alijo': '🎒 List from your stash',
  'No tienes objetos verificados sin publicar.': 'You have no verified items left to list.',
  'Gremio: {v} ⚙️': 'Guild: {v} ⚙️',
  'Publicar': 'List',
  'Pon un precio válido (mínimo 1 ⚙️)': 'Set a valid price (minimum 1 ⚙️)',
  '🏷️ ¡Publicado en el mercado!': '🏷️ Listed on the market!',
  'No se pudo publicar: {e}': "Couldn't list it: {e}",
  'No se pudo retirar: {e}': "Couldn't withdraw it: {e}",
  'La tasa del Gremio es del 10 % (5 % para Contrabandistas) y se quema.': "The Guild's fee is 10% (5% for Smugglers) and it is burned.",
  '⏳ Pendiente': '⏳ Pending',
  '✅ Aceptado': '✅ Accepted',
  '❌ Rechazado': '❌ Rejected',
  '🚫 Cancelado': '🚫 Cancelled',
  'nada': 'nothing',
  '🤝 Trueque con {name}': '🤝 Barter with {name}',
  'Tú das ({n})': 'You give ({n})',
  'No tienes objetos verificados aún. Recoge algo estando conectado.': "You don't have verified items yet. Collect something while online.",
  'Recibes ({n})': 'You receive ({n})',
  'Consultando su alijo…': 'Checking their stash…',
  'No se ven sus objetos. O no tiene nada verificado, o falta aplicar supabase/schema-v2.sql en tu proyecto.': "Can't see their items. Either they have nothing verified, or supabase/schema-v2.sql is missing from your project.",
  'Proponer trueque 📨': 'Propose barter 📨',
  'Volver': 'Back',
  '📨 ¡Propuesta enviada!': '📨 Proposal sent!',
  'No se pudo proponer: {e}': "Couldn't propose: {e}",
  '📡 Recolectores en tu zona': '📡 Collectors in your area',
  'Nadie cerca ahora mismo. Cuando otro recolector entre en tu zona (~1 km) aparecerá aquí.': 'Nobody nearby right now. When another collector enters your area (~1 km) they will show up here.',
  'Proponer 🤝': 'Propose 🤝',
  '📬 Tus trueques': '📬 Your barters',
  'Todavía no hay trueques. ¡Propón el primero!': 'No barters yet. Propose the first one!',
  '📥 de': '📥 from',
  '📤 para': '📤 to',
  'Te da': 'They give',
  'Das': 'You give',
  'Pide': 'They ask',
  'Pides': 'You ask',
  '✅ ¡Trueque aceptado!': '✅ Barter accepted!',
  'Trueque rechazado': 'Barter rejected',
  'Aceptar': 'Accept',
  'Rechazar': 'Reject',
  'Propuesta cancelada': 'Proposal cancelled',
  'Cancelar propuesta': 'Cancel proposal',
  'Solo se intercambian objetos verificados por el Gremio (recogidos en modo online).': 'Only Guild-verified items can be traded (collected while online).',
  'Recolector #{id}': 'Collector #{id}',

  // ---------- Misiones ----------
  '📋 Contratos del Gremio': '📋 Guild Contracts',
  'Se renuevan cada día a medianoche (UTC).': 'They renew every day at midnight (UTC).',
  'Consultando el tablón…': 'Checking the board…',
  'Chatarrero del día': 'Scrapper of the day',
  'Recoge 5 objetos': 'Collect 5 objects',
  'Ojo clínico': 'Sharp eye',
  'Recoge un objeto raro o mejor': 'Collect a rare object or better',
  'Rastreador': 'Tracker',
  'Encuentra el Escondite del día': "Find today's Cache",
  '💰 +{n} ⚙️ ¡Contrato cumplido!': '💰 +{n} ⚙️ Contract fulfilled!',
  'No se pudo cobrar: {e}': "Couldn't collect the pay: {e}",
  '🔔 Avisarme de eventos y escondites': '🔔 Notify me about events and caches',
  '🔔 Avisos activados: el Gremio te escribirá.': '🔔 Notifications on: the Guild will write to you.',
  'Avisos no activados: {e}': 'Notifications not enabled: {e}',
  'Volver al mapa': 'Back to the map',

  // ---------- Ranking ----------
  '🏆 Top Recolectores': '🏆 Top Collectors',
  '⚔️ Guerra semanal': '⚔️ Weekly war',
  '👑 Campeones: {f} (+10 % XP esta semana)': '👑 Champions: {f} (+10% XP this week)',
  'El lunes se corona a la facción con más XP recolectado.': 'On Monday the faction with the most XP collected is crowned.',
  '🗺️ Territorio cartografiado': '🗺️ Charted territory',
  '{n} sectores': '{n} sectors',
  'Sectores despejados de la Niebla Tóxica caminando.': 'Sectors cleared from the Toxic Fog by walking.',
  'Consultando al Gremio…': 'Consulting the Guild…',
  'Aún no hay recolectores en el registro.': 'No collectors on record yet.',
  'Recolector anónimo': 'Anonymous collector',
  ' (tú)': ' (you)',
  'Nv {n}': 'Lv {n}',

  // ---------- Cuenta ----------
  '👤 Tu cuenta': '👤 Your account',
  'Guardar': 'Save',
  '{n} sectores despejados de la Niebla · {km} km² · ≈ {c} campos de fútbol': '{n} sectors cleared from the Fog · {km} km² · ≈ {c} football pitches',
  'La tormenta re-cubre lo que no patrullas, pero lo cartografiado cuenta para siempre — para ti y para tu facción.': "The storm re-covers what you don't patrol, but charted ground counts forever — for you and your faction.",
  '⚠️ Partida de invitado': '⚠️ Guest game',
  'Tu progreso vive solo en este dispositivo. Vincula tu email y quedará a salvo para siempre (mismo personaje, mismo inventario).': 'Your progress lives only on this device. Link your email and it will be safe forever (same character, same inventory).',
  '📧 Enviado a {email}. Abre el enlace para confirmar.': '📧 Sent to {email}. Open the link to confirm.',
  'Vincular': 'Link',
  '✅ Cuenta guardada': '✅ Account saved',
  'Vinculada a {email}. Tu progreso te sigue a cualquier dispositivo.': 'Linked to {email}. Your progress follows you to any device.',
  '¿Ya juegas en otro dispositivo?': 'Already playing on another device?',
  '📧 Enlace enviado. Ábrelo aquí para recuperarla.': '📧 Link sent. Open it here to recover it.',
  'Recuperar': 'Recover',
  '🔒 Guardar progreso': '🔒 Save your progress',
  '¿Ya tienes cuenta? Recupérala →': 'Already have an account? Recover it →',
  'Recuperar cuenta': 'Recover account',
  'Te mandamos un enlace de acceso al email que ya tienes vinculado.':
    "We'll send an access link to the email you already linked.",
  '← Volver a vincular': '← Back to linking',
  '🗺️ Exploración': '🗺️ Exploration',
  '🏅 Títulos': '🏅 Titles',
  '🔒 Por logros: {list} (completa sets del Catálogo)': '🔒 By achievement: {list} (complete Catalog sets)',
  '✏️ Nombre actualizado': '✏️ Name updated',
  'No se pudo renombrar: {e}': "Couldn't rename: {e}",
  '🏅 ¡Título adquirido!': '🏅 Title acquired!',
  '📧 Revisa tu correo y confirma para guardar tu cuenta': '📧 Check your email and confirm to save your account',
  'No se pudo vincular: {e}': "Couldn't link: {e}",
  '📧 Enlace enviado: ábrelo en ESTE dispositivo': '📧 Link sent: open it on THIS device',
  'No se pudo enviar: {e}': "Couldn't send: {e}",
  '⚠️ Ese enlace ya no es válido (puede que ya se haya usado o haya caducado): {e}':
    "⚠️ That link isn't valid anymore (it may have already been used or expired): {e}",
  'enlace inválido': 'invalid link',
  '✅ ¡Sesión iniciada! Bienvenido de vuelta, {name}': '✅ Signed in! Welcome back, {name}',
  '🌐 Idioma': '🌐 Language',

  // ---------- Aviso de vincular email (nivel 3) ----------
  'Protege tu progreso': 'Protect your progress',
  'Ya vas por el nivel {n}. Vincula tu email y tu personaje —inventario, nivel, facción— queda a salvo para siempre, en cualquier dispositivo.':
    "You're already level {n}. Link your email and your character —inventory, level, faction— stays safe forever, on any device.",
  'Vincular mi email': 'Link my email',
  'Ahora no': 'Not now',

  // ---------- El Compañero ----------
  '¡Un Huevo de incubadora!': 'An incubator Egg!',
  'Entre los escombros, algo late. Es el Huevo que perdieron los Desechadores… el del Fragmento X del Diario.': "Something pulses among the rubble. It's the Egg the Discarders lost… the one from Fragment X of the Journal.",
  'Camina {km} km con él encima y eclosionará. Le gusta el traqueteo.': 'Walk {km} km with it on you and it will hatch. It likes the jostling.',
  'Guardarlo con cuidado 🎒': 'Store it carefully 🎒',
  '¡Ha nacido {name}!': '{name} has hatched!',
  '¡{from} evolucionó a {to}!': '{from} evolved into {to}!',
  'Todo lo caminado ha dejado huella. {name} ya no es lo que era.':
    "All that walking left its mark. {name} isn't what it used to be.",
  '¡Impresionante! 🐾': 'Amazing! 🐾',
  'Te seguirá a todas partes y olfateará tesoros raros cerca. Cuanto más caminéis juntos, más fino será su olfato.': 'It will follow you everywhere and sniff out rare treasure nearby. The more you walk together, the sharper its nose.',
  'A explorar juntos 🐾': 'Explore together 🐾',
  'Huevo de incubadora': 'Incubator Egg',
  'Huevo de incubadora: camina para que eclosione': 'Incubator Egg: walk to hatch it',
  'Le faltan {km} km de traqueteo para eclosionar.': 'It needs {km} km more jostling to hatch.',
  'habéis caminado {km} km juntos': "you've walked {km} km together",
  'Olfato: detecta tesoros raros a {m} m.': 'Nose: detects rare treasure within {m} m.',
  '🐾 ¡{name} sube a nivel {n}! Su olfato se afina': "🐾 {name} reaches level {n}! Its nose gets sharper",
  '{emoji} ¡{name} olfatea algo valioso a {d} m al {dir}!': '{emoji} {name} smells something valuable {d} m to the {dir}!',
  'SO': 'SW',
  'O': 'W',
  'NO': 'NW',

  // ---------- Abducción ----------
  '👾 ¡El Vigía intenta abducir tu hallazgo!': '👾 The Watcher is trying to abduct your find!',
  '¡Tócalo {n} veces para rescatarlo!': 'Tap it {n} more times to rescue it!',
  '👾 El Vigía se llevó tu hallazgo… La próxima vez, toca más rápido':
    '👾 The Watcher took your find… Tap faster next time',

  // ---------- El Reclamador ----------
  'El Reclamador de la Zona': 'The Zone Reclaimer',
  '¡Derrotado! La región respira… hasta el lunes, que se reconstruye.':
    'Defeated! The region can breathe… until Monday, when it rebuilds itself.',
  'Domina esta región (~2 km). Cada recogida de cualquier recolector aquí le hace daño. Se reconstruye cada lunes.':
    'It rules this region (~2 km). Every pickup by any collector here damages it. It rebuilds every Monday.',
  '❤️ {hp} PV restantes': '❤️ {hp} HP left',
  '⚔️ tu daño: {d}': '⚔️ your damage: {d}',
  '👥 {n} recolectores': '👥 {n} collectors',
  'Reclamar botín +300 ⚙️': 'Claim loot +300 ⚙️',
  '🏅 Botín reclamado': '🏅 Loot claimed',
  'No participaste en esta batalla.': "You didn't take part in this battle.",
  '💥 ¡Botín del Reclamador! +300 ⚙️': "💥 Reclaimer's loot! +300 ⚙️",
  'derrotado': 'defeated',
  '¡botín!': 'loot!',

  // ---------- Campamento ----------
  'Tu campamento': 'Your camp',
  'Todo superviviente necesita un rincón en el yermo. Plántalo aquí y el Gremio te dejará suministros cada día (+30 ⚙️). Solo puede mudarse una vez por semana.':
    'Every survivor needs a corner of the wasteland. Pitch it here and the Guild will drop supplies every day (+30 ⚙️). It can only be moved once a week.',
  '⛺ Plantar campamento aquí': '⛺ Pitch camp here',
  '⛺ ¡Campamento plantado! Vuelve cada día a por suministros':
    '⛺ Camp pitched! Come back every day for supplies',
  'Estás en casa. 🏠': "You're home. 🏠",
  'Tu campamento está a {d} de aquí.': 'Your camp is {d} away.',
  '📦 Suministros recogidos hoy': '📦 Supplies collected today',
  'Recoger suministros +30 ⚙️': 'Collect supplies +30 ⚙️',
  'Acércate a menos de {m} m para recoger los suministros diarios.':
    'Get within {m} m to collect the daily supplies.',
  'Mudar el campamento aquí': 'Move the camp here',
  'Mudanza disponible en {d} días': 'Move available in {d} days',
  '📦 Suministros del campamento: +30 ⚙️': '📦 Camp supplies: +30 ⚙️',
  'el campamento solo puede mudarse cada 7 días': 'the camp can only be moved every 7 days',
  'no tienes campamento': "you don't have a camp",
  'suministros ya recogidos hoy': 'supplies already collected today',
  'demasiado lejos de tu campamento': 'too far from your camp',
  'el Reclamador sigue en pie': 'the Reclaimer still stands',
  'no participaste en esta batalla': "you didn't take part in this battle",
  'botín ya reclamado': 'loot already claimed',

  // ---------- Errores del servidor y de online.js ----------
  'demasiado lejos': 'too far away',
  'ya recogido': 'already collected',
  'spawn caducado': 'spawn expired',
  'spawn inexistente': "that spawn doesn't exist",
  'escondite caducado': 'cache expired',
  'anomalía disipada': 'anomaly dissipated',
  'movimiento imposible': 'impossible movement',
  'el Gremio sospecha: demasiadas recogidas en una hora': 'the Guild is suspicious: too many pickups in one hour',
  'no autenticado': 'not authenticated',
  'no tienes suficiente Chatarra': "you don't have enough Scrap",
  'ya tienes ese título': 'you already have that title',
  'ese título no está en venta': 'that title is not for sale',
  'set incompleto: faltan % objetos': 'set incomplete',
  'set ya reclamado': 'set already claimed',
  'ese nombre ya existe': 'that name already exists',
  'entre 3 y 24 caracteres': 'between 3 and 24 characters',
  'necesitas el modo online': 'you need online mode',
  'tu navegador no soporta notificaciones': "your browser doesn't support notifications",
  'permiso denegado': 'permission denied',
}
