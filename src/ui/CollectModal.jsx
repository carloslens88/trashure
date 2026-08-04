import { RARITIES } from '../game/items'
import { t } from '../game/i18n'

const CONFETTI = ['✨', '⭐', '💫', '🎉', '✨', '⭐', '💫', '🎉', '✨', '⭐']

export default function CollectModal({ item, onConfirm, onDismiss, onShare }) {
  const r = RARITIES[item.type.rarity]
  const fancy = item.type.rarity !== 'comun' && item.type.rarity !== 'pocoComun'
  return (
    <div className="overlay" onClick={onDismiss}>
      <div
        className={`modal ${fancy ? 'fancy' : ''}`}
        style={{ '--rc': r.color }}
        onClick={(e) => e.stopPropagation()}
      >
        {fancy &&
          CONFETTI.map((c, i) => (
            <span
              key={i}
              className="confetti"
              style={{
                left: `${8 + i * 9}%`,
                animationDelay: `${(i * 0.17) % 1.6}s`,
                animationDuration: `${1.3 + (i % 3) * 0.3}s`,
              }}
            >
              {c}
            </span>
          ))}
        <div className="modal-emoji">{item.type.emoji}</div>
        <h2>{t(item.type.name)}</h2>
        <span className="rarity-tag big">{t(r.name)}</span>
        <p className="modal-desc">{t(item.type.desc)}</p>
        <p className="modal-xp">+{r.xp} XP</p>
        <button className="primary-btn" onClick={onConfirm}>
          {t('¡A la mochila! 🎒')}
        </button>
        {fancy && (
          <button className="ghost-btn" onClick={onShare}>
            {t('📤 Compartir hallazgo')}
          </button>
        )}
        <button className="ghost-btn" onClick={onDismiss}>
          {t('Dejarlo en el suelo')}
        </button>
      </div>
    </div>
  )
}
