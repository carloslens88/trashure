import { useEffect, useMemo, useRef, useState } from 'react'
import MapView from './ui/MapView'
import HUD from './ui/HUD'
import Inventory from './ui/Inventory'
import Catalog from './ui/Catalog'
import CollectModal from './ui/CollectModal'
import Market from './ui/Market'
import Leaderboard from './ui/Leaderboard'
import Missions from './ui/Missions'
import Account from './ui/Account'
import Compass from './ui/Compass'
import HideoutModal from './ui/HideoutModal'
import PetModal from './ui/PetModal'
import FactionModal from './ui/FactionModal'
import LinkNudgeModal from './ui/LinkNudgeModal'
import AbductionGame from './ui/AbductionGame'
import BossModal from './ui/BossModal'
import CampModal from './ui/CampModal'
import { BY_ID, RARITIES, FACTIONS, levelInfo } from './game/items'
import {
  currentBucket,
  nextRefreshMs,
  currentDay,
  distanceM,
  bearingDeg,
  eventAt,
  nearbyHideouts,
  anomaliesNear,
  spawnAround,
  vigilanceAt,
  ZONE_EVENTS,
  COLLECT_RADIUS,
} from './game/spawn'
import { SPECIES, HATCH_M, petLevel, sniffRadius, cardinal } from './game/pet'
import { LORE_FRAGMENTS } from './game/lore'
import { t } from './game/i18n'
import { watchPosition } from './game/geo'
import { cellOf, FOG_STORM_MS } from './ui/fog'
import { fetchWeather } from './game/weather'
import { loadSave, persist } from './game/state'
import {
  initSound,
  setMuted,
  isReady,
  playCollect,
  playCoin,
  playLevelUp,
  playHideout,
  playError,
  playVigilance,
} from './game/sound'
import {
  isOnline,
  ensureSession,
  fetchProfile,
  fetchInventory,
  collectOnline,
  sellItemOnline,
  joinFaction,
  joinZone,
  zoneKey,
  reportExplored,
  anomalyFlee,
  fetchBossStatus,
  consumeAuthRedirect,
} from './game/online'

const DEFAULT_POS = { lat: 40.4168, lng: -3.7038 } // Puerta del Sol, Madrid

// La racha cuenta días UTC (igual que el servidor)
const utcToday = () => new Date().toISOString().slice(0, 10)

