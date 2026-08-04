import { useEffect, useRef, useState } from 'react'
import { RARITIES } from '../game/items'
import { playCoin, playError, playVigilance } from '../game/sound'
import { t } from '../game/i18n'

const TAPS_TO_WIN = 8
const RISE_PER_TICK = 1.05 // % de altitud cada 60 ms (~5,7 s hasta la nave a dificultad plena)
const YANK = 9 // % que baja el objeto con cada toque, a dificultad plena

// Cuanta menos experiencia, más margen: el Vigía sube más despacio y cada
// toque empuja más fuerte. A partir de nivel 6 es la dificultad de siempre.
function riseFactor(level) {
  if (level <= 2) return 0.55
  if (level <= 5) return 0.78
  return 1
}
function yankFactor(level) {
  if (level <= 2) return 1.25
  if (level <= 5) return 1.1
  return 1
}

// El Vigía intenta abducir tu hallazgo: tócalo repetidamente para arrancárselo
// al haz antes de que llegue a la nave. Solo pasa durante la Vigilancia.
export default function AbductionGame({ item, level = 99, onWin, onLose }) {
  const [altitude, setAltitude] = useState(8)
  const [taps, setTaps] = useState(0)
  const done = useRef(false)
  const rise = RISE_PER_TICK * riseFactor(level)
  const yank = YANK * yankFactor(level)

  useEffect(() => {
    playVigilance()
    const iv = setInterval(() => {
      setAltitude((a) => {
        const next = a + rise
        if (next >= 100 && !done.current) {
          done.current = true
          playError()
          setTimeout(onLose, 400)
        }
        return Math.min(next, 100)
      })
    }, 60)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tap() {
    if (done.current) return
    playCoin()
    setAltitude((a) => Math.max(4, a - yank))
    setTaps((n) => {
      const next = n + 1
      if (next >= TAPS_TO_WIN) {
        done.current = true
        setTimeout(onWin, 250)
      }
      return next
    })
  }

  const r = RARITIES[item.type.rarity]

  return (
    <div className="overlay abduction">
      <div className="abduction-scene">
        <div className="abduction-ufo">🛸</div>
        <div className="abduction-beam" />
        <button
          className="abduction-item"
          style={{ bottom: `${altitude}%`, '--rc': r.color }}
          onPointerDown={tap}
        >
          {item.type.emoji}
        </button>
        <div className="abduction-hud">
          <strong>{t('👾 ¡El Vigía intenta abducir tu hallazgo!')}</strong>
          <span>{t('¡Tócalo {n} veces para rescatarlo!', { n: TAPS_TO_WIN - taps })}</span>
          <div className="abduction-progress">
            {Array.from({ length: TAPS_TO_WIN }).map((_, i) => (
              <span key={i} className={i < taps ? 'on' : ''} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
