import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Registrado también en dev: el push necesita el service worker.
// Detección activa de versión nueva: el navegador por sí solo puede tardar
// horas en darse cuenta de que hay un sw.js distinto. Sin esto, un jugador
// con la pestaña abierta desde antes de un despliegue seguía sirviendo JS
// viejo en silencio — un cambio de idioma (que recarga la página) volvía a
// caer en ese mismo Service Worker desactualizado, así que ni recargar
// arreglaba nada hasta un refresh manual "de verdad" (con caché limpia).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then((reg) => {
      reg.update().catch(() => {})
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {})
      })
    })
    .catch(() => {})

  // En cuanto el Service Worker nuevo toma el control de la pestaña,
  // recargar una vez para dejar de servir el bundle viejo.
  let refreshedForNewSW = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshedForNewSW) return
    refreshedForNewSW = true
    window.location.reload()
  })
}
