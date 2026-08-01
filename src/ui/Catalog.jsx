import { useEffect, useState } from 'react'
import { CATALOG, RARITIES, RARITY_ORDER } from '../game/items'
import { LORE_FRAGMENTS } from '../game/lore'
import { fetchSetStatus, claimSet } from '../game/online'
import { t } from '../game/i18n'

const SET_REWARDS = { comun: 100, pocoComun: 150, raro: 300, epico: 600, reliquia: 1500, alien: 5000 }

function SetClaim({ rarity, status, onScrap, onToast, onClaimed }) {
  const [busy, setBusy] = useState(false)
  if (!status) return null
  const complete = status.collected >= status.total

  async function claim() {
    setBusy(true)
    try {
      const newScrap = await claimSet(rarity)
      onScrap(newScrap)
      onToast(t('🏅 ¡Set completado! +{n} ⚙️ y título nuevo', { n: SET_REWARDS[rarity] }))
      onClaimed()
    } catch (e) {
      onToast(t('No se pudo reclamar: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="set-claim">
      <span>{t('Verificado por el Gremio: {a}/{b}', { a: status.collected, b: status.total })}</span>
      {status.claimed ? (
        <span className="status-pill">{t('🏅 Reclamado')}</span>
      ) : complete ? (
        <button className="sell-btn" disabled={busy} onClick={claim}>
          {t('Set completo: +{n} ⚙️', { n: SET_REWARDS[rarity] })}
        </button>
      ) : null}
    </div>
  )
}

const OBTAINABLE_COUNT = CATALOG.filter((c) => !c.retired).length

export default function Catalog({ discovered, loreCount = 0, online = false, onScrap, onToast }) {
  const [sets, setSets] = useState({})

  function refreshSets() {
    if (!online) return
    fetchSetStatus()
      .then((rows) => setSets(Object.fromEntries(rows.map((r) => [r.rarity, r]))))
      .catch(() => {})
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refreshSets, [online])

  return (
    <div className="panel">
      <h2>{t('📖 Catálogo')}</h2>
      <p className="progress-line">
        {t('{d}/{t} objetos descubiertos', { d: discovered.size, t: OBTAINABLE_COUNT })}
      </p>
      {RARITY_ORDER.map((key) => {
        // los retirados (ver items.js) no vuelven a aparecer: no tiene
        // sentido mostrarlos como "por descubrir" para siempre
        const types = CATALOG.filter((c) => c.rarity === key && !c.retired)
        const r = RARITIES[key]
        return (
          <section key={key}>
            <h3 style={{ color: r.color }}>{t(r.name)}</h3>
            {online && (
              <SetClaim
                rarity={key}
                status={sets[key]}
                onScrap={onScrap}
                onToast={onToast}
                onClaimed={refreshSets}
              />
            )}
            <div className="grid">
              {types.map((type) => {
                const found = discovered.has(type.id)
                return (
                  <div
                    key={type.id}
                    className={`card ${found ? '' : 'unknown'}`}
                    style={{ '--rc': r.color }}
                  >
                    <span className="card-emoji">{found ? type.emoji : '❓'}</span>
                    <span className="card-name">{found ? t(type.name) : t('¿?')}</span>
                    {found && <span className="card-desc">{t(type.desc)}</span>}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      <section>
        <h3 style={{ color: '#f59e0b' }}>{t('📜 Diario del Desechador')}</h3>
        <p className="progress-line">
          {t('{a}/{b} fragmentos — cada Escondite que encuentres desbloquea el siguiente', {
            a: Math.min(loreCount, LORE_FRAGMENTS.length),
            b: LORE_FRAGMENTS.length,
          })}
        </p>
        <div className="lore-list">
          {LORE_FRAGMENTS.map((f, i) =>
            i < loreCount ? (
              <div key={i} className="lore-entry">
                <strong>{t(f.title)}</strong>
                <p>{t(f.text)}</p>
              </div>
            ) : (
              <div key={i} className="lore-entry locked">
                <strong>{t(f.title).split(' — ')[0]}</strong>
                <p>{t('Sigue la brújula para descifrarlo…')}</p>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  )
}
