import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { spawnAround, distanceM, COLLECT_RADIUS, HIDEOUT_REVEAL_M } from '../game/spawn'
import { RARITIES, FACTIONS } from '../game/items'
import { SKINS } from '../game/skins'
import { FogLayer } from './fog'
import { t } from '../game/i18n'

const WALK_SPEED = 60 // m/s en modo paseo (rápido para que sea ágil)

// El anillo lleva el color de tu facción (si tienes); el cuerpo lleva tu
// skin equipada (si tienes) — son cosas independientes, ambas se ven a la vez.
function playerIcon(faction, skinId) {
  const f = FACTIONS[faction]
  const skin = SKINS[skinId]
  const vars = [f ? `--fc:${f.color}` : '', skin ? `--sk1:${skin.colors[0]};--sk2:${skin.colors[1]}` : '']
    .filter(Boolean)
    .join(';')
  const classes = ['player-wrap', f && 'has-faction', skin && 'has-skin', skin?.animated && 'skin-animated']
    .filter(Boolean)
    .join(' ')
  return L.divIcon({
    className: '',
    html: `<div class="${classes}"${vars ? ` style="${vars}"` : ''}>
      <div class="player-shadow"></div>
      <div class="player-ring"></div>
      <div class="player-marker">🤖</div>
      ${skin?.badge ? `<div class="player-badge">${skin.badge}</div>` : ''}
    </div>`,
    iconSize: [56, 56],
    iconAnchor: [28, 34],
  })
}

