import { useCallback, useEffect, useState } from 'react'
import { BY_ID, RARITIES } from '../game/items'
import {
  isOnline,
  getUserId,
  fetchInventory,
  fetchItemsByIds,
  fetchProfiles,
  fetchTrades,
  proposeTrade,
  acceptTrade,
  rejectTrade,
} from '../game/online'
import { t } from '../game/i18n'

const STATUS_LABEL = {
  pending: '⏳ Pendiente',
  accepted: '✅ Aceptado',
  rejected: '❌ Rechazado',
  cancelled: '🚫 Cancelado',
}

function ItemChip({ row, selected, onToggle }) {
  const type = BY_ID[row.type_id]
  if (!type) return <span className="item-chip">❓</span>
  const r = RARITIES[type.rarity]
  return (
    <button
      className={`item-chip ${selected ? 'selected' : ''}`}
      style={{ '--rc': r.color }}
      onClick={onToggle}
      title={t(type.name)}
    >
      {type.emoji}
    </button>
  )
}

function TradeItems({ ids, details }) {
  if (ids.length === 0) return <span className="trade-nothing">{t('nada')}</span>
  return (
    <span className="trade-items">
      {ids.map((id) => {
        const type = details[id] && BY_ID[details[id].type_id]
        return <span key={id}>{type ? type.emoji : '❓'}</span>
      })}
    </span>
  )
}

