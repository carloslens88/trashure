import { useState } from 'react'
import { FACTIONS } from '../game/items'
import { t } from '../game/i18n'

// Reclutamiento ambiental para "divergentes" (sin facción): al cruzarte con
// alguien de una facción activa, te proponen unirte. Reutiliza join_faction
// (misma elección permanente que en FactionModal) desde un gancho narrativo
// distinto.
export default function RecruitModal({ factionKey, recruiterName, onAccept, onDecline }) {
  const [busy, setBusy] = useState(false)
  const f = FACTIONS[factionKey]

  async function accept() {
    setBusy(true)
    try {
      await onAccept()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay">
      <div className="modal faction-modal">
        <div className="modal-emoji">{f.emoji}</div>
        <h2>{t('Te han echado el ojo')}</h2>
        <p className="modal-desc">
          {t('{name}, de los {faction}, te ha visto merodear por su territorio.', {
            name: recruiterName,
            faction: t(f.name),
          })}
        </p>
        <div className="faction-card" style={{ '--fc': f.color }}>
          <span className="faction-emoji">{f.emoji}</span>
          <span className="faction-body">
            <strong>{t(f.name)}</strong>
            <em>«{t(f.motto)}»</em>
            <span className="faction-perk">{t(f.perk)}</span>
          </span>
        </div>
        <p className="modal-desc small">
          {t('Recuerda: unirte a una facción es ')}
          <strong>{t('para siempre')}</strong>.
        </p>
        <button className="primary-btn" disabled={busy} onClick={accept}>
          {t('Unirme a los {faction}', { faction: t(f.name) })}
        </button>
        <button className="ghost-btn" disabled={busy} onClick={onDecline}>
          {t('Seguir por libre')}
        </button>
      </div>
    </div>
  )
}
