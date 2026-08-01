import { useMemo } from 'react'
import { BY_ID, RARITIES, RARITY_ORDER } from '../game/items'
import { t } from '../game/i18n'

export default function Inventory({ inventory, onSell }) {
  const groups = useMemo(() => {
    const counts = new Map()
    for (const entry of inventory) counts.set(entry.typeId, (counts.get(entry.typeId) ?? 0) + 1)
    return [...counts]
      .map(([typeId, count]) => ({ type: BY_ID[typeId], count }))
      .filter((g) => g.type)
      .sort(
        (a, b) =>
          RARITY_ORDER.indexOf(b.type.rarity) - RARITY_ORDER.indexOf(a.type.rarity) ||
          a.type.name.localeCompare(b.type.name),
      )
  }, [inventory])

  return (
    <div className="panel">
      <h2>{t('🎒 Mochila')}</h2>
      {groups.length === 0 ? (
        <p className="empty">
          {t('Tu mochila está vacía. ¡Sal al mapa y toca la basura que veas cerca!')}
        </p>
      ) : (
        <div className="grid">
          {groups.map(({ type, count }) => {
            const r = RARITIES[type.rarity]
            const shiny = !['comun', 'pocoComun'].includes(type.rarity)
            return (
              <div
                key={type.id}
                className={`card ${shiny ? 'shiny' : ''}`}
                style={{ '--rc': r.color }}
              >
                {count > 1 && <span className="count">×{count}</span>}
                <span className="card-emoji">{type.emoji}</span>
                <span className="card-name">{t(type.name)}</span>
                <span className="rarity-tag">{t(r.name)}</span>
                <button className="sell-btn" onClick={() => onSell(type.id)}>
                  {t('Vender +{v} ⚙️', { v: r.value })}
                </button>
              </div>
            )
          })}
        </div>
      )}
      <p className="hint">{t('El Gremio de Recolectores compra cualquier cosa. Cualquiera.')}</p>
    </div>
  )
}
