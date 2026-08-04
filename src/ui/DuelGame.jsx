import { useEffect, useRef, useState } from 'react'
import { FACTIONS } from '../game/items'
import { playCoin, playError, playLevelUp } from '../game/sound'
import { t } from '../game/i18n'

const TAPS_TO_WIN = 10
const PRESSURE_PER_TICK = 0.85 // el rival empuja solo, sin depender de que juegue de verdad
const PUSH = 7 // cuánto retrocede la presión con cada toque

// Duelo contra un rival de otra facción: pulso de toques resuelto al
// instante, sin esperar a que el otro jugador esté conectado a la vez (así
// funciona con presencia asíncrona). Sin apuestas sobre la cuenta ajena:
// solo tu lado tiene consecuencias, igual que la Abducción.
export default function DuelGame({ rival, onWin, onLose }) {
  const [pressure, setPressure] = useState(50) // 0 = ganas tú, 100 = ganas el rival
  const [taps, setTaps] = useState(0)
  const done = useRef(false)
  const f = FACTIONS[rival.faction]

  useEffect(() => {
    const iv = setInterval(() => {
      setPressure((p) => {
        const next = p + PRESSURE_PER_TICK
        if (next >= 100 && !done.current) {
          done.current = true
          playError()
          setTimeout(onLose, 400)
        }
        return Math.min(next, 100)
      })
    }, 70)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function tap() {
    if (done.current) return
    playCoin()
    setPressure((p) => Math.max(0, p - PUSH))
    setTaps((n) => {
      const next = n + 1
      if (next >= TAPS_TO_WIN) {
        done.current = true
        playLevelUp()
        setTimeout(onWin, 250)
      }
      return next
    })
  }

  return (
    <div className="overlay duel">
      <div className="duel-scene" style={{ '--fc': f?.color ?? '#94a3b8' }}>
        <div className="duel-rivals">
          <span className="duel-you">🤖</span>
          <span className="duel-vs">VS</span>
          <span className="duel-rival">{f?.emoji ?? '🤖'}</span>
        </div>
        <strong className="duel-title">
          {t('⚔️ Duelo contra {name}', { name: rival.username || t('un rival') })}
        </strong>
        <div className="duel-bar">
          <div className="duel-bar-fill" style={{ width: `${100 - pressure}%` }} />
          <div className="duel-bar-marker" style={{ left: `${100 - pressure}%` }}>
            🤖
          </div>
        </div>
        <button className="duel-tap-btn" onPointerDown={tap}>
          {t('¡TOCA! 👊')}
        </button>
        <span className="duel-hint">{t('{n} toques más para ganar', { n: TAPS_TO_WIN - taps })}</span>
      </div>
    </div>
  )
}
