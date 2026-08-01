# ♻️ Trashure

> *La basura de unos es el tesoro de otros.*

Juego de exploración geolocalizada: recorre el mundo real recogiendo "basura"
que puede resultar ser cualquier cosa — de una lata aplastada a una reliquia
romana o un fragmento de nave alienígena.

Diseño completo en [GDD.md](GDD.md).

## Ejecutar

```bash
npm install
npm run dev
```

Abre http://localhost:5173. Si concedes permiso de ubicación juegas sobre tu
zona real; si no, arrancas en Madrid en **modo paseo**: toca el mapa para
caminar y toca los objetos dentro de tu círculo para recogerlos.

## Probar en el móvil

```bash
npm run dev:movil   # HTTPS en tu red local → GPS real en el teléfono
```

Guía completa (incluye deploy gratis y Capacitor): [docs/PROBAR-EN-MOVIL.md](docs/PROBAR-EN-MOVIL.md)

## Modo online (Fase 2)

El juego funciona offline por defecto. Para activar el mundo compartido
(jugadores visibles en tu zona, recogidas validadas en servidor, base del
trade), sigue [docs/FASE2-SUPABASE.md](docs/FASE2-SUPABASE.md) — Supabase free
tier, 0 €.

## Estado actual (Fase 1 — MVP offline)

- Mapa real (Leaflet + OpenStreetMap, coste 0).
- Spawning procedural determinista por celda geográfica + ventana de 10 min.
- 6 rarezas, 31 objetos con descripción, catálogo de descubrimientos.
- Mochila, venta al Gremio (moneda: Chatarra ⚙️), XP y niveles.
- Guardado local (localStorage). Sin backend todavía.

## Próximos pasos

1. **Fase 2:** Supabase (free tier) — cuentas, mundo compartido, trade entre
   jugadores, validación de recogidas en servidor.
2. **Capacitor** para empaquetar como app Android/iOS sin reescribir código.
3. PWA instalable (manifest + service worker) para jugar desde el móvil ya.
