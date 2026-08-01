# ♻️ Trashure

> *La basura de unos es el tesoro de otros.*

**🎮 Juega ahora: [trashure.online](https://trashure.online)**

Juego de exploración geolocalizada estilo Pokémon GO: recorre el mundo real
recogiendo "basura" que puede resultar ser cualquier cosa — de una lata
aplastada a una reliquia romana o un fragmento de nave alienígena. Ambientado
en un yermo postapocalíptico: los **Desechadores** (una civilización
alienígena) arrasaron la Tierra sin darse cuenta de lo que hacían, y entre
sus ruinas cada objeto es supervivencia. Diseño y lore completos en
[GDD.md](GDD.md).

Construido con la meta de **coste de desarrollo ~0 €** (dominio y cuentas de
tienda aparte). Stack: React + Vite + Leaflet/OpenStreetMap en el cliente,
Supabase (Postgres, Auth, Realtime, Edge Functions) como backend, desplegado
en Cloudflare Workers.

## Ejecutar en local

```bash
npm install
npm run dev
```

Abre http://localhost:5173. Con permiso de ubicación juegas sobre tu zona
real; en local sin GPS arrancas en Madrid en **modo paseo** (solo en
`npm run dev`: tocar el mapa mueve al jugador — en producción esto está
desactivado, hay que caminar de verdad).

Para probar con GPS real desde el móvil en tu red local:

```bash
npm run dev:movil
```

Guía completa (deploy, Capacitor): [docs/PROBAR-EN-MOVIL.md](docs/PROBAR-EN-MOVIL.md).
Conectar tu propio backend de Supabase: [docs/FASE2-SUPABASE.md](docs/FASE2-SUPABASE.md).
Apps nativas con Capacitor: [docs/CAPACITOR.md](docs/CAPACITOR.md).

## Qué hay implementado

**Mundo y exploración**
- Mapa real con look "yermo postapocalíptico" (Leaflet + OpenStreetMap/CARTO,
  con respaldo automático de proveedor y aviso si el mapa no llega a cargar).
- Spawning procedural determinista por celda geográfica + ventana de 10 min,
  validado en servidor (misma semilla en cliente y edge function: imposible
  falsear una recogida).
- Niebla Tóxica: fog-of-war que solo se despeja caminando; territorio
  cartografiado acumulado y visible en el ranking.
- Eventos de zona diarios (Marea de Chatarra, Eco de Reliquias, Señal
  Alienígena), clima real (lluvia = +25 % XP) y **Vigilancia Alienígena**
  aleatoria con minijuego de Abducción para rescatar tu hallazgo.
- Anomalías radiactivas (riesgo/recompensa: huir sin saquear rompe tu racha).
- Escondites diarios de los Desechadores + brújula + Diario coleccionable
  (12 fragmentos de lore).
- Tu propio Campamento (suministros diarios) y el Reclamador, un jefe de
  zona cooperativo semanal.

**Progresión y economía (autoritativa en servidor)**
- 6 rarezas, catálogo de objetos con descripciones, sets completables con
  recompensa y título.
- Facciones con perks server-side, guerra de facciones semanal.
- Mercado entre jugadores, trueques, misiones diarias del Gremio, racha
  diaria, títulos, ranking, un Compañero que camina contigo y olfatea
  tesoros.
- Sonido 100 % generado con WebAudio (sin assets) y animaciones en toda la
  interacción principal.

**Cuentas y plataforma**
- Sesión anónima desde el primer segundo; vincular email o recuperar cuenta
  en otro dispositivo (magic link), con dominio y SMTP propios
  (`trashure.online` vía Resend) y plantillas de email con marca del juego.
- i18n español/inglés.
- PWA instalable + apps nativas Android/iOS vía Capacitor.
- Desplegado en Cloudflare Workers (`trashure.online` y, en paralelo, la URL
  original `*.workers.dev`).

## Estructura del backend

- `supabase/schema*.sql` y `supabase/migrations/` — esquema y evolución de
  la base de datos.
- `supabase/functions/collect/` — edge function que valida cada recogida
  (posición, velocidad, spawn determinista, rate limit).
- `supabase/functions/notify-events/` — notificaciones push diarias.
- `supabase/email-templates/` — plantillas de email con marca del juego.

## Próximos pasos

Ideas abiertas, sin comprometer: más fases para el Reclamador, contratos
diarios más variados, eventos ligados a geografía real (OSM), push nativo
(FCM/APNs) para las apps de tienda.
