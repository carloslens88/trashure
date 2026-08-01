# Trashure — Documento de Diseño (GDD) v0.2

> Nombre elegido el 2026-07-11 (antes «Garbage Collector», descartado por
> connotación negativa): **Trashure** = trash + treasure.

## Concepto

Juego móvil de exploración geolocalizada en un mundo compartido. El planeta está
lleno de "basura"… pero la basura de unos es el tesoro de otros. Caminas por tu
ciudad real recogiendo objetos: desde latas aplastadas hasta reliquias romanas y
fragmentos de tecnología alienígena.

**Fantasía del jugador:** ser un chatarrero-explorador con ojo para el tesoro.

## Lore

Hace una generación, **los Desechadores** llegaron del cielo. Los humanos lo
llaman **la Invasión**: arrasaron las ciudades, usaron el planeta entero como
vertedero de su flota y se marcharon sin explicar nada. Los supervivientes se
reorganizaron alrededor del **Gremio de Recolectores**: en el yermo, cada
objeto — una lata, un juguete, un fragmento de nave — es supervivencia, y las
facciones **compiten por los restos** para mantener a los suyos.

**El giro** (se descubre leyendo el *Diario del Desechador*, capítulo a
capítulo en los Escondites): para los Desechadores no fue una invasión.
Ni siquiera se dieron cuenta de lo que hacían. Solo era una escala para
vaciar las bodegas… y una de ellos, Zeta-9, empezó a esconder regalos.

### Facciones (implementado)
Elección única al conectar; los perks se aplican en servidor:
- **♻️ Recicladores** — «Nada es basura.» +25 % de Chatarra vendiendo comunes
  y poco comunes al Gremio.
- **🏺 Anticuarios** — «El pasado paga bien.» +25 % de XP con hallazgos raros,
  épicos y reliquias.
- **🛸 Contrabandistas** — «El Gremio no hace preguntas.» Tasa del mercado al
  5 % al vender (los demás pagan 10 %).

La **Guerra de Facciones** (XP total por facción) se ve en el ranking 🏆.

## Core loop

1. **Camina** por el mundo real (o toca el mapa en modo paseo).
2. **Detecta** objetos que aparecen alrededor (spawning procedural por celdas).
3. **Recoge** lo que esté dentro de tu radio de acción.
4. **Colecciona** (catálogo de descubrimientos) o **vende** por Chatarra ⚙️.
5. Sube de nivel → más radio, más capacidad, zonas nuevas (futuro).

La basura de cada zona **se renueva cada 10 minutos**, así siempre hay algo
nuevo que buscar.

## Rarezas

| Rareza | Color | Prob. | XP | Valor ⚙️ | Ejemplos |
|---|---|---|---|---|---|
| Común | Gris | 55 % | 5 | 2 | Lata aplastada, calcetín desparejado |
| Poco común | Verde | 25 % | 12 | 6 | Osito abandonado, cinta VHS |
| Raro | Azul | 12 % | 30 | 20 | Cámara antigua, llave misteriosa |
| Épico | Morado | 5,5 % | 80 | 75 | Mapa del tesoro, corona abollada |
| Reliquia | Dorado | 2 % | 200 | 300 | Ánfora romana, doblón español |
| Alienígena | Cian | 0,5 % | 500 | 1500 | Fragmento de nave, batería de plasma |

## Economía (implementada)

- Moneda blanda: **Chatarra ⚙️** (vender al Gremio, valores en `catalog_items`).
- **Mercado entre jugadores**: anuncios con precio libre; comprar transfiere
  el objeto y la Chatarra atómicamente (RPC `buy_item`).
- **Trueque directo** sin moneda (pestaña Mercado → Trueques).
- Regla de oro anti-inflación: la Chatarra entra al mundo SOLO vía venta al
  Gremio con valores fijos; el mercado solo la mueve, y la **tasa del Gremio
  (10 %, 5 % Contrabandistas) se quema** — sumidero permanente.
- Fase 3 (monetización ética): cosméticos, ampliaciones de mochila, pase de
  temporada. Nunca "pay-to-find".

## Anti-cheat (imprescindible antes del multijugador)

- Servidor autoritativo: el cliente *pide* recoger, el servidor valida
  (posición plausible, velocidad de movimiento, cooldowns).
