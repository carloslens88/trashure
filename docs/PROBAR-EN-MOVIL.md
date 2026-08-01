# Probar en iPhone / Android (0 €)

## Opción A — En tu red WiFi, ahora mismo

```bash
npm run dev:movil
```

Vite imprime una URL tipo `https://192.168.1.XX:5173`. Ábrela en el navegador
del móvil (misma WiFi). El certificado es autofirmado: acepta el aviso de
seguridad («Avanzado → Continuar»). Al ser HTTPS, **el GPS real funciona**:
concede permiso de ubicación y camina de verdad.

Para instalarla como app:
- **iPhone (Safari):** Compartir → «Añadir a pantalla de inicio».
- **Android (Chrome):** Menú ⋮ → «Añadir a pantalla de inicio».

## Opción B — URL pública gratis (para compartir con amigos)

**URL oficial (dominio propio):** https://trashure.online
— dominio comprado en Namecheap, DNS gestionado en Cloudflare, conectado
como custom domain del Worker en `wrangler.toml` (`routes` con
`custom_domain = true`). HTTPS → GPS real, instalable como PWA.

También sigue viva, en paralelo, la URL original del Worker:
https://trashure.legendary-salad.workers.dev (`workers_dev = true` en
`wrangler.toml` — no se desactiva aunque haya dominio propio). Útil como
respaldo si algún día hay que tocar el DNS del dominio.

Para publicar una nueva versión:

```bash
npm run build && npx wrangler deploy
```

Recuerda que el build hornea las variables de `.env`: tras cambiar de
proyecto Supabase hay que rebuild + redeploy. La anon key es pública por
diseño (la protección real es RLS + la edge function).

## Opción C — App nativa (siguiente paso, cuando toque)

Capacitor empaqueta este mismo código como app Android/iOS:

```bash
npm i @capacitor/core @capacitor/cli
npx cap init && npx cap add android
npm run build && npx cap sync && npx cap open android
```

Requiere Android Studio (gratis) / Xcode. El único gasto llega al publicar:
25 $ una vez en Google Play, 99 $/año en App Store.
