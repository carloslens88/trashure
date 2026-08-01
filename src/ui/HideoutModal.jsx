import { RARITIES } from '../game/items'
import { t } from '../game/i18n'

// Dos fases: misterio ("¿lo abres?") → recompensa + fragmento del Diario.
export default function HideoutModal({ state, onOpen, onClose }) {
  const { hideout, opened, fragment, xpGained } = state
  const r = RARITIES[hideout.type.rarity]

  return (
    <div className="overlay" onClick={opened ? onClose : undefined}>
      <div className="modal hideout-modal" onClick={(e) => e.stopPropagation()}>
        {!opened ? (
          <>
            <div className="modal-emoji">🌀</div>
            <h2>{t('Un Escondite de los Desechadores')}</h2>
            <p className="modal-desc">
              {t('La brújula no mentía: aquí hay algo enterrado hace mucho, esperándote.')}
            </p>
            <button className="primary-btn" onClick={onOpen}>
              {t('Abrirlo 🗝️')}
            </button>
            <button className="ghost-btn" onClick={onClose}>
              {t('Todavía no')}
            </button>
          </>
        ) : (
          <>
            <div className="modal-emoji">{hideout.type.emoji}</div>
            <h2>{t(hideout.type.name)}</h2>
            <span className="rarity-tag big" style={{ '--rc': r.color, background: r.color }}>
              {t(r.name)}
            </span>
            <p className="modal-xp">+{xpGained} XP</p>
            {fragment && (
              <div className="lore-card">
                <strong>📜 {t(fragment.title)}</strong>
                <p>{t(fragment.text)}</p>
              </div>
            )}
            <button className="primary-btn" onClick={onClose}>
              {t('Guardar el secreto 🎒')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
