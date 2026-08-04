import { FACTIONS } from '../game/items'
import { t } from '../game/i18n'

export default function DuelChallengeModal({ rival, onConfirm, onCancel }) {
  const f = FACTIONS[rival.faction]
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-emoji">⚔️</div>
        <h2>{t('¿Retar a {name}?', { name: rival.username || t('este recolector') })}</h2>
        <p className="modal-desc">
          {t('Es de los ')}
          <strong style={{ color: f?.color }}>
            {f?.emoji} {t(f?.name ?? '')}
          </strong>
          {t('. Un pulso de reflejos, nada más — nadie pierde lo que lleva encima.')}
        </p>
        <button className="primary-btn" onClick={onConfirm}>
          {t('¡Adelante! ⚔️')}
        </button>
        <button className="ghost-btn" onClick={onCancel}>
          {t('Mejor no')}
        </button>
      </div>
    </div>
  )
}
