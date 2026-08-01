import { useEffect, useState } from 'react'
import { fetchMissions, claimMission, enablePush } from '../game/online'
import { t } from '../game/i18n'

const MISSION_META = {
  chatarrero: { emoji: '🥫', name: 'Chatarrero del día', desc: 'Recoge 5 objetos', reward: 30 },
  ojo: { emoji: '🔎', name: 'Ojo clínico', desc: 'Recoge un objeto raro o mejor', reward: 50 },
  rastreador: { emoji: '🧭', name: 'Rastreador', desc: 'Encuentra el Escondite del día', reward: 100 },
}

export default function Missions({ pos, onScrap, onToast, onClose }) {
  const [missions, setMissions] = useState(null)
  const [busy, setBusy] = useState(false)
  const pushSupported = typeof Notification !== 'undefined' && 'serviceWorker' in navigator
  const [subscribed, setSubscribed] = useState(false)

  function refresh() {
    fetchMissions()
      .then(setMissions)
      .catch(() => setMissions([]))
  }

  useEffect(refresh, [])

  // permiso concedido ≠ suscrito: comprobar la suscripción real
  useEffect(() => {
    if (!pushSupported) return
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => {})
  }, [pushSupported])

  async function claim(missionId) {
    setBusy(true)
    try {
      const newScrap = await claimMission(missionId)
      onScrap(newScrap)
      onToast(t('💰 +{n} ⚙️ ¡Contrato cumplido!', { n: MISSION_META[missionId].reward }))
      refresh()
    } catch (e) {
      onToast(t('No se pudo cobrar: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  async function subscribe() {
    setBusy(true)
    try {
      await enablePush(pos)
      setSubscribed(true)
      onToast(t('🔔 Avisos activados: el Gremio te escribirá.'))
    } catch (e) {
      onToast(t('Avisos no activados: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal rank-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('📋 Contratos del Gremio')}</h2>
        <p className="modal-desc">{t('Se renuevan cada día a medianoche (UTC).')}</p>
        {missions === null ? (
          <p className="modal-desc">{t('Consultando el tablón…')}</p>
        ) : (
          <div className="mission-list">
            {missions.map((m) => {
              const meta = MISSION_META[m.mission_id]
              if (!meta) return null
              const complete = m.progress >= m.goal
              return (
                <div key={m.mission_id} className={`mission-row ${m.claimed ? 'done' : ''}`}>
                  <span className="mission-emoji">{meta.emoji}</span>
                  <span className="mission-body">
                    <strong>{t(meta.name)}</strong>
                    <span className="mission-desc">{t(meta.desc)}</span>
                    <span className="mission-bar">
                      <span
                        className="mission-fill"
                        style={{ width: `${(m.progress / m.goal) * 100}%` }}
                      />
                    </span>
                  </span>
                  {m.claimed ? (
                    <span className="status-pill">✅</span>
                  ) : complete ? (
                    <button
                      className="sell-btn"
                      disabled={busy}
                      onClick={() => claim(m.mission_id)}
                    >
                      +{meta.reward} ⚙️
                    </button>
                  ) : (
                    <span className="mission-progress">
                      {m.progress}/{m.goal}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {pushSupported && !subscribed && (
          <button className="sell-btn push-btn" disabled={busy} onClick={subscribe}>
            {t('🔔 Avisarme de eventos y escondites')}
          </button>
        )}
        {subscribed && (
          <p className="modal-desc small">{t('🔔 Avisos activados: el Gremio te escribirá.')}</p>
        )}

        <button className="primary-btn" onClick={onClose}>
          {t('Volver al mapa')}
        </button>
      </div>
    </div>
  )
}
