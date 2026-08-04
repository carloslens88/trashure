import { useState } from 'react'
import { RARITIES, BY_ID } from '../game/items'
import { t } from '../game/i18n'

// El Cofre del Gremio: forzarlo cuesta una Llave misteriosa y no siempre
// abre — "no todas las llaves abren algo". Si abre, el botín es de los que
// no salen en ningún otro sitio (reliquia/alienígena).
export default function ChestModal({ keyCount, result, onOpen, onClose }) {
  const [busy, setBusy] = useState(false)

  async function attempt() {
    setBusy(true)
    try {
      await onOpen()
    } finally {
      setBusy(false)
    }
  }

  const rewardType = result?.typeId ? BY_ID[result.typeId] : null
  const r = rewardType ? RARITIES[rewardType.rarity] : null

  return (
    <div className="overlay" onClick={result ? onClose : undefined}>
      <div className="modal hideout-modal" onClick={(e) => e.stopPropagation()}>
        {!result ? (
          <>
            <div className="modal-emoji">🔒</div>
            <h2>{t('Cofre del Gremio')}</h2>
            <p className="modal-desc">
              {t(
                'Sellado hace quién sabe cuánto. Una Llave misteriosa podría forzarlo — aunque no todas abren algo.',
              )}
            </p>
            {keyCount > 0 ? (
              <>
                <p className="modal-desc small">
                  {t('Tienes {n} llave(s). Forzarlo consume una, abra o no.', { n: keyCount })}
                </p>
                <button className="primary-btn" disabled={busy} onClick={attempt}>
                  {t('Forzar la cerradura 🗝️')}
                </button>
              </>
            ) : (
              <p className="modal-desc small">
                {t('Necesitas una Llave misteriosa (objeto raro) para intentarlo.')}
              </p>
            )}
            <button className="ghost-btn" onClick={onClose}>
              {t('Todavía no')}
            </button>
          </>
        ) : result.opened ? (
          <>
            <div className="modal-emoji">{rewardType.emoji}</div>
            <h2>{t(rewardType.name)}</h2>
            <span className="rarity-tag big" style={{ '--rc': r.color, background: r.color }}>
              {t(r.name)}
            </span>
            <p className="modal-xp">+{result.xpGained} XP</p>
            <p className="modal-desc small">{t('La llave encajó. El Gremio se pregunta qué más habrá cerrado.')}</p>
            <button className="primary-btn" onClick={onClose}>
              {t('Guardarlo con cuidado 🎒')}
            </button>
          </>
        ) : (
          <>
            <div className="modal-emoji">🗝️</div>
            <h2>{t('La llave no encajaba…')}</h2>
            <p className="modal-desc">
              {t('Se rompió en el intento. El cofre sigue ahí, cerrado, para el siguiente que lo intente.')}
            </p>
            <button className="primary-btn" onClick={onClose}>
              {t('Volver al mapa')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
