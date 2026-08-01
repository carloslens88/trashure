// La Niebla Tóxica: el yermo entero está cubierto y solo se despeja por donde
// caminas. Capa canvas sobre Leaflet; los puntos despejados son celdas de una
// rejilla (~35 m) que persisten en la partida con sello de tiempo: las
// tormentas tóxicas re-espesan la niebla sobre los sectores que no patrullas.
import L from 'leaflet'

export const REVEAL_M = 90 // radio despejado alrededor de cada celda pisada
const CELL_LAT = 0.0003 // ~33 m
const CELL_LNG = 0.0004 // ~34 m en latitudes ibéricas

// Tormentas tóxicas: un sector aguanta despejado 2 días; después la niebla
// vuelve poco a poco hasta reclamarlo del todo a los 4.
export const FOG_FRESH_MS = 2 * 24 * 60 * 60 * 1000
export const FOG_STORM_MS = 4 * 24 * 60 * 60 * 1000

// De día la niebla es una calima de arena LUMINOSA: lo inexplorado se ve
// velado y desvaído, no oscuro — el contraste con tu zona despejada (nítida
// y saturada) es lo que lee como niebla. De noche sí es impenetrable.
const FOG_DAY = 'rgba(226, 200, 150, 0.62)'
const FOG_NIGHT = 'rgba(3, 9, 14, 0.88)'

// Celda de la rejilla a la que pertenece una posición (centro + clave única)
export function cellOf(pos) {
  const i = Math.round(pos.lat / CELL_LAT)
  const j = Math.round(pos.lng / CELL_LNG)
  return { key: `${i}:${j}`, lat: i * CELL_LAT, lng: j * CELL_LNG }
}

// 1 = recién patrullado, 0 = la tormenta lo reclamó
function freshness(ms, now) {
  const age = now - (ms ?? now)
  if (age <= FOG_FRESH_MS) return 1
  return Math.max(0, 1 - (age - FOG_FRESH_MS) / (FOG_STORM_MS - FOG_FRESH_MS))
}

export const FogLayer = L.Layer.extend({
  initialize() {
    this._points = []
    this._anomalies = []
    this._night = false
  },

  onAdd(map) {
    this._map = map
    this._canvas = L.DomUtil.create('canvas', 'fog-canvas', map.getPane('fog'))
    this._reset()
    return this
  },

  onRemove() {
    this._canvas.remove()
    this._map = null
  },

  getEvents() {
    return {
      move: this._reset,
      moveend: this._reset,
      zoom: this._reset,
      viewreset: this._reset,
      resize: this._reset,
      zoomanim: this._animateZoom,
    }
  },

  // points: [[lat, lng, lastVisitMs], …]
  setPoints(points) {
    this._points = points
    if (this._map) this._draw()
  },

  // anomalies: [{ lat, lng, radius }, …] — la niebla brilla en verde ahí
  setAnomalies(anomalies) {
    this._anomalies = anomalies
    if (this._map) this._draw()
  },

  setNight(night) {
    this._night = night
    if (this._map) this._draw()
  },

  // Durante la animación de zoom, contrarrestar la transformación del pane
  // para que la niebla siga anclada al terreno (mismo truco que Leaflet.heat)
  _animateZoom(e) {
    if (!this._map._latLngBoundsToNewLayerBounds) return
    const scale = this._map.getZoomScale(e.zoom)
    const offset = this._map._latLngBoundsToNewLayerBounds(this._map.getBounds(), e.zoom, e.center)
      .min
    L.DomUtil.setTransform(this._canvas, offset, scale)
  },

  _reset() {
    const map = this._map
    if (!map) return
    L.DomUtil.setPosition(this._canvas, map.containerPointToLayerPoint([0, 0]))
    const size = map.getSize()
    if (this._canvas.width !== size.x) this._canvas.width = size.x
    if (this._canvas.height !== size.y) this._canvas.height = size.y
    this._draw()
  },

  _metersPerPixel(lat, zoom) {
    return (40075016.686 * Math.cos((lat * Math.PI) / 180)) / 2 ** (zoom + 8)
  },

  _draw() {
    const map = this._map
    if (!map) return
    const ctx = this._canvas.getContext('2d')
    const size = map.getSize()
    const zoom = map.getZoom()
    const now = Date.now()
    ctx.clearRect(0, 0, size.x, size.y)
    ctx.fillStyle = this._night ? FOG_NIGHT : FOG_DAY
    ctx.fillRect(0, 0, size.x, size.y)

    // Agujeros de visibilidad: borde difuminado, más tenues cuanto más vieja
    // sea la última patrulla (la tormenta va reclamando el sector)
    ctx.globalCompositeOperation = 'destination-out'
    for (const [lat, lng, ms] of this._points) {
      const alpha = freshness(ms, now)
      if (alpha <= 0) continue
      const r = REVEAL_M / this._metersPerPixel(lat, zoom)
      const p = map.latLngToContainerPoint([lat, lng])
      if (p.x < -r || p.y < -r || p.x > size.x + r || p.y > size.y + r) continue
      const g = ctx.createRadialGradient(p.x, p.y, r * 0.45, p.x, p.y, r)
      g.addColorStop(0, `rgba(0,0,0,${alpha})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    // Anomalías radiactivas: la radiación quema parte de la niebla y la
    // tiñe de un verde enfermo que se ve desde lejos
    for (const a of this._anomalies) {
      const r = (a.radius * 1.5) / this._metersPerPixel(a.lat, zoom)
      const p = map.latLngToContainerPoint([a.lat, a.lng])
      if (p.x < -r || p.y < -r || p.x > size.x + r || p.y > size.y + r) continue
      ctx.globalCompositeOperation = 'destination-out'
      let g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 0.7)
      g.addColorStop(0, 'rgba(0,0,0,0.55)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(p.x, p.y, r * 0.7, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalCompositeOperation = 'lighter'
      g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
      g.addColorStop(0, 'rgba(110, 255, 90, 0.32)')
      g.addColorStop(0.6, 'rgba(80, 220, 70, 0.14)')
      g.addColorStop(1, 'rgba(60, 200, 60, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'
  },
})
