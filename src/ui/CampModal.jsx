import { useState } from 'react'
import { distanceM } from '../game/spawn'
import { setCamp, claimCamp } from '../game/online'
import { playCoin } from '../game/sound'
import { t } from '../game/i18n'

const CLAIM_RADIUS_M = 100
const MOVE_COOLDOWN_MS = 7 * 24 * 3600_000

// Tu rincón del yermo: plántalo donde quieras y vuelve cada día a por
// suministros. Mudarlo tiene una semana de enfriamiento.
export default function CampModal({ pos, camp, onCamp, onScrap, onToast, onClose }) {
  const [busy, setBusy] = useState(false)
  const today = new Date().toISOString().slice(0, 10)
  const dist = camp ? distanceM(pos, camp) : 0
  const near = camp && dist <= CLAIM_RADIUS_M
  const claimedToday = camp?.claimDay === today
  const canMove = !camp?.movedAt || Date.now() - new Date(camp.movedAt).getTime() > MOVE_COOLDOWN_MS

  async function plant() {
    setBusy(true)
    try {
      await setCamp(pos)
      onCamp({ lat: pos.lat, lng: pos.lng, movedAt: new Date().toISOString(), claimDay: camp?.claimDay ?? null })
      onToast(t('⛺ ¡Campamento plantado! Vuelve cada día a por suministros'))
    } catch (e) {
      onToast(t('No se pudo: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  async function claim() {
    setBusy(true)
    try {
      const newScrap = await claimCamp(pos)
      playCoin()
      onScrap(newScrap)
      onCamp({ ...camp, claimDay: today })
      onToast(t('📦 Suministros del campamento: +30 ⚙️'))
    } catch (e) {
      onToast(t('No se pudo: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal camp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-emoji">⛺</div>
        <h2>{t('Tu campamento')}</h2>

        {!camp ? (
          <>
            <p className="modal-desc">
              {t(
                'Todo superviviente necesita un rincón en el yermo. Plántalo aquí y el Gremio te dejará suministros cada día (+30 ⚙️). Solo puede mudarse una vez por semana.',
              )}
            </p>
            <button className="primary-btn" disabled={busy} onClick={plant}>
              {t('⛺ Plantar campamento aquí')}
            </button>
          </>
        ) : (
          <>
            <p className="modal-desc">
              {near
                ? t('Estás en casa. 🏠')
                : t('Tu campamento está a {d} de aquí.', {
                    d: dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`,
                  })}
            </p>
            {claimedToday ? (
              <span className="status-pill">{t('📦 Suministros recogidos hoy')}</span>
            ) : near ? (
              <button className="primary-btn" disabled={busy} onClick={claim}>
                {t('Recoger suministros +30 ⚙️')}
              </button>
            ) : (
              <p className="modal-desc small">
                {t('Acércate a menos de {m} m para recoger los suministros diarios.', {
                  m: CLAIM_RADIUS_M,
                })}
              </p>
            )}
            <button className="ghost-btn" disabled={busy || !canMove} onClick={plant}>
              {canMove
                ? t('Mudar el campamento aquí')
                : t('Mudanza disponible en {d} días', {
                    d: Math.ceil(
                      (MOVE_COOLDOWN_MS - (Date.now() - new Date(camp.movedAt).getTime())) /
                        86400000,
                    ),
                  })}
            </button>
          </>
        )}
        <button className="ghost-btn" onClick={onClose}>
          {t('Volver al mapa')}
        </button>
      </div>
    </div>
  )
}
