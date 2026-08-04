import { t, locale } from '../game/i18n'
import { HATCH_M, LEVEL_M, MAX_LEVEL, petLevel, sniffRadius, petForm } from '../game/pet'

// Cuatro momentos del Compañero: hallazgo del Huevo, eclosión, evolución de
// etapa y ficha.
export default function PetModal({ mode, pet, evolvedFrom, onClose }) {
  const species = pet.species != null ? petForm(pet.species, pet.walkedM) : null
  const level = petLevel(pet.walkedM)
  const km = (m) => (m / 1000).toLocaleString(locale(), { maximumFractionDigits: 1 })

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal fancy pet-modal" onClick={(e) => e.stopPropagation()}>
        {mode === 'egg-found' && (
          <>
            <div className="modal-emoji egg-wobble">🥚</div>
            <h2>{t('¡Un Huevo de incubadora!')}</h2>
            <p className="modal-desc">
              {t(
                'Entre los escombros, algo late. Es el Huevo que perdieron los Desechadores… el del Fragmento X del Diario.',
              )}
            </p>
            <p className="modal-desc">
              {t('Camina {km} km con él encima y eclosionará. Le gusta el traqueteo.', {
                km: km(HATCH_M),
              })}
            </p>
            <button className="primary-btn" onClick={onClose}>
              {t('Guardarlo con cuidado 🎒')}
            </button>
          </>
        )}

        {mode === 'hatched' && species && (
          <>
            <div className="modal-emoji pet-bounce">{species.emoji}</div>
            <h2>{t('¡Ha nacido {name}!', { name: species.name })}</h2>
            <p className="modal-desc">
              {t(
                'Te seguirá a todas partes y olfateará tesoros raros cerca. Cuanto más caminéis juntos, más fino será su olfato.',
              )}
            </p>
            <button className="primary-btn" onClick={onClose}>
              {t('A explorar juntos 🐾')}
            </button>
          </>
        )}

        {mode === 'evolved' && species && (
          <>
            <div className="modal-emoji pet-bounce">{species.emoji}</div>
            <h2>{t('¡{from} evolucionó a {to}!', { from: evolvedFrom?.name ?? '', to: species.name })}</h2>
            <p className="modal-desc">
              {t('Todo lo caminado ha dejado huella. {name} ya no es lo que era.', {
                name: species.name,
              })}
            </p>
            <button className="primary-btn" onClick={onClose}>
              {t('¡Impresionante! 🐾')}
            </button>
          </>
        )}

        {mode === 'info' && (
          <>
            <div className="modal-emoji">{pet.stage === 'egg' ? '🥚' : species?.emoji}</div>
            <h2>{pet.stage === 'egg' ? t('Huevo de incubadora') : species?.name}</h2>
            {pet.stage === 'egg' ? (
              <>
                <p className="modal-desc">
                  {t('Le faltan {km} km de traqueteo para eclosionar.', {
                    km: km(Math.max(0, HATCH_M - pet.walkedM)),
                  })}
                </p>
                <div className="xp-bar pet-bar">
                  <div
                    className="xp-fill"
                    style={{ width: `${Math.min(100, (pet.walkedM / HATCH_M) * 100)}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="modal-desc">
                  {t('Nivel {n}', { n: level })} ·{' '}
                  {t('habéis caminado {km} km juntos', { km: km(pet.walkedM) })}
                </p>
                <p className="modal-desc">
                  {t('Olfato: detecta tesoros raros a {m} m.', { m: sniffRadius(level) })}
                </p>
                {level < MAX_LEVEL && (
                  <div className="xp-bar pet-bar">
                    <div
                      className="xp-fill"
                      style={{
                        width: `${(((pet.walkedM - HATCH_M) % LEVEL_M) / LEVEL_M) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </>
            )}
            <button className="primary-btn" onClick={onClose}>
              {t('Volver al mapa')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
