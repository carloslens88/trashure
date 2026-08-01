# Trashure — Documento de Diseño (GDD) v0.3

> Nombre elegido el 2026-07-11 (antes «Garbage Collector», descartado por
> connotación negativa): **Trashure** = trash + treasure. Jugable en
> [trashure.online](https://trashure.online).

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

La **Guerra de Facciones** (XP total por facción) se ve en el ranking 🏆, con
una corona semanal (ver «Retención y metas»).

## Core loop

1. **Camina** por el mundo real — en producción hace falta GPS de verdad,
   tocar el mapa no mueve al jugador (solo en `npm run dev` existe un "modo
   paseo" para probar en escritorio).
2. **Detecta** objetos que aparecen alrededor (spawning procedural por celdas)
   y despeja la Niebla Tóxica a tu paso.
3. **Recoge** lo que esté dentro de tu radio de acción — validado por el
   servidor, no por el cliente.
4. **Colecciona** (catálogo de descubrimientos), **vende** por Chatarra ⚙️, o
   **publica** en el mercado.
5. Sube de nivel, mantén tu racha diaria, daña al jefe de tu zona, vuelve a
   tu campamento — siempre hay un motivo distinto para salir cada día.

La basura de cada zona **se renueva cada 10 minutos**, así siempre hay algo
nuevo que buscar.

## Rarezas

| Rareza | Color | Prob. | XP | Valor ⚙️ | Ejemplos |
|---|---|---|---|---|---|
| Común | Gris | 55 % | 5 | 2 | Lata aplastada, calcetín desparejado |
| Poco común | Verde | 25 % | 12 | 6 | Osito abandonado, cinta VHS |
| Raro | Azul | 12 % | 30 | 20 | Cámara antigua, llave misteriosa |
| Épico | Morado | 5,5 % | 80 | 75 | Mapa del tesoro, guitarra astillada |
| Reliquia | Dorado | 2 % | 200 | 300 | Ánfora romana, doblón español |
| Alienígena | Cian | 0,5 % | 500 | 1500 | Fragmento de nave, batería de plasma |

El catálogo se revisa de vez en cuando por tono (p. ej. corona/espada se
retiraron por desencajar con el escenario postapocalíptico y se
sustituyeron por guitarra astillada y cámara de videovigilancia). Los
objetos retirados no vuelven a aparecer, pero quien ya los tenga los
conserva — nunca se invalida el inventario de nadie.

## Economía (implementada, autoritativa en servidor)

- Moneda blanda: **Chatarra ⚙️** (vender al Gremio, valores en `catalog_items`).
- **Mercado entre jugadores**: anuncios con precio libre; comprar transfiere
  el objeto y la Chatarra atómicamente (RPC `buy_item`).
- **Trueque directo** sin moneda (pestaña Mercado → Trueques).
- Regla de oro anti-inflación: la Chatarra entra al mundo SOLO vía venta al
  Gremio, suministros del campamento o misiones — con valores fijos; el
  mercado solo la mueve, y la **tasa del Gremio (10 %, 5 % Contrabandistas)
  se quema** — sumidero permanente. Los títulos comprables son otro sumidero.
- Fase futura (monetización ética): cosméticos, ampliaciones de mochila, pase
  de temporada. Nunca "pay-to-find".

## Anti-cheat

- Servidor autoritativo: el cliente *pide* recoger, el servidor valida
  posición, velocidad de movimiento entre recogidas y cooldowns; límite de
  90 recogidas/hora por jugador.
- Spawning determinista del lado del servidor (semilla por celda + ventana de
  tiempo): no se puede inventar un objeto que el servidor no genere. La misma
  regla protege escondites, anomalías y el jefe semanal.
- El modo paseo (tocar el mapa para caminar) solo existe en `npm run dev`:
  en producción, sin GPS activo no se puede mover, recoger ni abrir nada.

## Stack (coste ~0 €)

| Pieza | Elección |
|---|---|
| Cliente | React + Vite (PWA), i18n ES/EN, sonido generado con WebAudio (sin assets) |
| Mapa | Leaflet + teselas OpenStreetMap/CARTO (con respaldo automático de proveedor) |
| Backend | Supabase free tier — Postgres, Auth, Realtime, Edge Functions |
| Hosting | Cloudflare Workers, dominio propio `trashure.online` |
| Email | Resend (SMTP propio) + plantillas con marca del juego |
| Apps nativas | Capacitor (Android/iOS) sobre el mismo código web |

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
haz, los objetos tiemblan… y **todo da ×2 XP mientras dure**. Determinista
(zona+franja): el servidor aplica el ×2 con el mismo cálculo.

**Minijuego de Abducción:** si confirmas una recogida durante la Vigilancia
(salvo botín de anomalía), el Vigía intenta llevársela con su haz — hay que
tocarla 8 veces para rescatarla antes de que llegue a la nave. Ganar
continúa la recogida normal (con el ×2 incluido); perder la pierde de
verdad. Sin superficie de trampa: saltarse el minijuego solo puede salir mal.

## Escondites de los Desechadores (implementado) — el gancho diario

Cada día hay **un escondite enterrado en cada región (~2 km)**. No aparece en
el mapa: la **brújula 🧭** del HUD señala el rumbo y la distancia, y el portal
🌀 solo se materializa a menos de 150 m. Al abrirlo: un objeto garantizado de
alta rareza (50 % épico / 35 % reliquia / 15 % alienígena), **+150 XP de
bonus**, y el siguiente **Fragmento del Diario del Desechador** — una historia
en 12 capítulos que solo se lee caminando (coleccionable en el Catálogo).

Determinista por región+día y validado por la edge function con la misma
semilla: imposible de falsificar. Es la razón para salir a pasear *cada día*.

## Niebla Tóxica y territorio (implementado)

El mapa empieza cubierto por una niebla que **solo se despeja por donde
caminas** — cada celda pisada queda cartografiada. Una tormenta periódica
reclama los sectores que llevan días sin patrullarse (fog of war real), pero
el **territorio total cartografiado es acumulativo y no baja nunca**: se
presume en el ranking ("🗺️ N sectores · X km² · ≈ Y campos de fútbol") y
cuenta para siempre, aunque la niebla vuelva a cubrirlo.

## Anomalías radiactivas (implementado) — riesgo/recompensa

Zonas con botín garantizado pero con truco: si entras, saqueas y sales sin
recoger nada, o entras y te vas sin más, **pierdes tu racha diaria** (solo
cuenta como huida real: haber estado dentro más de 25 s y alejarte
caminando, no un salto de GPS). Recoger algo dentro te libra del castigo y
suma un bonus de XP. Empuja a decidir rápido: ¿merece la pena el riesgo?

## El Reclamador — jefe de zona semanal (implementado)

Cada región (~2 km) tiene su propio Reclamador con **1000 PV**. Cada
recogida de **cualquier** jugador en la región le hace daño igual al XP
obtenido — es un objetivo cooperativo de barrio, no individual. Al
derrotarlo, todos los que participaron reclaman **+300 ⚙️** de botín; se
reconstruye cada semana.

## Tu Campamento (implementado)

Plántalo donde quieras del mundo real; cada día que vuelvas físicamente (a
menos de ~100 m) recoges **suministros: +30 ⚙️**. Mudarlo tiene un
enfriamiento de 7 días — ancla al jugador a un rincón del yermo y da una
rutina diaria además de la racha.

## El Compañero (implementado)

A nivel 2 aparece un Huevo entre los escombros — es el que perdieron los
Desechadores (Fragmento X del Diario). Se incuba caminando **2 km reales**
(solo cuentan pasos plausibles) y eclosiona en una de 5 especies aleatorias
(Bit 👾, Pinza 🦂, Zeta 🦎, Trasho 🐛, Púa 🦔). Sube de nivel cada 3 km
(tope 20) y su **olfato** avisa de tesoros raros o mejores cerca, con radio
creciente según su nivel. 100 % local — es cariño, no economía, sin
servidor de por medio.

## Retención y metas (implementado, v9)

- **Racha diaria 🔥**: días consecutivos con al menos una recogida. +5 % de
  XP por día, tope +50 % (racha 10). La calcula y aplica el servidor.
- **Sets del catálogo 🏅**: completar todas las piezas obtenibles de una
  rareza (verificado contra el registro del servidor) da Chatarra y un
  **título de logro** (Barrendero del Yermo → … → Amigo de los Desechadores).
- **Guerra semanal ⚔️**: marcador en vivo de XP recolectado por facción; cada
  lunes 00:05 UTC un cron corona a la campeona, que cobra **+10 % de XP toda
  la semana**. Palmarés en `war_winners`.
- **Clima real 🌧️** (open-meteo, sin key): si llueve/nieva de verdad en tu
  zona, el mapa lo muestra y las recogidas dan **+25 % de XP** — el servidor
  consulta el clima por su cuenta al validar.
- **Títulos 🏷️**: cosméticos equipables visibles en el ranking. Los de logro
  salen de los sets; los comprables (50→5000 ⚙️) son sumidero de economía.

Los multiplicadores se componen en servidor:
`XP = base × facción × racha × guerra × tormenta × vigilancia (+ bonus de escondite/anomalía)`.

## Cuentas (implementado)

Anónimo desde el primer segundo — jugar no pide registro. El progreso vive
en el servidor desde el inicio (no en local); vincular un email conserva el
mismo personaje para siempre y permite recuperarlo en otro dispositivo con
un enlace de acceso de un solo uso. Dominio y correo propios
(`trashure.online` vía Resend) con plantillas de email con marca del juego.

## Look & feel (implementado)

Mapa con estética de yermo: ocre y óxido de día, azul profundo de noche
(según la hora real del jugador), resplandor tóxico en el horizonte, motas
de ceniza. Sonido 100 % generado por código (viento, pings alienígenas,
efectos por rareza) — cero peso, cero coste. Animaciones en toda la
interacción principal: recoger, vender, subir de nivel, caminar.

## Estado actual

Todo lo descrito arriba está implementado y en producción en
[trashure.online](https://trashure.online), con apps nativas Android/iOS
vía Capacitor listas para publicar en tienda.

## Próximos pasos (ideas abiertas, sin comprometer)

- Más fases/mecánicas para el Reclamador.
- Contratos diarios del Gremio más variados.
- Eventos ligados a geografía real (costa → naufragios, casco antiguo →
  antigüedades) usando datos de OpenStreetMap.
- Notificaciones push nativas (FCM/APNs) para las apps de tienda.
- Monetización cosmética (fase 3 de la economía).
