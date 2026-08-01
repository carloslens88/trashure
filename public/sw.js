// Service worker: red primero (con timeout) para el shell, caché primero
// para los assets con hash de Vite (inmutables — nunca cambian de contenido
// bajo la misma URL). El timeout importa: en redes móviles inestables un
// fetch() puede quedarse colgado sin resolver NUNCA (ni éxito ni error),
// dejando la app a medio cargar hasta que el usuario recarga a mano.
const CACHE = 'gc-shell-v3'
const NETWORK_TIMEOUT_MS = 4000

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('sw-timeout')), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// Notificaciones push (avisos del Gremio: eventos de zona y escondites)
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    /* payload no JSON */
  }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Trashure', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((wins) => {
      const win = wins[0]
      return win ? win.focus() : clients.openWindow('/')
    }),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== location.origin) return

  // /assets/*.js y .css llevan un hash de contenido en el nombre (Vite):
  // la misma URL nunca cambia de contenido, así que cache-first es seguro
  // y evita depender de la red en absoluto en visitas repetidas.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        const fresh = await fetch(event.request)
        if (fresh.status === 200) cache.put(event.request, fresh.clone())
        return fresh
      }),
    )
    return
  }

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const fresh = await withTimeout(fetch(event.request), NETWORK_TIMEOUT_MS)
        // Solo cachear respuestas sanas: un error puntual del servidor no
        // debe quedarse congelado como versión offline
        if (fresh.status === 200) cache.put(event.request, fresh.clone())
        return fresh
      } catch {
        const cached = await cache.match(event.request)
        return cached ?? Response.error()
      }
    }),
  )
})