function peerIcon(peer) {
  // El color de facción se ve de un vistazo: sabes si es un rival retable
  // antes incluso de acercarte
  const f = FACTIONS[peer.faction]
  const style = f ? ` style="--fc:${f.color}"` : ''
  return L.divIcon({
    className: '',
    html: `<div class="peer-marker${f ? ' has-faction' : ''}"${style}>🤖</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

function itemIcon(item, vigil, anomalous = false) {
  const r = RARITIES[item.type.rarity]
  const delay = (item.seedFrac * 2).toFixed(2)
  return L.divIcon({
    className: '',
    html: `<div class="item-wrap" style="--rc:${r.color};animation-delay:-${delay}s">
      <div class="item-shadow"></div>
      <div class="item-marker r-${item.type.rarity}${vigil ? ' shaking' : ''}${anomalous ? ' anomalous' : ''}">${item.type.emoji}</div>
    </div>`,
    iconSize: [44, 50],
    iconAnchor: [22, 46],
  })
}

function petIcon(emoji) {
  return L.divIcon({
    className: 'pet-follow', // transición CSS: el Compañero trota tras de ti
    html: `<div class="pet-wrap">
      <div class="pet-shadow"></div>
      <div class="pet-badge"><div class="pet-marker">${emoji}</div></div>
    </div>`,
    iconSize: [42, 46],
    iconAnchor: [21, 40],
  })
}

function anomalyCoreIcon() {
  return L.divIcon({
    className: '',
    html: '<div class="anomaly-core">☢️</div>',
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  })
}

function hideoutIcon() {
  return L.divIcon({
    className: '',
    html: '<div class="hideout-marker">🌀</div>',
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  })
}

function chestIcon() {
  return L.divIcon({
    className: '',
    html: '<div class="chest-marker">🔒</div>',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  })
}

function nucleoIcon() {
  return L.divIcon({
    className: '',
    html: '<div class="nucleo-marker">🌌</div>',
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  })
}

export default function MapView({
  pos,
  bucket,
  collected,
  peers = [],
  hideout = null,
  nucleo = null,
  chest = null,
  weather = 'clear',
  vigilance = false,
  night = false,
  explored = [],
  anomalies = [],
  pet = null,
  camp = null,
  faction = null,
  skin = null,
  onWalk,
  onItemTap,
  onHideoutTap,
  onCampTap,
  onPeerTap,
  onPlayerTap,
  onNucleoTap,
  onChestTap,
}) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const fogRef = useRef(null)
  const playerRef = useRef(null)
  const circleRef = useRef(null)
  const itemsRef = useRef(null)
  const peersRef = useRef(null)
  const anomaliesRef = useRef(null)
  const petRef = useRef(null)
  const hideoutRef = useRef(null)
  const campRef = useRef(null)
  const nucleoRef = useRef(null)
  const chestRef = useRef(null)
  const animRef = useRef(0)
  const cbs = useRef({})
  cbs.current = { onWalk, onItemTap, onHideoutTap, onCampTap, onPeerTap, onNucleoTap, onChestTap, onPlayerTap }
  // Diagnóstico visible: si ni un solo proveedor de teselas responde (p. ej.
  // navegadores como Opera que enrutan las imágenes por su propio proxy de
  // ahorro de datos, que a veces las bloquea o las rompe), esto evita que el
  // jugador se quede mirando un mapa en blanco para siempre sin saber por qué.
  const [tilesFailed, setTilesFailed] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    setTilesFailed(false)
    const map = L.map(elRef.current, { zoomControl: false })
    map.setView([pos.lat, pos.lng], 17)
    // CARTO primero: tile.openstreetmap.org ratea/bloquea tráfico móvil y sus
    // peticiones a veces se quedan colgadas sin disparar error (mapa en blanco)
    // Wikimedia como tercera red: infraestructura distinta a las otras dos,
    // por si alguna queda bloqueada por un proxy/compresor del navegador
    // (p. ej. el "ahorro de datos" de Opera, causa clásica de mapas rotos)
    // {r} = teselas retina @2x en pantallas densas: calles y edificios nítidos
    const TILE_URLS = [
      'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png',
    ]
    // El crédito a OSM/CARTO es condición de la licencia de sus teselas
    // gratuitas; el prefijo "Leaflet" sí es opcional
    map.attributionControl.setPrefix(false)
    const tiles = L.tileLayer(TILE_URLS[0], {
      maxZoom: 20,
      maxNativeZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO',
    }).addTo(map)

    // Cambio de servidor si el actual falla o directamente no responde
    let tileUrlIdx = 0
    let tileErrors = 0
    let tileLoaded = false
    const nextTileServer = () => {
      tileErrors = 0
      tileUrlIdx = (tileUrlIdx + 1) % TILE_URLS.length
      tiles.setUrl(TILE_URLS[tileUrlIdx])
    }
    tiles.on('tileload', () => {
      tileLoaded = true
    })
    tiles.on('tileerror', () => {
      if (++tileErrors >= 3) nextTileServer()
    })
    // Vigilante recurrente (no de una sola vez): en móvil a veces no se pide
    // NI UNA tesela porque el contenedor medía 0×0 al montar, así que ni
    // 'tileload' ni 'tileerror' llegan a disparar jamás y el mapa se queda en
    // blanco para siempre. Cada 1,5 s, mientras no cargue nada: recalcula el
    // tamaño real, fuerza a Leaflet a re-pedir teselas y, a la de malas,
    // rota de servidor — varios intentos, con los 3 proveedores, en vez de
    // uno solo. Si tras todos los intentos sigue sin cargar ni una tesela,
    // se lo decimos al jugador en vez de dejarlo mirando el vacío sin pistas.
    let watchdogTicks = 0
    const tileWatchdog = setInterval(() => {
      watchdogTicks++
      if (tileLoaded) {
        clearInterval(tileWatchdog)
        return
      }
      if (watchdogTicks > 10) {
        clearInterval(tileWatchdog)
        setTilesFailed(true)
        return
      }
      map.invalidateSize()
      if (watchdogTicks % 2 === 0) nextTileServer()
      else tiles.redraw()
    }, 1500)

    // El clásico de Leaflet en móvil: contenedor sin tamaño al inicializar o
    // al volver del segundo plano → mapa en blanco hasta invalidateSize()
    const revive = () => map.invalidateSize()
    const reviveT1 = setTimeout(revive, 250)
    const reviveT2 = setTimeout(revive, 1500)
    window.addEventListener('resize', revive)
    window.addEventListener('orientationchange', revive)
    const onVisible = () => !document.hidden && setTimeout(revive, 100)
    document.addEventListener('visibilitychange', onVisible)
    const ro = new ResizeObserver(revive)
    ro.observe(elRef.current)
    // La Niebla Tóxica va en su propio pane: sobre las teselas (350) pero
    // bajo el círculo de recogida (400) y los marcadores (600) — el botín
    // asoma entre la niebla y te tienta a adentrarte
    map.createPane('fog')
    map.getPane('fog').style.zIndex = 350
    map.getPane('fog').style.pointerEvents = 'none'
    fogRef.current = new FogLayer().addTo(map)
    itemsRef.current = L.layerGroup().addTo(map)
    peersRef.current = L.layerGroup().addTo(map)
    anomaliesRef.current = L.layerGroup().addTo(map)
    circleRef.current = L.circle([pos.lat, pos.lng], {
      radius: COLLECT_RADIUS,
      color: '#0ea5e9',
      weight: 2.5,
      dashArray: '6 8',
      fillColor: '#38bdf8',
      fillOpacity: 0.1,
      interactive: false,
    }).addTo(map)
    playerRef.current = L.marker([pos.lat, pos.lng], {
      icon: playerIcon(faction, skin),
      zIndexOffset: 1000,
    }).addTo(map)
    playerRef.current.on('click', (e) => {
      if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent)
      cbs.current.onPlayerTap?.()
    })
    // Un tap suelto camina; un doble tap (o doble clic) es el gesto nativo
    // de Leaflet para hacer zoom y NO debe interpretarse como intención de
    // caminar — sin esto, cada zoom con doble tap disparaba también el
    // aviso de "actívate el GPS para moverte", que es ruido puro.
    let pendingTap = null
    map.on('click', (e) => {
      if (pendingTap) {
        clearTimeout(pendingTap)
        pendingTap = null
        return // segundo tap de un doble tap: es zoom, no un intento de caminar
      }
      pendingTap = setTimeout(() => {
        pendingTap = null
        cbs.current.onWalk({ lat: e.latlng.lat, lng: e.latlng.lng })
      }, 280) // ventana de doble-clic de Leaflet por defecto
    })
    mapRef.current = map
    return () => {
      cancelAnimationFrame(animRef.current)
      clearTimeout(pendingTap)
      clearInterval(tileWatchdog)
      clearTimeout(reviveT1)
      clearTimeout(reviveT2)
      window.removeEventListener('resize', revive)
      window.removeEventListener('orientationchange', revive)
      document.removeEventListener('visibilitychange', onVisible)
      ro.disconnect()
      map.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryKey])

  // La niebla se despeja con las celdas exploradas; de noche es más espesa.
  // retryKey también en las deps: tras un "Reintentar" el mapa (y su capa de
  // niebla) son instancias nuevas que hay que repoblar desde cero.
  useEffect(() => {
    fogRef.current?.setPoints(explored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explored, retryKey])
  useEffect(() => {
    fogRef.current?.setNight(night)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [night, retryKey])

  // El robot se tiñe del color de tu facción y de tu skin equipada, sin
  // reconstruir el marcador: solo se cambia el icono
  useEffect(() => {
    playerRef.current?.setIcon(playerIcon(faction, skin))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faction, skin, retryKey])

  // Anomalías radiactivas: brillo verde en la niebla + círculo, núcleo y botín
  useEffect(() => {
    fogRef.current?.setAnomalies(anomalies)
    const layer = anomaliesRef.current
    if (!layer) return
    layer.clearLayers()
    for (const a of anomalies) {
      const depleted = a.items.length === 0
      layer.addLayer(
        L.circle([a.lat, a.lng], {
          radius: a.radius,
          color: depleted ? '#5b7a52' : '#4ade50',
          weight: 2.5,
          dashArray: '4 10',
          fillColor: '#4ade50',
          fillOpacity: depleted ? 0.03 : 0.08,
          interactive: false,
        }),
      )
      layer.addLayer(
        L.marker([a.lat, a.lng], {
          icon: anomalyCoreIcon(),
          zIndexOffset: 800,
          interactive: false,
          opacity: depleted ? 0.4 : 1,
        }),
      )
      for (const item of a.items) {
        const marker = L.marker([item.lat, item.lng], {
          icon: itemIcon(item, vigilance, true),
          zIndexOffset: 850,
        })
        marker.on('click', (e) => {
          if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent)
          cbs.current.onItemTap(item)
        })
        layer.addLayer(marker)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anomalies, vigilance, retryKey])

  // El Compañero aparece/desaparece según su estado
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    petRef.current?.remove()
    petRef.current = null
    if (!pet) return
    const at = playerRef.current?.getLatLng() ?? L.latLng(pos.lat, pos.lng)
    petRef.current = L.marker(at, {
      icon: petIcon(pet.emoji),
      zIndexOffset: 1050, // por delante del jugador (1000): que se vea, no que se esconda
      interactive: false,
    }).addTo(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pet?.emoji, retryKey])

  // Paseo: interpola el marcador del jugador hasta la nueva posición
  useEffect(() => {
    const map = mapRef.current
    const player = playerRef.current
    if (!map || !player) return
    cancelAnimationFrame(animRef.current)
    const from = player.getLatLng()
    const to = L.latLng(pos.lat, pos.lng)
    // el Compañero trota hasta donde estabas: siempre un paso por detrás
    petRef.current?.setLatLng(from)
    const dist = from.distanceTo(to)
    if (dist < 1) return
    const dur = Math.min(2200, Math.max(350, (dist / WALK_SPEED) * 1000))
    const t0 = performance.now()
    const wrap = player.getElement()?.querySelector('.player-wrap')
    wrap?.classList.add('walking')
    map.panTo(to, { animate: true, duration: dur / 1000, easeLinearity: 0.4 })
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur)
      const e = 1 - (1 - k) ** 2
      const cur = L.latLng(from.lat + (to.lat - from.lat) * e, from.lng + (to.lng - from.lng) * e)
      player.setLatLng(cur)
      circleRef.current.setLatLng(cur)
      if (k < 1) animRef.current = requestAnimationFrame(step)
      else wrap?.classList.remove('walking')
    }
    animRef.current = requestAnimationFrame(step)
  }, [pos])

  // Repoblar los objetos visibles cuando cambia posición, ventana de tiempo o recogidas
  useEffect(() => {
    const layer = itemsRef.current
    if (!layer) return
    layer.clearLayers()
    for (const item of spawnAround(pos, bucket)) {
      if (collected.has(item.id)) continue
      const marker = L.marker([item.lat, item.lng], { icon: itemIcon(item, vigilance) })
      marker.on('click', (e) => {
        if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent)
        cbs.current.onItemTap(item)
      })
      layer.addLayer(marker)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, bucket, collected, vigilance, retryKey])

  // El escondite del día: solo se materializa cuando estás muy cerca
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    hideoutRef.current?.remove()
    hideoutRef.current = null
    if (!hideout || distanceM(pos, hideout) > HIDEOUT_REVEAL_M) return
    const marker = L.marker([hideout.lat, hideout.lng], {
      icon: hideoutIcon(),
      zIndexOffset: 900,
    }).addTo(map)
    marker.on('click', (e) => {
      if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent)
      cbs.current.onHideoutTap(hideout)
    })
    hideoutRef.current = marker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hideout, pos, retryKey])

  // El Cofre del Gremio: igual que el Escondite, solo se materializa cerca
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    chestRef.current?.remove()
    chestRef.current = null
    if (!chest || distanceM(pos, chest) > HIDEOUT_REVEAL_M) return
    const marker = L.marker([chest.lat, chest.lng], {
      icon: chestIcon(),
      zIndexOffset: 900,
    }).addTo(map)
    marker.on('click', (e) => {
      if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent)
      cbs.current.onChestTap?.(chest)
    })
    chestRef.current = marker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chest, pos, retryKey])

  // Tu campamento: siempre visible en el mapa. Cuando estás encima (p. ej.
  // reclamando el botín diario) y el Compañero también anda cerca, los tres
  // marcadores (jugador, Compañero, campamento) coinciden casi en el mismo
  // punto — un desplazamiento fijo en pantalla (no en coordenadas reales,
  // así que a distancia se sigue viendo justo donde está) los separa, en un
  // cuadrante distinto al del Compañero para que no vuelvan a chocar.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    campRef.current?.remove()
    campRef.current = null
    if (!camp) return
    const close = distanceM(pos, camp) < 25
    const marker = L.marker([camp.lat, camp.lng], {
      icon: L.divIcon({
        className: '',
        html: `<div class="camp-wrap${close ? ' camp-nudge' : ''}"><div class="camp-marker">⛺</div></div>`,
        iconSize: [46, 46],
        iconAnchor: [23, 40],
      }),
      zIndexOffset: 1020, // por delante del jugador (1000): quedaba tapado al volver a casa
    }).addTo(map)
    marker.on('click', (e) => {
      if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent)
      cbs.current.onCampTap?.()
    })
    campRef.current = marker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camp, pos, retryKey])

  // El Núcleo del Desechador: a diferencia del Escondite (que solo se
  // materializa muy cerca), este se ve siempre que exista — es de todo el
  // servidor y hay que patrullar un radio grande para encontrarlo
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    nucleoRef.current?.remove()
    nucleoRef.current = null
    if (!nucleo) return
    const marker = L.marker([nucleo.lat, nucleo.lng], {
      icon: nucleoIcon(),
      zIndexOffset: 900,
    }).addTo(map)
    marker.on('click', (e) => {
      if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent)
      cbs.current.onNucleoTap?.(nucleo)
    })
    nucleoRef.current = marker
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nucleo, retryKey])

  // Otros recolectores conectados en tu zona (fase 2)
  useEffect(() => {
    const layer = peersRef.current
    if (!layer) return
    layer.clearLayers()
    for (const peer of peers) {
      if (typeof peer.lat !== 'number' || typeof peer.lng !== 'number') continue
      const marker = L.marker([peer.lat, peer.lng], { icon: peerIcon(peer) })
      marker.on('click', (e) => {
        if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent)
        cbs.current.onPeerTap?.(peer)
      })
      layer.addLayer(marker)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peers, retryKey])

  function recenter() {
    mapRef.current?.flyTo(playerRef.current.getLatLng(), 17, { duration: 0.6 })
  }

  return (
    <div className="map-wrap">
      <div className="map-root" ref={elRef} />
      <div className="map-vignette" />
      <div className="map-grain" />
      {weather === 'storm' && <div className="rain" />}
      {vigilance && (
        <>
          <div className="sandstorm" />
          <div className="ufo">
            <span className="ufo-ship">🛸</span>
            <span className="ufo-beam" />
          </div>
        </>
      )}
      {[...Array(10)].map((_, i) => (
        <span
          key={i}
          className="mote"
          style={{
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 53 + 23) % 90}%`,
            width: `${3 + (i % 3) * 2}px`,
            height: `${3 + (i % 3) * 2}px`,
            animationDuration: `${9 + (i % 5) * 3}s`,
            animationDelay: `-${i * 1.7}s`,
          }}
        />
      ))}
      <button className="recenter-btn" onClick={recenter} aria-label={t('Centrar en el jugador')}>
        🎯
      </button>
      {tilesFailed && (
        <div className="tiles-failed">
          <p>{t('📡 El mapa no consigue cargar. Si usas el ahorro de datos o una VPN del navegador, prueba a desactivarlo.')}</p>
          <button onClick={() => setRetryKey((k) => k + 1)}>{t('Reintentar')}</button>
        </div>
      )}
    </div>
  )
}