- Spawning determinista del lado del servidor (semilla por celda + ventana de
  tiempo): no se puede inventar un objeto que el servidor no genere.

## Stack (coste 0 €)

| Pieza | Elección |
|---|---|
| Cliente | React + Vite (PWA) → Capacitor para Android/iOS |
| Mapa | Leaflet + teselas OpenStreetMap (gratis, con atribución) |
| Backend (fase 2) | Supabase free tier (auth, Postgres, realtime) |
| Arte | Emoji + CSS (MVP) → packs CC0 / arte propio |

## Eventos de zona (implementado)

Cada día, algunas zonas del mundo (~1 km) despiertan con un evento que sesga
el spawning. Son deterministas (semilla zona+día): el servidor valida las
recogidas recalculando exactamente lo mismo.

| Evento | Prob./zona/día | Efecto |
|---|---|---|
| 🌊 Marea de Chatarra | 12 % | Muchos más spawns |
| 🏺 Eco de Reliquias | 10 % | Épicos ×3 y reliquias ×5 |
| 🛸 Señal Alienígena | 4 % | Objetos alienígenas ×16 |

Gancho de lore: los ecos y señales marcan rutas que dejaron los Desechadores.
Futuro: eventos ligados a geografía real (costa → naufragios, casco antiguo →
antigüedades) usando datos de OpenStreetMap.

## Vigilancia Alienígena 🛸 (implementado) — la sorpresa

En cada franja de 10 minutos, cada zona (~1 km) tiene un **8 % de
probabilidad** de que un Vigía de los Desechadores la sobrevuele: suena la
alarma, **se levanta una tormenta de arena**, un OVNI barre el mapa con su
haz, los objetos tiemblan… y **todo da ×2 XP mientras dure**. Riesgo/
recompensa puro: la tormenta es el mejor momento para salir. Determinista
(zona+franja): el servidor aplica el ×2 con el mismo cálculo.

## Escondites de los Desechadores (implementado) — el gancho diario

Cada día hay **un escondite enterrado en cada región (~2 km)**. No aparece en
el mapa: la **brújula 🧭** del HUD señala el rumbo y la distancia, y el portal
🌀 solo se materializa a menos de 150 m. Al abrirlo: un objeto garantizado de
alta rareza (50 % épico / 35 % reliquia / 15 % alienígena), **+150 XP de
bonus**, y el siguiente **Fragmento del Diario del Desechador** — una historia
en 12 capítulos que solo se lee caminando (coleccionable en el Catálogo).

Determinista por región+día y validado por la edge function con la misma
semilla: imposible de falsificar. Es la razón para salir a pasear *cada día*.

## Retención y metas (implementado, v9)

- **Racha diaria 🔥**: días consecutivos con al menos una recogida. +5 % de
  XP por día, tope +50 % (racha 10). La calcula y aplica el servidor.
- **Sets del catálogo 🏅**: completar todas las piezas de una rareza
  (verificado contra el registro del servidor) da Chatarra y un **título de
  logro** (Barrendero del Yermo → … → Amigo de los Desechadores).
- **Guerra semanal ⚔️**: marcador en vivo de XP recolectado por facción; cada
  lunes 00:05 UTC un cron corona a la campeona, que cobra **+10 % de XP toda
  la semana**. Palmarés en `war_winners`.
- **Clima real 🌧️** (open-meteo, sin key): si llueve/nieva de verdad en tu
  zona, el mapa lo muestra y las recogidas dan **+25 % de XP** — el servidor
  consulta el clima por su cuenta al validar.
- **Títulos 🏷️**: cosméticos equipables visibles en el ranking. Los de logro
  salen de los sets; los comprables (50→5000 ⚙️) son el primer sumidero
  aspiracional de la economía.

Los multiplicadores se componen en servidor:
`XP = base × facción × racha × guerra × tormenta (+ bonus de escondite)`.

## Roadmap

- **Fase 1 (este repo, offline):** mapa, spawning, recolección, inventario,
  catálogo, venta al Gremio, niveles. Sin cuenta, guardado local.
- **Fase 2:** Supabase — cuentas, mundo compartido, trade, facciones.
- **Fase 3:** eventos por zonas reales (costa → naufragios, casco antiguo →
  antigüedades), temporadas, monetización cosmética.
