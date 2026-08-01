import { useState } from 'react'
import { claimBoss } from '../game/online'
import { t } from '../game/i18n'

// El Reclamador: máquina alienígena que domina la región (~2 km). Cada
// recogida de CUALQUIER jugador en la región le hace daño (= XP obtenido).
// Al derrotarlo, todos los que participaron cobran botín.
export default function BossModal({ pos, status, onScrap, onToast, onClaimed, onClose }) {
  const [busy, setBusy] = useState(false)
  const hpLeft = Math.max(0, status.hp_goal - Number(status.hp_done))
  const pct = Math.min(100, (Number(status.hp_done) / status.hp_goal) * 100)
  const dead = hpLeft === 0

  async function claim() {
    setBusy(true)
    try {
      const newScrap = await claimBoss(pos)
      onScrap(newScrap)
      onToast(t('💥 ¡Botín del Reclamador! +300 ⚙️'))
      onClaimed()
    } catch (e) {
      onToast(t('No se pudo reclamar: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal boss-modal" onClick={(e) => e.stopPropagation()}>
        <div className={`modal-emoji boss-face ${dead ? 'dead' : ''}`}>👾</div>
        <h2>{t('El Reclamador de la Zona')}</h2>
        <p className="modal-desc">
          {dead
            ? t('¡Derrotado! La región respira… hasta el lunes, que se reconstruye.')
            : t(
                'Domina esta región (~2 km). Cada recogida de cualquier recolector aquí le hace daño. Se reconstruye cada lunes.',
              )}
        </p>
        <div className="boss-hp">
          <div className="boss-hp-fill" style={{ width: `${100 - pct}%` }} />
        </div>
        <p className="boss-stats">
          {t('❤️ {hp} PV restantes', { hp: hpLeft.toLocaleString() })} ·{' '}
          {t('⚔️ tu daño: {d}', { d: Number(status.my_damage).toLocaleString() })} ·{' '}
          {t('👥 {n} recolectores', { n: status.participants })}
        </p>
        {dead && !status.claimed && Number(status.my_damage) > 0 && (
          <button className="primary-btn" disabled={busy} onClick={claim}>
            {t('Reclamar botín +300 ⚙️')}
          </button>
        )}
        {status.claimed && <span className="status-pill">{t('🏅 Botín reclamado')}</span>}
        {dead && Number(status.my_damage) === 0 && (
          <p className="modal-desc small">{t('No participaste en esta batalla.')}</p>
        )}
        <button className="ghost-btn" onClick={onClose}>
          {t('Volver al mapa')}
        </button>
      </div>
    </div>
  )
}