export default function App() {
  const saved = useMemo(loadSave, [])
  const [pos, setPos] = useState(saved.pos ?? DEFAULT_POS)
  const [inventory, setInventory] = useState(saved.inventory)
  const [collected, setCollected] = useState(() => new Set(saved.collected))
  const [discovered, setDiscovered] = useState(() => new Set(saved.discovered))
  const [scrap, setScrap] = useState(saved.scrap)
  const [xp, setXp] = useState(saved.xp)
  const [bucket, setBucket] = useState(currentBucket())
  const [tab, setTab] = useState('map')
  const [modalItem, setModalItem] = useState(null)
  const [toast, setToast] = useState(null)
  const [showIntro, setShowIntro] = useState(!saved.introSeen)
  const [peers, setPeers] = useState([])
  // 'locating' → esperando el primer fix; 'on' → GPS activo; 'denied' → permiso rechazado
  const [gpsState, setGpsState] = useState('locating')
  const gpsActive = gpsState === 'on'
  // Modo online: la mochila, el XP y la Chatarra vienen del servidor
  const [online, setOnline] = useState(false)
  const [serverInv, setServerInv] = useState([])
  const [showRank, setShowRank] = useState(false)
  const [showMissions, setShowMissions] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [username, setUsername] = useState(null)
  const [soundMuted, setSoundMuted] = useState(saved.muted)
  const [streak, setStreak] = useState(0)
  // Día UTC de tu última recogida: si no es hoy, la racha está "pendiente"
  const [lastDay, setLastDay] = useState(null)
  const [title, setTitle] = useState(null)
  const [weather, setWeather] = useState('clear')
  const [xpFloats, setXpFloats] = useState([])
  const [flyItems, setFlyItems] = useState([])
  const [flyCoins, setFlyCoins] = useState([])
  const [levelBurst, setLevelBurst] = useState(null)
  // Minijuego de Abducción: el Vigía intenta robarte la recogida
  const [abduction, setAbduction] = useState(null)
  // El Reclamador (jefe de zona) y tu Campamento
  const [boss, setBoss] = useState(null)
  const [showBoss, setShowBoss] = useState(false)
  const [camp, setCampState] = useState(null)
  const [showCamp, setShowCamp] = useState(false)

  function addXpFloat(text) {
    const id = `${Date.now()}-${Math.random()}`
    setXpFloats((f) => [...f, { id, text }])
    setTimeout(() => setXpFloats((f) => f.filter((x) => x.id !== id)), 1600)
  }

  // El objeto recogido vuela hasta la mochila
  function addFlyItem(emoji) {
    const id = `${Date.now()}-${Math.random()}`
    setFlyItems((f) => [...f, { id, emoji }])
    setTimeout(() => setFlyItems((f) => f.filter((x) => x.id !== id)), 950)
  }

  // La Chatarra vuela hasta el contador
  function addFlyCoin() {
    const id = `${Date.now()}-${Math.random()}`
    setFlyCoins((f) => [...f, { id }])
    setTimeout(() => setFlyCoins((f) => f.filter((x) => x.id !== id)), 850)
  }

  // Subida de nivel: toast + fanfarria + explosión dorada
  function maybeLevelUp(oldXp, newXp) {
    const newLevel = levelInfo(newXp).level
    if (newLevel <= levelInfo(oldXp).level) return
    showToast(t('🎉 ¡Nivel {n}!', { n: newLevel }))
    playLevelUp()
    setLevelBurst(newLevel)
    setTimeout(() => setLevelBurst(null), 1500)
  }

  // El audio solo puede arrancar tras un gesto del usuario. Cada navegador
  // considera "gesto" una cosa distinta: escuchar varios y desarmarlos todos.
  useEffect(() => {
    const events = ['pointerdown', 'touchend', 'click', 'keydown']
    const unlock = () => {
      initSound(loadSave().muted)
      events.forEach((e) => window.removeEventListener(e, unlock))
    }
    events.forEach((e) => window.addEventListener(e, unlock))
    return () => events.forEach((e) => window.removeEventListener(e, unlock))
  }, [])

  function toggleMute() {
    const next = !soundMuted
    setSoundMuted(next)
    if (isReady()) setMuted(next)
    else initSound(next)
    if (!next) playCoin() // blip de confirmación: "sí, suena"
  }
  const [faction, setFaction] = useState(null)
  const [showFaction, setShowFaction] = useState(false)
  // Aviso de "vincula tu email" al llegar a nivel 3 siendo invitado — una
  // vez, nunca bloquea (ver LinkNudgeModal)
  const [isAnonymous, setIsAnonymous] = useState(null)
  const [linkNudgeDismissed, setLinkNudgeDismissed] = useState(saved.linkNudgeDismissed)
  const [showLinkNudge, setShowLinkNudge] = useState(false)
  // Escondites de los Desechadores
  const [claimedHideouts, setClaimedHideouts] = useState(() => new Set(saved.claimedHideouts))
  const [loreCount, setLoreCount] = useState(saved.loreCount)
  // El Compañero (Fragmento X): huevo → criatura que camina contigo
  const [pet, setPet] = useState(saved.pet)
  const [petModal, setPetModal] = useState(null) // 'egg-found' | 'hatched' | 'info'

  // Niebla Tóxica: celdas despejadas caminando [[lat, lng, últimaVisitaMs]]
  // (los guardados anteriores no llevaban sello de tiempo: se les da el de hoy)
  const [explored, setExplored] = useState(() =>
    saved.explored.map((c) => (c.length >= 3 ? c : [c[0], c[1], Date.now()])),
  )
  // Territorio acumulado histórico: no baja aunque la tormenta re-cubra sectores
  const [exploredTotal, setExploredTotal] = useState(
    Math.max(saved.exploredTotal, saved.explored.length),
  )
  const exploredKeys = useRef(null)
  if (exploredKeys.current === null) {
    exploredKeys.current = new Map(
      saved.explored.map((c) => [cellOf({ lat: c[0], lng: c[1] }).key, c[2] ?? Date.now()]),
    )
  }
  const exploredRef = useRef(explored)
  exploredRef.current = explored
  const [hideoutModal, setHideoutModal] = useState(null)
  const toastTimer = useRef(0)
  const zoneRef = useRef(null)
  const zone = zoneKey(pos)

  async function refreshServerInv() {
    try {
      const rows = await fetchInventory()
      setServerInv(rows)
      // lo recibido en trueques también cuenta como descubierto
      setDiscovered((prev) => new Set([...prev, ...rows.map((r) => r.type_id)]))
    } catch (e) {
      console.warn('[online] inventario:', e.message)
    }
  }

  // GPS real si el usuario lo permite; si no, modo paseo (pruebas) tocando el mapa
  useEffect(() => {
    return watchPosition(
      (p) => {
        setGpsState('on')
        setPos(p)
      },
      (err) => {
        // Solo el rechazo del permiso es definitivo. Los cortes de señal
        // (timeout, sin cobertura) se recuperan solos: no tumbar el estado
        // ni volver a enseñar el banner si ya hubo un fix.
        const denied = err?.code === 1 || /denied|permission/i.test(err?.message ?? '')
        if (denied) setGpsState('denied')
        else setGpsState((s) => (s === 'on' ? s : 'locating'))
      },
    )
  }, [])

  // Cada celda pisada queda cartografiada (con tope de tamaño); patrullar una
  // celda conocida refresca su sello para que la tormenta no la reclame
  useEffect(() => {
    const cell = cellOf(pos)
    const now = Date.now()
    const lastMs = exploredKeys.current.get(cell.key)
    if (lastMs && now - lastMs < 3600_000) return
    exploredKeys.current.set(cell.key, now)
    if (lastMs) {
      setExplored((e) =>
        e.map((c) => (cellOf({ lat: c[0], lng: c[1] }).key === cell.key ? [c[0], c[1], now] : c)),
      )
      return
    }
    setExplored((e) => [...e.slice(-5999), [cell.lat, cell.lng, now]])
    setExploredTotal((total) => {
      const n = total + 1
      if (n % 100 === 0) showToast(t('🗺️ ¡{n} sectores del yermo cartografiados!', { n }))
      return n
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos])

  // El Huevo aparece entre los escombros al llegar a nivel 2
  useEffect(() => {
    if (pet.stage !== 'none' || levelInfo(xp).level < 2) return
    setPet((p) => ({ ...p, stage: 'egg' }))
    setPetModal('egg-found')
    playHideout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp, pet.stage])

  // Incubación y niveles: solo cuentan pasos plausibles (ni quieto ni saltos)
  const petPrevPos = useRef(pos)
  useEffect(() => {
    const prev = petPrevPos.current
    petPrevPos.current = pos
    if (pet.stage === 'none') return
    const d = distanceM(prev, pos)
    if (d < 2 || d > 200) return
    const walked = pet.walkedM + d
    if (pet.stage === 'egg' && walked >= HATCH_M) {
      setPet({ stage: 'hatched', species: Math.floor(Math.random() * SPECIES.length), walkedM: walked })
      setPetModal('hatched')
      playLevelUp()
      return
    }
    if (pet.stage === 'hatched' && petLevel(walked) > petLevel(pet.walkedM)) {
      const name = SPECIES[pet.species].name
      showToast(t('🐾 ¡{name} sube a nivel {n}! Su olfato se afina', { name, n: petLevel(walked) }))
      playCoin()
    }
    setPet((p) => ({ ...p, walkedM: walked }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos])

  // Olfato: cada medio minuto husmea tesoros raros+ a su alcance
  const sniffCtx = useRef({})
  sniffCtx.current = { pos, pet, bucket, collected, tab }
  useEffect(() => {
    const iv = setInterval(() => {
      const { pos, pet, bucket, collected, tab } = sniffCtx.current
      if (pet.stage !== 'hatched' || tab !== 'map') return
      const radius = sniffRadius(petLevel(pet.walkedM))
      const treasures = [
        ...spawnAround(pos, bucket),
        ...anomaliesNear(pos).flatMap((a) => a.items),
      ].filter(
        (it) =>
          !collected.has(it.id) &&
          !['comun', 'pocoComun'].includes(it.type.rarity) &&
          distanceM(pos, it) > COLLECT_RADIUS &&
          distanceM(pos, it) <= radius,
      )
      if (treasures.length === 0) return
      treasures.sort((a, b) => distanceM(pos, a) - distanceM(pos, b))
      const target = treasures[0]
      const species = SPECIES[pet.species]
      showToast(
        t('{emoji} ¡{name} olfatea algo valioso a {d} m al {dir}!', {
          emoji: species.emoji,
          name: species.name,
          d: Math.round(distanceM(pos, target)),
          dir: t(cardinal(bearingDeg(pos, target))),
        }),
      )
      playCoin()
    }, 30000)
    return () => clearInterval(iv)
  }, [])

  // Tormenta tóxica: la niebla reclama los sectores sin patrullar hace días
  useEffect(() => {
    const sweep = () => {
      const cutoff = Date.now() - FOG_STORM_MS
      const cur = exploredRef.current
      const alive = cur.filter((c) => (c[2] ?? 0) > cutoff)
      if (alive.length === cur.length) return
      exploredKeys.current = new Map(
        alive.map((c) => [cellOf({ lat: c[0], lng: c[1] }).key, c[2]]),
      )
      setExplored(alive)
      showToast(
        t('🌪️ Tormenta tóxica: la niebla ha reclamado {n} sectores', {
          n: cur.length - alive.length,
        }),
      )
    }
    sweep()
    const iv = setInterval(sweep, 10 * 60 * 1000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // El territorio acumulado se presume en el ranking: reporte perezoso
  useEffect(() => {
    if (!online || exploredTotal === 0) return
    const t = setTimeout(() => reportExplored(exploredTotal).catch(() => {}), 4000)
    return () => clearTimeout(t)
  }, [online, exploredTotal])

  // En vez de sondear cada 15 s (lo que puede dejar hasta ~15 s de retraso
  // tras el corte real de la ventana de 10 min), se programa un disparo
  // exacto para el instante en que cambia el bucket — el reparto se ve
  // renovarse al momento, no con un margen perceptible de espera.
  useEffect(() => {
    let timer
    const schedule = () => {
      timer = setTimeout(() => {
        setBucket(currentBucket())
        schedule()
      }, nextRefreshMs() + 50) // pequeño colchón: asegura que el bucket ya cambió
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])

  // Fase 2: sesión anónima; el perfil del servidor manda sobre XP y Chatarra
  useEffect(() => {
    if (!isOnline) return
    // Si vienes de un enlace de email (confirmar cuenta / iniciar sesión),
    // esto lo detecta y lo limpia de la URL ANTES de que nada más la lea.
    // Sin esto, un enlace caducado o ya usado (de un solo uso) simplemente
    // no hacía nada visible — ahora se avisa siempre, éxito o fallo.
    const authRedirect = consumeAuthRedirect()
    if (authRedirect && !authRedirect.ok) {
      showToast(
        t('⚠️ Ese enlace ya no es válido (puede que ya se haya usado o haya caducado): {e}', {
          e: authRedirect.message ?? t('enlace inválido'),
        }),
      )
    }
    let cancelled = false
    ensureSession().then(async (user) => {
      if (cancelled || !user) return
      setOnline(true)
      setIsAnonymous(Boolean(user.is_anonymous) && !user.email)
      const profile = await fetchProfile()
      if (cancelled) return
      if (profile) {
        setXp(profile.xp)
        setScrap(profile.scrap)
        setFaction(profile.faction)
        setUsername(profile.username)
        setStreak(profile.streak ?? 0)
        setLastDay(profile.last_day ?? null)
        setTitle(profile.title)
        // territorio: el mayor entre lo local y lo que conoce el servidor
        setExploredTotal((t) => Math.max(t, profile.explored ?? 0))
        if (profile.camp_lat != null) {
          setCampState({
            lat: profile.camp_lat,
            lng: profile.camp_lng,
            movedAt: profile.camp_moved_at,
            claimDay: profile.camp_claim_day,
          })
        }
        if (!profile.faction) setShowFaction(true)
        if (authRedirect?.ok) {
          showToast(t('✅ ¡Sesión iniciada! Bienvenido de vuelta, {name}', { name: profile.username }))
        }
      }
      refreshServerInv()
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Presencia en la zona (~1 km)
  useEffect(() => {
    if (!online) return
    zoneRef.current = joinZone(pos, setPeers)
    return () => {
      zoneRef.current?.leave()
      zoneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone, online])

  // Movimientos dentro de la misma zona: refresca tu posición para los demás
  useEffect(() => {
    zoneRef.current?.move(pos)
  }, [pos])

  // Clima real de tu zona (cada ~15 min o al cambiar de zona)
  useEffect(() => {
    let cancelled = false
    const update = () => fetchWeather(pos).then((w) => !cancelled && setWeather(w))
    update()
    const t = setInterval(update, 15 * 60 * 1000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone])

  // El Reclamador de la región (~2 km): refrescar al cambiar de región y cada minuto
  const bossRegion = `${Math.floor(pos.lng / 0.02)}:${Math.floor(pos.lat / 0.02)}`
  const bossCtx = useRef(pos)
  bossCtx.current = pos
  function refreshBoss() {
    fetchBossStatus(bossCtx.current)
      .then(setBoss)
      .catch(() => {})
  }
  useEffect(() => {
    if (!online) return
    refreshBoss()
    const iv = setInterval(refreshBoss, 60000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bossRegion, online])

  // La mochila del servidor cambia también por trueques: refrescar
  // periódicamente y al abrirla
  useEffect(() => {
    if (!online) return
    if (tab === 'bag') refreshServerInv()
    const t = setInterval(refreshServerInv, 20000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, tab])

  // Al renovarse la zona, olvida las recogidas de ventanas anteriores
  // (el botín de anomalía `A:day:…` vive un día, no un bucket)
  useEffect(() => {
    const today = currentDay()
    setCollected(
      (ids) =>
        new Set(
          [...ids].filter(
            (id) =>
              id.startsWith(`${bucket}:`) ||
              (id.startsWith('A:') && Number(id.split(':')[1]) >= today - 1),
          ),
        ),
    )
  }, [bucket])

  useEffect(() => {
    const today = currentDay()
    persist({
      pos,
      inventory,
      collected: [...collected],
      discovered: [...discovered],
      claimedHideouts: [...claimedHideouts].filter((id) => Number(id.split(':')[1]) >= today - 1),
      explored,
      exploredTotal,
      loreCount,
      pet,
      scrap,
      xp,
      muted: soundMuted,
      introSeen: !showIntro,
      linkNudgeDismissed,
    })
  }, [pos, inventory, collected, discovered, claimedHideouts, explored, exploredTotal, loreCount, pet, scrap, xp, soundMuted, showIntro, linkNudgeDismissed])

  // Aviso de vincular email: una vez, al llegar a nivel 3 siendo invitado
  // (después del Compañero, que aparece en nivel 2 — así no compiten)
  useEffect(() => {
    if (!online || isAnonymous !== true || linkNudgeDismissed || showLinkNudge) return
    if (levelInfo(xp).level >= 3) setShowLinkNudge(true)
  }, [xp, online, isAnonymous, linkNudgeDismissed, showLinkNudge])

  function dismissLinkNudge() {
    setShowLinkNudge(false)
    setLinkNudgeDismissed(true)
  }

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  // En modo GPS el mapa no te mueve: hay que caminar de verdad.
  // El modo paseo (tocar el mapa) SOLO existe en builds de desarrollo:
  // en producción sería un teletransporte gratis.
  const paseoAllowed = import.meta.env.DEV

  // Defensa extra contra el spam del aviso (el doble tap ya se filtra en
  // MapView, pero esto cubre cualquier otra vía de toques repetidos)
  const gpsToastAt = useRef(0)
  function handleWalk(p) {
    if (gpsActive) {
      const now = Date.now()
      if (now - gpsToastAt.current > 3000) {
        gpsToastAt.current = now
        showToast(t('🛰️ GPS activo: para moverte, ¡camina!'))
      }
      return
    }
    if (!paseoAllowed) {
      showToast(t('📵 Activa la ubicación: Trashure se juega caminando'))
      return
    }
    setPos(p)
  }

  // Tocar un objeto solo lo inspecciona; se recoge al confirmar en el modal
  function handleItemTap(item) {
    if (!gpsActive && !paseoAllowed) {
      showToast(t('📵 Activa la ubicación para recoger objetos'))
      return
    }
    if (distanceM(pos, item) > COLLECT_RADIUS) {
      showToast(t('¡Demasiado lejos! Acércate para recogerlo 🚶'))
      return
    }
    setModalItem(item)
  }

  async function confirmCollect() {
    const item = modalItem
    setModalItem(null)
    if (!item || collected.has(item.id)) return
    // Bajo Vigilancia, el Vigía intenta abducir tu hallazgo: minijuego.
    // (El botín de anomalía queda fuera: perderlo castigaría doble.)
    if (vigilActive && !item.id.startsWith('A:')) {
      setAbduction(item)
      return
    }
    await performCollect(item)
  }

  function abductionWin() {
    const item = abduction
    setAbduction(null)
    performCollect(item)
  }

  function abductionLose() {
    const item = abduction
    setAbduction(null)
    setCollected((s) => new Set(s).add(item.id)) // el Vigía se lo llevó
    showToast(t('👾 El Vigía se llevó tu hallazgo… La próxima vez, toca más rápido'))
  }

  async function performCollect(item) {
    setCollected((s) => new Set(s).add(item.id)) // optimista: ocultar del mapa
    setDiscovered((s) => new Set(s).add(item.type.id))
    // recoger dentro de la anomalía te libra del castigo de la radiación
    const settleAnomaly = () => {
      if (item.id.startsWith('A:') && anomalyVisit.current) anomalyVisit.current.collected = true
    }

    if (online) {
      // Autoritativo: el servidor valida, guarda y concede el XP
      try {
        const res = await collectOnline(item, pos)
        settleAnomaly()
        const newXp = res.xp || xp + res.xpGained
        if (typeof res.streak === 'number') setStreak(res.streak)
        setLastDay(utcToday())
        playCollect(item.type.rarity)
        addXpFloat(`+${res.xpGained} XP`)
        addFlyItem(item.type.emoji)
        maybeLevelUp(xp, newXp)
        setXp(newXp)
        setServerInv((inv) => [{ id: res.itemId, type_id: res.typeId, owner: null }, ...inv])
        refreshBoss() // tu recogida acaba de dañar al Reclamador
      } catch (e) {
        setCollected((s) => {
          const next = new Set(s)
          next.delete(item.id)
          return next
        })
        playError()
        showToast(t('⚖️ El Gremio rechazó la recogida: {e}', { e: t(e.message) }))
      }
      return
    }

    settleAnomaly()
    setInventory((inv) => [...inv, { typeId: item.type.id, at: Date.now() }])
    const gained = RARITIES[item.type.rarity].xp
    playCollect(item.type.rarity)
    addXpFloat(`+${gained} XP`)
    addFlyItem(item.type.emoji)
    maybeLevelUp(xp, xp + gained)
    setXp((x) => x + gained)
  }

  async function handleSell(typeId) {
    if (online) {
      const row = serverInv.find((r) => r.type_id === typeId)
      if (!row) return
      try {
        const newScrap = await sellItemOnline(row.id)
        playCoin()
        addFlyCoin()
        setScrap(newScrap)
        setServerInv((inv) => inv.filter((r) => r.id !== row.id))
      } catch (e) {
        showToast(t('No se pudo vender: {e}', { e: t(e.message) }))
        refreshServerInv()
      }
      return
    }
    const idx = inventory.findIndex((e) => e.typeId === typeId)
    if (idx === -1) return
    playCoin()
    addFlyCoin()
    setInventory((inv) => inv.filter((_, i) => i !== idx))
    setScrap((s) => s + RARITIES[BY_ID[typeId].rarity].value)
  }

  // La mochila muestra el inventario del servidor cuando hay sesión
  const bagEntries = online ? serverInv.map((r) => ({ typeId: r.type_id })) : inventory

  // Evento de zona activo donde estás (lore procedural, cambia a diario)
  const activeEvent = ZONE_EVENTS[eventAt(pos, bucket)] ?? null

  // ¡Vigilancia Alienígena! Aleatoria por zona en cada franja de 10 min
  const vigilActive = vigilanceAt(pos, bucket)
  const vigilWasActive = useRef(false)
  useEffect(() => {
    if (vigilActive && !vigilWasActive.current) {
      playVigilance()
      showToast(t('🛸 ¡VIGILANCIA ALIENÍGENA! ×2 XP mientras dure'))
    }
    vigilWasActive.current = vigilActive
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vigilActive])

  // Anomalías radiactivas cercanas (sin el botín ya recogido)
  const anomalies = useMemo(
    () =>
      anomaliesNear(pos).map((a) => ({
        ...a,
        items: a.items.filter((it) => !collected.has(it.id)),
      })),
    [pos, collected, bucket], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const inAnomaly = anomalies.find((a) => distanceM(pos, a) < a.radius) ?? null

  // El riesgo: entrar en una anomalía y largarse sin recoger borra tu racha.
  // Solo cuenta como huida de verdad: haber estado ≥25 s dentro (pasar de
  // largo no castiga) y salir andando (un salto de GPS tampoco).
  const anomalyVisit = useRef(null)
  function fleeAnomaly(visit) {
    if (!visit || visit.collected || !online || streak <= 0) return
    if (Date.now() - visit.at < 25000) return // pasó de largo: sin castigo
    anomalyFlee()
      .then(() => {
        setStreak(0)
        playError()
        showToast(t('☠️ Huiste de la anomalía: la radiación borró tu racha'))
      })
      .catch(() => {})
  }
  useEffect(() => {
    const cur = anomalyVisit.current
    if (inAnomaly && (!cur || cur.id !== inAnomaly.id)) {
      fleeAnomaly(cur) // saltar directo a otra anomalía también consuma la huida
      // una anomalía ya saqueada no expone a nada
      anomalyVisit.current = {
        id: inAnomaly.id,
        collected: inAnomaly.items.length === 0,
        at: Date.now(),
      }
      if (inAnomaly.items.length > 0) {
        playVigilance()
        showToast(t('☢️ Anomalía radiactiva: recoge el botín antes de irte o perderás tu racha'))
      }
    } else if (cur && !inAnomaly) {
      const visited = anomaliesNear(pos).find((x) => x.id === cur.id)
      // la anomalía se disipó (cambió el día): no hay nada de lo que huir
      if (!visited) {
        anomalyVisit.current = null
        return
      }
      // histéresis: la huida solo se consuma al alejarse radio + 60 m
      const dist = distanceM(pos, visited)
      if (dist <= visited.radius + 60) return
      anomalyVisit.current = null
      // reaparecer a >600 m es un salto de GPS o una recarga, no una huida
      if (dist > 600) return
      fleeAnomaly(cur)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos])

  // El escondite sin reclamar más cercano: el objetivo de la brújula
  const hideout = useMemo(
    () => nearbyHideouts(pos).find((h) => !claimedHideouts.has(h.id)) ?? null,
    [pos, claimedHideouts, bucket], // eslint-disable-line react-hooks/exhaustive-deps
  )

  function handleHideoutTap(h) {
    if (!gpsActive && !paseoAllowed) {
      showToast(t('📵 Activa la ubicación para abrir escondites'))
      return
    }
    if (distanceM(pos, h) > COLLECT_RADIUS) {
      showToast(t('🧭 La brújula vibra… pero aún no estás encima'))
      return
    }
    setHideoutModal({ hideout: h, opened: false })
  }

  async function openHideout() {
    const h = hideoutModal.hideout
    playHideout()
    const fragment = LORE_FRAGMENTS[Math.min(loreCount, LORE_FRAGMENTS.length - 1)]
    let gained
    if (online) {
      try {
        const res = await collectOnline({ id: h.id, type: h.type }, pos)
        gained = res.xpGained
        if (typeof res.streak === 'number') setStreak(res.streak)
        setLastDay(utcToday())
        const newXp = res.xp || xp + res.xpGained
        maybeLevelUp(xp, newXp)
        setXp(newXp)
        setServerInv((inv) => [{ id: res.itemId, type_id: res.typeId, owner: null }, ...inv])
      } catch (e) {
        setHideoutModal(null)
        showToast(t('⚖️ El Gremio no lo reconoce: {e}', { e: t(e.message) }))
        return
      }
    } else {
      gained = RARITIES[h.type.rarity].xp + 150
      maybeLevelUp(xp, xp + gained)
      setXp((x) => x + gained)
      setInventory((inv) => [...inv, { typeId: h.type.id, at: Date.now() }])
    }
    setClaimedHideouts((s) => new Set(s).add(h.id))
    setDiscovered((s) => new Set(s).add(h.type.id))
    setLoreCount((c) => Math.min(c + 1, LORE_FRAGMENTS.length))
    setHideoutModal({ hideout: h, opened: true, fragment, xpGained: gained })
  }

  async function pickFaction(key) {
    try {
      await joinFaction(key)
      setFaction(key)
      setShowFaction(false)
      showToast(
        t('{emoji} ¡Bienvenido a los {name}!', {
          emoji: FACTIONS[key].emoji,
          name: t(FACTIONS[key].name),
        }),
      )
    } catch (e) {
      showToast(t('No se pudo: {e}', { e: t(e.message) }))
      setShowFaction(false)
    }
  }

  // Noche real: el yermo cambia de cara cuando oscurece
  const hour = new Date().getHours()
  const night = hour >= 20 || hour < 7

  return (
    <div className={`app ${night ? 'night' : ''}`}>
      <MapView
        pos={pos}
        bucket={bucket}
        collected={collected}
        peers={peers}
        hideout={hideout}
        weather={weather}
        vigilance={vigilActive}
        night={night}
        explored={explored}
        anomalies={anomalies}
        pet={pet.stage === 'hatched' ? SPECIES[pet.species] : null}
        camp={camp}
        onWalk={handleWalk}
        onItemTap={handleItemTap}
        onHideoutTap={handleHideoutTap}
        onCampTap={() => setShowCamp(true)}
      />

      {tab === 'map' && vigilActive && (
        <div className="vigil-banner">{t('🛸 VIGILANCIA ALIENÍGENA — ×2 XP')}</div>
      )}
      {tab === 'map' && inAnomaly && inAnomaly.items.length > 0 && (
        <div className="anomaly-banner">
          {t('☢️ ANOMALÍA RADIACTIVA — recoge el botín o perderás tu racha')}
        </div>
      )}
      {tab === 'map' &&
        xpFloats.map((f) => (
          <div key={f.id} className="xp-float">
            {f.text}
          </div>
        ))}
      {flyItems.map((f) => (
        <div key={f.id} className="fly-item">
          {f.emoji}
        </div>
      ))}
      {flyCoins.map((f) => (
        <div key={f.id} className="fly-coin">
          ⚙️
        </div>
      ))}
      {levelBurst && (
        <div className="levelup-burst">
          <div className="burst-rays" />
          <span className="burst-text">¡NIVEL {levelBurst}!</span>
        </div>
      )}
      <HUD
        xp={xp}
        scrap={scrap}
        peerCount={peers.length}
        zoneEvent={activeEvent}
        faction={faction ? FACTIONS[faction] : null}
        onOpenAccount={online ? () => setShowAccount(true) : null}
        slim={tab !== 'map'}
        gpsLabel={
          gpsActive
            ? t('🛰️ GPS')
            : paseoAllowed
              ? t('🚶 Paseo (pruebas)')
              : gpsState === 'locating'
                ? t('🛰️ Buscando…')
                : t('📵 Sin GPS')
        }
        muted={soundMuted}
        onToggleMute={toggleMute}
        streak={streak}
        streakPending={lastDay !== utcToday()}
        weather={weather}
        pet={pet}
        onPetTap={() => setPetModal('info')}
      />

      {/* Mientras llega el primer fix NO se invita a recargar (cada recarga
          reinicia el estado, sin garantía de que el navegador vuelva a
          preguntar). Una vez DENEGADO, recargar NO sirve de nada: el
          navegador recuerda la negativa por sitio y no vuelve a preguntar
          solo — hay que reactivarlo a mano en sus propios ajustes. El
          mensaje se lo explica; el toque sirve para reintentar después. */}
      {tab === 'map' && gpsState === 'locating' && !paseoAllowed && (
        <div className="gps-banner searching">{t('🛰️ Buscando tu señal GPS…')}</div>
      )}
      {tab === 'map' && gpsState === 'denied' && !paseoAllowed && (
        <button className="gps-banner" onClick={() => window.location.reload()}>
          {t(
            '📵 Tu navegador bloqueó la ubicación. Actívala en los ajustes del sitio (icono junto a la barra de direcciones) y toca aquí para reintentar.',
          )}
        </button>
      )}

      {showAccount && (
        <Account
          username={username}
          faction={faction}
          xp={xp}
          scrap={scrap}
          explored={exploredTotal}
          equippedTitle={title}
          onTitle={setTitle}
          onScrap={setScrap}
          onRenamed={setUsername}
          onToast={showToast}
          onClose={() => setShowAccount(false)}
        />
      )}

      {tab === 'map' && hideout && <Compass pos={pos} hideout={hideout} />}

      {online && (
        <button className="rank-btn" onClick={() => setShowRank(true)} aria-label={t('Ranking')}>
          🏆
        </button>
      )}
      {online && (
        <button
          className="missions-btn"
          onClick={() => setShowMissions(true)}
          aria-label={t('Contratos del Gremio')}
        >
          📋
        </button>
      )}
      {online && tab === 'map' && (
        <button className="camp-btn" onClick={() => setShowCamp(true)} aria-label={t('Tu campamento')}>
          ⛺
        </button>
      )}
      {online && tab === 'map' && boss && (
        <button
          className={`boss-chip ${Number(boss.hp_done) >= boss.hp_goal ? 'dead' : ''}`}
          onClick={() => setShowBoss(true)}
        >
          👾{' '}
          {Number(boss.hp_done) >= boss.hp_goal
            ? boss.claimed
              ? t('derrotado')
              : t('¡botín!')
            : `${Math.max(0, boss.hp_goal - Number(boss.hp_done)).toLocaleString()} PV`}
        </button>
      )}
      {showRank && <Leaderboard onClose={() => setShowRank(false)} />}
      {showMissions && (
        <Missions
          pos={pos}
          onScrap={setScrap}
          onToast={showToast}
          onClose={() => setShowMissions(false)}
        />
      )}

      {tab === 'bag' && <Inventory inventory={bagEntries} onSell={handleSell} />}
      {tab === 'catalog' && (
        <Catalog
          discovered={discovered}
          loreCount={loreCount}
          online={online}
          onScrap={setScrap}
          onToast={showToast}
        />
      )}
      {tab === 'trade' && (
        <Market
          peers={peers}
          scrap={scrap}
          onScrap={setScrap}
          onInvChanged={refreshServerInv}
          onToast={showToast}
        />
      )}

      <nav className="tabbar">
        <button className={tab === 'map' ? 'active' : ''} onClick={() => setTab('map')}>
          🗺️<span>{t('Mapa')}</span>
        </button>
        <button className={tab === 'bag' ? 'active' : ''} onClick={() => setTab('bag')}>
          🎒<span>{t('Mochila')}</span>
          {bagEntries.length > 0 && (
            <em className="badge" key={bagEntries.length}>
              {bagEntries.length}
            </em>
          )}
        </button>
        <button className={tab === 'catalog' ? 'active' : ''} onClick={() => setTab('catalog')}>
          📖<span>{t('Catálogo')}</span>
        </button>
        <button className={tab === 'trade' ? 'active' : ''} onClick={() => setTab('trade')}>
          🏪<span>{t('Mercado')}</span>
        </button>
      </nav>

      {modalItem && (
        <CollectModal
          item={modalItem}
          onConfirm={confirmCollect}
          onDismiss={() => setModalItem(null)}
        />
      )}
      {hideoutModal && (
        <HideoutModal
          state={hideoutModal}
          onOpen={openHideout}
          onClose={() => setHideoutModal(null)}
        />
      )}
      {petModal && <PetModal mode={petModal} pet={pet} onClose={() => setPetModal(null)} />}
      {abduction && (
        <AbductionGame item={abduction} onWin={abductionWin} onLose={abductionLose} />
      )}
      {showBoss && boss && (
        <BossModal
          pos={pos}
          status={boss}
          onScrap={setScrap}
          onToast={showToast}
          onClaimed={() => {
            refreshBoss()
            setShowBoss(false)
          }}
          onClose={() => setShowBoss(false)}
        />
      )}
      {showCamp && (
        <CampModal
          pos={pos}
          camp={camp}
          onCamp={setCampState}
          onScrap={setScrap}
          onToast={showToast}
          onClose={() => setShowCamp(false)}
        />
      )}
      {showFaction && !showIntro && (
        <FactionModal onPick={pickFaction} onLater={() => setShowFaction(false)} />
      )}
      {showLinkNudge && !showFaction && !showIntro && !petModal && (
        <LinkNudgeModal
          level={levelInfo(xp).level}
          onLink={() => {
            dismissLinkNudge()
            setShowAccount(true)
          }}
          onLater={dismissLinkNudge}
        />
      )}
      {toast && <div className="toast">{toast}</div>}

      {showIntro && (
        <div className="overlay" onClick={() => setShowIntro(false)}>
          <div className="modal intro">
            <div className="modal-emoji">🤖♻️</div>
            <h2>{t('Sobreviviste, Recolector')}</h2>
            <p className="modal-desc">
              {t(
                'Los Desechadores arrasaron la Tierra y se marcharon. Entre las ruinas, cada objeto es supervivencia — y tu facción cuenta contigo.',
              )}{' '}
              <br />
              <strong>{t('Camina de verdad')}</strong> {t('(con la ubicación activada) y ')}
              <strong>{t('toca los objetos')}</strong>
              {t(
                ' dentro de tu círculo para recuperarlos. El yermo se renueva cada 10 minutos. Y cuidado: ',
              )}
              <strong>{t('la Niebla Tóxica')}</strong>
              {t(' lo cubre todo — solo se despeja por donde tú caminas.')}
            </p>
            <button className="primary-btn" onClick={() => setShowIntro(false)}>
              {t('¡A chatarrear! 🚀')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
