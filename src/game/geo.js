// Geolocalización unificada: plugin nativo dentro de la app Capacitor
// (gestiona los permisos del sistema), navigator.geolocation en la web.
import { Capacitor } from '@capacitor/core'
import { Geolocation } from '@capacitor/geolocation'

// Devuelve una función de limpieza.
export function watchPosition(onPos, onError) {
  if (Capacitor.isNativePlatform()) {
    let watchId = null
    let cancelled = false
    Geolocation.watchPosition({ enableHighAccuracy: true }, (position, err) => {
      if (err) onError(err)
      else if (position) {
        onPos({ lat: position.coords.latitude, lng: position.coords.longitude })
      }
    }).then((id) => {
      if (cancelled) Geolocation.clearWatch({ id })
      else watchId = id
    })
    return () => {
      cancelled = true
      if (watchId) Geolocation.clearWatch({ id: watchId })
    }
  }

  if (!('geolocation' in navigator)) return () => {}

  const emit = (g) => onPos({ lat: g.coords.latitude, lng: g.coords.longitude })

  // watchPosition tiene un bug conocido en Chrome/Opera para Android: tras el
  // primer aviso, el navegador deja de invocar el callback aunque el GPS siga
  // moviéndose (solo una recarga —que crea un watch nuevo— vuelve a moverlo,
  // una vez). Por eso NO confiamos solo en el watch: un sondeo con
  // getCurrentPosition cada 5 s actúa de red de seguridad y sigue moviendo
  // al jugador aunque el watch se quede colgado.
  const id = navigator.geolocation.watchPosition(emit, onError, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 10000,
  })
  const pollId = setInterval(() => {
    navigator.geolocation.getCurrentPosition(emit, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 8000,
    })
  }, 5000)

  return () => {
    navigator.geolocation.clearWatch(id)
    clearInterval(pollId)
  }
}
