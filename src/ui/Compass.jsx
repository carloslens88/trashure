import { bearingDeg, distanceM, HIDEOUT_REVEAL_M } from '../game/spawn'
import { t } from '../game/i18n'

// La brújula de los Desechadores: señala el escondite del día más cercano.
export default function Compass({ pos, hideout }) {
  const dist = distanceM(pos, hideout)
  const deg = bearingDeg(pos, hideout)
  const close = dist <= HIDEOUT_REVEAL_M
  const label = dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`
  return (
    <div className={`compass ${close ? 'close' : ''}`} title={t('Escondite de los Desechadores')}>
      <div className="compass-dial">
        <div className="compass-arrow" style={{ transform: `rotate(${deg}deg)` }}>
          ➤
        </div>
      </div>
      <div className="compass-info">
        <span className="compass-title">{t('🗝️ Escondite')}</span>
        <span className="compass-dist">{close ? t('¡Muy cerca!') : label}</span>
      </div>
    </div>
  )
}
