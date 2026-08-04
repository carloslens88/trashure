import { useEffect, useState } from 'react'
import { FACTIONS, levelInfo } from '../game/items'
import { SKINS, SKIN_ORDER } from '../game/skins'
import { fetchMySkins, buySkin, equipSkin } from '../game/online'
import { t } from '../game/i18n'

// Tocar tu propio robot en el mapa abre esta ficha: vestuario cosmético
// (skins compradas con Chatarra) + un vistazo a quién eres ahora mismo.
export default function PlayerCardModal({ faction, xp, scrap, skin, equippedTitle, onSkin, onScrap, onToast, onClose }) {
  const [mine, setMine] = useState(new Set())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchMySkins()
      .then((ids) => setMine(new Set(ids)))
      .catch(() => {})
  }, [])

  const { level } = levelInfo(xp)
  const f = faction ? FACTIONS[faction] : null
  const current = skin ? SKINS[skin] : null

  async function buy(id, price) {
    setBusy(true)
    try {
      const newScrap = await buySkin(id)
      onScrap(newScrap)
      setMine((s) => new Set(s).add(id))
      onToast(t('✨ ¡Skin adquirida!'))
    } catch (e) {
      onToast(t('No se pudo comprar: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  async function equip(id) {
    setBusy(true)
    try {
      await equipSkin(id)
      onSkin(id)
    } catch (e) {
      onToast(t('No se pudo equipar: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  const wrapStyle = {
    position: 'relative',
    width: 56,
    height: 56,
    margin: '12px auto',
    ...(f ? { '--fc': f.color } : {}),
    ...(current ? { '--sk1': current.colors[0], '--sk2': current.colors[1] } : {}),
  }
  const wrapClass = [
    'player-wrap',
    f && 'has-faction',
    current && 'has-skin',
    current?.animated && 'skin-animated',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal rank-modal account-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('🤖 Tu robot')}</h2>

        <div className="account-card" style={{ textAlign: 'center' }}>
          <div className={wrapClass} style={wrapStyle}>
            <div className="player-shadow"></div>
            <div className="player-ring"></div>
            <div className="player-marker">🤖</div>
            {current?.badge && <div className="player-badge">{current.badge}</div>}
          </div>
          <p className="account-meta">
            {f ? `${f.emoji} ${t(f.name)} · ` : ''}
            {t('Nv {n}', { n: level })}
            {equippedTitle ? ` · ${t(equippedTitle)}` : ''}
          </p>
        </div>

        <h3 className="section-title">{t('👕 Vestuario')}</h3>
        <div className="account-card">
          <div className="title-list">
            <button
              className={`title-chip ${!skin ? 'equipped' : ''}`}
              disabled={busy}
              onClick={() => equip(null)}
            >
              {t('Sin skin')}
              {!skin && ' ✓'}
            </button>
            {SKIN_ORDER.map((id) => {
              const s = SKINS[id]
              const owned = mine.has(id)
              const lockedByFaction = s.faction && s.faction !== faction
              if (owned) {
                return (
                  <button
                    key={id}
                    className={`title-chip ${skin === id ? 'equipped' : ''}`}
                    disabled={busy}
                    onClick={() => equip(id)}
                  >
                    {s.badge ? `${s.badge} ` : ''}
                    {t(s.name)}
                    {skin === id && ' ✓'}
                  </button>
                )
              }
              return (
                <button
                  key={id}
                  className="title-chip buy"
                  disabled={busy || lockedByFaction || scrap < s.price}
                  title={
                    lockedByFaction
                      ? t('Exclusiva de {faction}', { faction: t(FACTIONS[s.faction].name) })
                      : undefined
                  }
                  onClick={() => buy(id, s.price)}
                >
                  {s.badge ? `${s.badge} ` : ''}
                  {t(s.name)} · {s.price} ⚙️{lockedByFaction ? ' 🔒' : ''}
                </button>
              )
            })}
          </div>
        </div>

        <button className="primary-btn" onClick={onClose}>
          {t('Volver al mapa')}
        </button>
      </div>
    </div>
  )
}
