import { useState } from 'react'
import { FACTIONS } from '../game/items'
import { t } from '../game/i18n'

export default function FactionModal({ onPick, onLater, recommended }) {
  const [busy, setBusy] = useState(false)

  async function pick(key) {
    setBusy(true)
    try {
      await onPick(key)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay">
      <div className="modal faction-modal">
        <h2>{t('Elige tu facción')}</h2>
        <p className="modal-desc">
          {t('El Gremio exige lealtades. La decisión es ')}
          <strong>{t('para siempre')}</strong>.
        </p>
        {Object.entries(FACTIONS).map(([key, f]) => (
          <button
            key={key}
            className={`faction-card${key === recommended ? ' recommended' : ''}`}
            style={{ '--fc': f.color }}
            disabled={busy}
            onClick={() => pick(key)}
          >
            {key === recommended && <span className="faction-reco">{t('★ Recomendada para ti')}</span>}
            <span className="faction-emoji">{f.emoji}</span>
            <span className="faction-body">
              <strong>{t(f.name)}</strong>
              <em>«{t(f.motto)}»</em>
              <span className="faction-perk">{t(f.perk)}</span>
            </span>
          </button>
        ))}
        <button className="ghost-btn" onClick={onLater}>
          {t('Decidir más tarde')}
        </button>
      </div>
    </div>
  )
}
