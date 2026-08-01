# Fase 2 — Conectar el mundo compartido (Supabase, 0 €)

Sin configurar nada, el juego funciona 100 % offline. Estos pasos (~10 min)
activan: sesión de jugador, jugadores visibles en tu zona, validación
anti-cheat de recogidas en servidor y la base del trade.

## 1. Crear el proyecto (gratis)

1. Cuenta en [supabase.com](https://supabase.com) → **New project** (plan Free).
2. Apunta la **Project URL** y la **anon key** (Settings → API).

## 2. Base de datos

En el panel: **SQL Editor** → pegar el contenido de
[supabase/schema.sql](../supabase/schema.sql) → **Run**.

Esto crea: `profiles`, `inventory_items`, `collect_log`, `trades` con RLS, y
las funciones atómicas `accept_trade` / `reject_trade`.

## 3. Autenticación anónima

**Authentication → Sign In / Up → Anonymous sign-ins → Enable.**
(Los jugadores entran sin registrarse; más adelante pueden vincular email.)

## 4. Edge function anti-cheat

La CLI de Supabase ya está en las devDependencies del proyecto, así que se
invoca con `npx` (escribir `supabase` a secas da `command not found`):

```bash
npx supabase login
npx supabase link --project-ref TU-PROJECT-REF   # el ref sale de la URL del proyecto
npx supabase functions deploy collect
```

La función [supabase/functions/collect](../supabase/functions/collect/index.ts)
regenera el spawn con la misma semilla determinista que el cliente: si el
objeto no existe, estás demasiado lejos o te mueves a velocidad imposible,
la recogida se rechaza. **Importante:** si cambias el motor de spawning del
cliente ([src/game/spawn.js](../src/game/spawn.js)), replica el cambio en
[spawn.ts](../supabase/functions/collect/spawn.ts) — deben generar exactamente
lo mismo.

## 5. Trueques (v2/v3)

En el SQL Editor, ejecutar también
[supabase/schema-v2.sql](../supabase/schema-v2.sql) (inventarios legibles +
índices). Los cambios posteriores van como migraciones en
`supabase/migrations/` y se aplican con `npx supabase db push` (la v3 —
columna `collector` para poder intercambiar copias del mismo spawn — ya está
aplicada en este proyecto). Las instalaciones nuevas solo necesitan
`schema.sql`, que ya lo incluye todo.

## 6. Conectar el cliente

```bash
cp .env.example .env
```

⚠️ **Este paso no termina al copiar**: abre `.env` y sustituye los dos
placeholders por los valores reales de tu proyecto (panel de Supabase →
Settings → API → *Project URL* y *anon public key*). El juego detecta los
placeholders y se queda en modo offline si no los cambias. Después reinicia
`npm run dev` (Vite solo lee `.env` al arrancar).

Al conectar verás en el HUD «👥 N cerca» cuando haya otros recolectores en tu
zona (~1 km), la pestaña 🤝 Trueques activa, y cada recogida quedará validada
y guardada en tu inventario del servidor.

### Probar los trueques sin salir de casa

Abre el juego en dos navegadores distintos (o normal + incógnito): cada uno
será un recolector anónimo diferente. Si ambos están en la misma zona se
verán en 🤝 Trueques. Solo son intercambiables los objetos **verificados**
(recogidos estando online y aceptados por la edge function).

## Economía autoritativa (v4/v5) ✅

Desde las migraciones v4/v5 el servidor manda sobre toda la economía:

- **Recoger**: la edge function valida, inserta en `inventory_items` y
  concede el XP (`award_xp`, solo ejecutable por el servidor). La respuesta
  trae el XP total, que es lo que muestra el HUD.
- **Vender**: RPC `sell_item` — valida propiedad, toma el valor de
  `catalog_items` (la tabla es la autoridad de precios) y abona la Chatarra.
- **Mochila unificada**: en modo online la mochila muestra el inventario del
  servidor, así lo recibido en trueques aparece y se puede vender.
- **Anti-cheat de escritura**: los clientes solo pueden escribir su
  `username`; XP y Chatarra tienen grants de columna revocados.
- Sin sesión, todo sigue funcionando offline con el guardado local.

## Misiones diarias y avisos push (v8) ✅

- **Contratos del Gremio** (botón 📋): 3 misiones diarias verificadas contra
  `collect_log` en servidor (`mission_status`/`claim_mission`); las
  recompensas de Chatarra las abona el servidor.
- **Notificaciones push**: campana 🔔 en el tablón de contratos. La
  suscripción se guarda en `push_subscriptions` y un **cron diario (8:00
  UTC, pg_cron + pg_net)** invoca la edge function `notify-events`, que
  calcula el evento de la zona de cada jugador y envía Web Push (VAPID).
  Secretos: `NOTIFY_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
  (via `npx supabase secrets set`); la clave pública también va en `.env`
  como `VITE_VAPID_PUBLIC_KEY`.
- Probar el envío a mano:
  `curl -X POST $URL/functions/v1/notify-events -H "Authorization: Bearer $ANON" -H "x-notify-secret: $SECRET"`

## Cuentas de usuario (v9) ✅

Filosofía: **jugar primero, registrarse después**. Cada jugador ES una cuenta
real (usuario anónimo de Supabase) desde el primer segundo; todo el progreso
cuelga de su user id. En 👤 (tocando el nivel en el HUD):

- **Vincular email** (`auth.updateUser`): convierte la cuenta anónima en
  permanente **conservando el mismo user id** — no se migra nada.
- **Recuperar en otro dispositivo**: enlace mágico (`signInWithOtp` con
  `shouldCreateUser: false`).
- **Cambiar el nombre** (grant de columna `username`).

La Site URL y la allow-list de redirecciones ya apuntan a la URL pública y a
localhost (configurado vía Management API). ⚠️ El SMTP integrado de Supabase
tiene cuota baja (~4 emails/hora) y es solo para desarrollo: antes de un
lanzamiento real, configurar un SMTP propio (Resend tiene free tier) en
Authentication → SMTP Settings.

## Qué queda para completar la fase 2

- **Progreso offline→online**: al conectar por primera vez, el perfil del
  servidor empieza de cero (decisión anti-cheat); valorar migración asistida.
- **Límites del free tier** (para tener en el radar, no para hoy): 500 MB de
  BD, 500 K invocaciones de edge functions/mes, 200 conexiones realtime
  simultáneas. Da de sobra para miles de jugadores de prueba.
