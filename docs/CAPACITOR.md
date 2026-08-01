# Trashure en las tiendas (Capacitor)

El mismo código web corre como app nativa. Los proyectos `ios/` y `android/`
ya están generados, con permisos de ubicación configurados y el plugin
`@capacitor/geolocation` (la app usa el GPS nativo; la web sigue usando el
del navegador — ver [src/game/geo.js](../src/game/geo.js)).

## Flujo de trabajo

Tras cualquier cambio en el juego:

```bash
npm run build && npx cap sync
```

## iOS (probado: compila y corre en simulador)

Requiere Xcode (ya instalado). Sin CocoaPods: Capacitor 8 usa Swift Package
Manager.

```bash
npx cap open ios          # abre Xcode → Run en simulador o iPhone
```

Para publicar en el App Store: cuenta de desarrollador (99 $/año), firma en
Xcode (Signing & Capabilities → tu equipo) y subir con Product → Archive.

## Android (proyecto listo; falta el SDK en esta máquina)

1. Instala [Android Studio](https://developer.android.com/studio) (gratis).
2. `npx cap open android` → Run en emulador o móvil con USB.
3. Para Google Play: cuenta de desarrollador (25 $ una vez), generar el
   `.aab` firmado con Build → Generate Signed Bundle.

## Notas

- Los permisos de ubicación ya están en `AndroidManifest.xml` y en
  `Info.plist` (con texto en español).
- Las variables de `.env` se hornean en el build: si cambias de proyecto
  Supabase, `npm run build && npx cap sync` de nuevo.
- Las notificaciones push actuales son Web Push (PWA). Para push nativo en
  las apps de tienda, el siguiente paso es `@capacitor/push-notifications`
  con FCM/APNs (gratis, pero requiere las cuentas de desarrollador).