// Sub-pantalla para armar una propuesta con un recolector concreto
function ProposePanel({ peer, name, myInv, onClose, onDone, onToast }) {
  const [theirInv, setTheirInv] = useState(null)
  const [give, setGive] = useState(new Set())
  const [take, setTake] = useState(new Set())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchInventory(peer.id)
      .then(setTheirInv)
      .catch(() => setTheirInv([]))
  }, [peer.id])

  function toggle(set, setter, id) {
    const next = new Set(set)
    next.has(id) ? next.delete(id) : next.add(id)
    setter(next)
  }

  async function submit() {
    setBusy(true)
    try {
      await proposeTrade(peer.id, [...give], [...take])
      onToast(t('📨 ¡Propuesta enviada!'))
      onDone()
    } catch (e) {
      onToast(t('No se pudo proponer: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal trade-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('🤝 Trueque con {name}', { name })}</h2>

        <h4>{t('Tú das ({n})', { n: give.size })}</h4>
        {myInv.length === 0 ? (
          <p className="modal-desc">
            {t('No tienes objetos verificados aún. Recoge algo estando conectado.')}
          </p>
        ) : (
          <div className="chip-grid">
            {myInv.map((row) => (
              <ItemChip
                key={row.id}
                row={row}
                selected={give.has(row.id)}
                onToggle={() => toggle(give, setGive, row.id)}
              />
            ))}
          </div>
        )}

        <h4>{t('Recibes ({n})', { n: take.size })}</h4>
        {theirInv === null ? (
          <p className="modal-desc">{t('Consultando su alijo…')}</p>
        ) : theirInv.length === 0 ? (
          <p className="modal-desc">
            {t(
              'No se ven sus objetos. O no tiene nada verificado, o falta aplicar supabase/schema-v2.sql en tu proyecto.',
            )}
          </p>
        ) : (
          <div className="chip-grid">
            {theirInv.map((row) => (
              <ItemChip
                key={row.id}
                row={row}
                selected={take.has(row.id)}
                onToggle={() => toggle(take, setTake, row.id)}
              />
            ))}
          </div>
        )}

        <button
          className="primary-btn"
          disabled={busy || (give.size === 0 && take.size === 0)}
          onClick={submit}
        >
          {t('Proponer trueque 📨')}
        </button>
        <button className="ghost-btn" onClick={onClose}>
          {t('Volver')}
        </button>
      </div>
    </div>
  )
}

export default function Trades({ peers, onToast }) {
  const [myInv, setMyInv] = useState([])
  const [trades, setTrades] = useState([])
  const [details, setDetails] = useState({})
  const [names, setNames] = useState({})
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const me = getUserId()

  const refresh = useCallback(async () => {
    if (!isOnline || !me) return
    try {
      const [inv, tradeRows] = await Promise.all([fetchInventory(), fetchTrades()])
      setMyInv(inv)
      setTrades(tradeRows)
      const itemIds = new Set()
      const userIds = new Set(peers.map((p) => p.id))
      for (const t of tradeRows) {
        t.proposer_items.forEach((id) => itemIds.add(id))
        t.receiver_items.forEach((id) => itemIds.add(id))
        userIds.add(t.proposer)
        userIds.add(t.receiver)
      }
      const [rows, profiles] = await Promise.all([
        fetchItemsByIds([...itemIds]),
        fetchProfiles([...userIds]),
      ])
      setDetails(Object.fromEntries(rows.map((r) => [r.id, r])))
      setNames(Object.fromEntries(profiles.map((p) => [p.id, p.username])))
    } catch (e) {
      console.warn('[trueques]', e.message)
    }
  }, [me, peers])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 10000)
    return () => clearInterval(t)
  }, [refresh])

  async function resolve(action, tradeId, okMsg) {
    setBusy(true)
    try {
      await action(tradeId)
      onToast(okMsg)
      await refresh()
    } catch (e) {
      onToast(t('No se pudo: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  const displayName = (id) => names[id] ?? t('Recolector #{id}', { id: id?.slice(0, 4) })

  // Renderizado como sección dentro de la pestaña Mercado
  return (
    <>
      <h3 className="section-title">{t('📡 Recolectores en tu zona')}</h3>
      {peers.length === 0 ? (
        <p className="empty small">
          {t(
            'Nadie cerca ahora mismo. Cuando otro recolector entre en tu zona (~1 km) aparecerá aquí.',
          )}
        </p>
      ) : (
        <div className="peer-list">
          {peers.map((peer) => (
            <div key={peer.id} className="trade-row">
              <span className="peer-name">🤖 {displayName(peer.id)}</span>
              <button className="sell-btn" onClick={() => setTarget(peer)}>
                {t('Proponer 🤝')}
              </button>
            </div>
          ))}
        </div>
      )}

      <h3 className="section-title">{t('📬 Tus trueques')}</h3>
      {trades.length === 0 ? (
        <p className="empty small">{t('Todavía no hay trueques. ¡Propón el primero!')}</p>
      ) : (
        <div className="peer-list">
          {trades.map((trade) => {
            const incoming = trade.receiver === me
            const other = incoming ? trade.proposer : trade.receiver
            return (
              <div key={trade.id} className="trade-row trade-col">
                <div className="trade-head">
                  <span className="peer-name">
                    {incoming ? t('📥 de') : t('📤 para')} {displayName(other)}
                  </span>
                  <span className="status-pill">{t(STATUS_LABEL[trade.status])}</span>
                </div>
                <div className="trade-body">
                  <span>
                    {incoming ? t('Te da') : t('Das')}:{' '}
                    <TradeItems ids={trade.proposer_items} details={details} />
                  </span>
                  <span>
                    {incoming ? t('Pide') : t('Pides')}:{' '}
                    <TradeItems ids={trade.receiver_items} details={details} />
                  </span>
                </div>
                {trade.status === 'pending' && (
                  <div className="trade-actions">
                    {incoming ? (
                      <>
                        <button
                          className="primary-btn small"
                          disabled={busy}
                          onClick={() => resolve(acceptTrade, trade.id, t('✅ ¡Trueque aceptado!'))}
                        >
                          {t('Aceptar')}
                        </button>
                        <button
                          className="ghost-btn"
                          disabled={busy}
                          onClick={() => resolve(rejectTrade, trade.id, t('Trueque rechazado'))}
                        >
                          {t('Rechazar')}
                        </button>
                      </>
                    ) : (
                      <button
                        className="ghost-btn"
                        disabled={busy}
                        onClick={() => resolve(rejectTrade, trade.id, t('Propuesta cancelada'))}
                      >
                        {t('Cancelar propuesta')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="hint">
        {t('Solo se intercambian objetos verificados por el Gremio (recogidos en modo online).')}
      </p>

      {target && (
        <ProposePanel
          peer={target}
          name={displayName(target.id)}
          myInv={myInv}
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null)
            refresh()
          }}
          onToast={onToast}
        />
      )}
    </>
  )
}
