import { t } from '../game/i18n'

// Aviso suave y descartable para vincular el email — se dispara una vez al
// llegar a nivel 3 (después del Compañero, que aparece en nivel 2, para que
// no compitan por pantalla) si aún juegas como invitado. Nunca bloquea:
// solo aparece cuando ya tienes algo de verdad que no quieres perder.
export default function LinkNudgeModal({ level, onLink, onLater }) {
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-emoji">🔒</div>
        <h2>{t('Protege tu progreso')}</h2>
        <p className="modal-desc">
          {t(
            'Ya vas por el nivel {n}. Vincula tu email y tu personaje —inventario, nivel, facción— queda a salvo para siempre, en cualquier dispositivo.',
            { n: level },
          )}
        </p>
        <button className="primary-btn" onClick={onLink}>
          {t('Vincular mi email')}
        </button>
        <button className="ghost-btn" onClick={onLater}>
          {t('Ahora no')}
        </button>
      </div>
    </div>
  )
}
