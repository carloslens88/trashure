import { useCallback, useEffect, useState } from 'react'
import { BY_ID, RARITIES, FACTIONS } from '../game/items'
import {
  isOnline,
  getUserId,
  fetchMarket,
  fetchInventory,
  listItem,
  cancelListing,
  buyItem,
} from '../game/online'
import Trades from './Trades'
import { t } from '../game/i18n'

function BuySection({ scrap, onBought, onToast }) {
  const [listings, setListings] = useState(null)
  const [busy, setBusy] = useState(false)
  const me = getUserId()

  const refresh = useCallback(() => {
    fetchMarket()
      .then(setListings)
      .catch((e) => console.warn('[mercado]', e.message))
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 12000)
    return () => clearInterval(t)
  }, [refresh])

  async function buy(listing) {
    setBusy(true)
    try {
      const newScrap = await buyItem(listing.id)
      onBought(newScrap)
      onToast(t('🛒 ¡Comprado! Ya está en tu mochila'))
      refresh()
    } catch (e) {
      onToast(t('No se pudo comprar: {e}', { e: t(e.message) }))
      refresh()
    } finally {
      setBusy(false)
    }
  }

  if (listings === null) return <p className="empty small">{t('Consultando el mercado…')}</p>
  if (listings.length === 0)
    return <p className="empty small">{t('El mercado está vacío. ¡Sé quien estrene el tablón!')}</p>

  return (
    <div className="peer-list">
      {listings.map((l) => {
        const type = BY_ID[l.item.type_id]
        if (!type) return null
        const r = RARITIES[type.rarity]
        const mine = l.seller === me
        const sellerFaction = l.sellerProfile?.faction
        return (
          <div key={l.id} className="trade-row">
            <span className="market-item">
              <span className="market-emoji" style={{ '--rc': r.color }}>
                {type.emoji}
              </span>
              <span className="market-name">
                {t(type.name)}
                <em>
                  {sellerFaction ? `${FACTIONS[sellerFaction].emoji} ` : ''}
                  {l.sellerProfile?.username ?? t('Recolector')}
                </em>
              </span>
            </span>
            {mine ? (
              <span className="status-pill">{t('tuyo')}</span>
            ) : (
              <button
                className="sell-btn"
                disabled={busy || scrap < l.price}
                onClick={() => buy(l)}
              >
                {l.price} ⚙️
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SellSection({ onToast }) {
  const [inv, setInv] = useState(null)
  const [listings, setListings] = useState([])
  const [prices, setPrices] = useState({})
  const [busy, setBusy] = useState(false)
  const me = getUserId()

  const refresh = useCallback(async () => {
    try {
      const [rows, market] = await Promise.all([fetchInventory(), fetchMarket()])
      setInv(rows)
      setListings(market.filter((l) => l.seller === me))
    } catch (e) {
      console.warn('[mercado]', e.message)
    }
  }, [me])

  useEffect(() => {
    refresh()
  }, [refresh])

  const listedIds = new Set(listings.map((l) => l.item.id))

  async function publish(row) {
    const type = BY_ID[row.type_id]
    const price = Number(prices[row.id] ?? suggested(type))
    if (!Number.isInteger(price) || price < 1) {
      onToast(t('Pon un precio válido (mínimo 1 ⚙️)'))
      return
    }
    setBusy(true)
    try {
      await listItem(row.id, price)
      onToast(t('🏷️ ¡Publicado en el mercado!'))
      await refresh()
    } catch (e) {
      onToast(t('No se pudo publicar: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  async function cancel(listing) {
    setBusy(true)
    try {
      await cancelListing(listing.id)
      await refresh()
    } catch (e) {
      onToast(t('No se pudo retirar: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  function suggested(type) {
    return RARITIES[type.rarity].value * 3
  }

  if (inv === null) return <p className="empty small">{t('Abriendo tu alijo…')}</p>

  const sellable = inv.filter((row) => !listedIds.has(row.id))

  return (
    <>
      {listings.length > 0 && (
        <>
          <h3 className="section-title">{t('🏷️ Tus anuncios')}</h3>
          <div className="peer-list">
            {listings.map((l) => {
              const type = BY_ID[l.item.type_id]
              return (
                <div key={l.id} className="trade-row">
                  <span className="market-item">
                    <span className="market-emoji" style={{ '--rc': RARITIES[type.rarity].color }}>
                      {type.emoji}
                    </span>
                    <span className="market-name">
                      {t(type.name)}
                      <em>{l.price} ⚙️</em>
                    </span>
                  </span>
                  <button className="ghost-btn" disabled={busy} onClick={() => cancel(l)}>
                    {t('Retirar')}
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
      <h3 className="section-title">{t('🎒 Publicar del alijo')}</h3>
      {sellable.length === 0 ? (
        <p className="empty small">{t('No tienes objetos verificados sin publicar.')}</p>
      ) : (
        <div className="peer-list">
          {sellable.map((row) => {
            const type = BY_ID[row.type_id]
            if (!type) return null
            return (
              <div key={row.id} className="trade-row">
                <span className="market-item">
                  <span className="market-emoji" style={{ '--rc': RARITIES[type.rarity].color }}>
                    {type.emoji}
                  </span>
                  <span className="market-name">
                    {t(type.name)}
                    <em>{t('Gremio: {v} ⚙️', { v: RARITIES[type.rarity].value })}</em>
                  </span>
                </span>
                <span className="price-set">
                  <input
                    type="number"
                    min="1"
                    value={prices[row.id] ?? suggested(type)}
                    onChange={(e) => setPrices((p) => ({ ...p, [row.id]: e.target.value }))}
                  />
                  <button className="sell-btn" disabled={busy} onClick={() => publish(row)}>
                    {t('Publicar')}
                  </button>
                </span>
              </div>
            )
          })}
        </div>
      )}
      <p className="hint">
        {t('La tasa del Gremio es del 10 % (5 % para Contrabandistas) y se quema.')}
      </p>
    </>
  )
}

export default function Market({ peers, scrap, onScrap, onInvChanged, onToast }) {
  const [section, setSection] = useState('buy')

  if (!isOnline) {
    return (
      <div className="panel">
        <h2>{t('🏪 Mercado')}</h2>
        <p className="empty">
          {t('El mercado y los trueques necesitan el modo online.')} <br />
          Configura tu <code>.env</code> siguiendo <strong>docs/FASE2-SUPABASE.md</strong>.
        </p>
      </div>
    )
  }

  return (
    <div className="panel">
      <h2>{t('🏪 Mercado')}</h2>
      <div className="pills">
        <button className={section === 'buy' ? 'active' : ''} onClick={() => setSection('buy')}>
          {t('🛒 Comprar')}
        </button>
        <button className={section === 'sell' ? 'active' : ''} onClick={() => setSection('sell')}>
          {t('🏷️ Vender')}
        </button>
        <button
          className={section === 'trades' ? 'active' : ''}
          onClick={() => setSection('trades')}
        >
          {t('🤝 Trueques')}
        </button>
      </div>
      {section === 'buy' && (
        <BuySection
          scrap={scrap}
          onToast={onToast}
          onBought={(newScrap) => {
            onScrap(newScrap)
            onInvChanged()
          }}
        />
      )}
      {section === 'sell' && <SellSection onToast={onToast} />}
      {section === 'trades' && <Trades peers={peers} onToast={onToast} />}
    </div>
  )
}
