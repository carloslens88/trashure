import { useState } from 'react'
import { bearingDeg, distanceM } from '../game/spawn'
import { t } from '../game/i18n'

// Una fila: aguja+distancia (objetivo en el mapa) o icono+estado (ej. jefe).
function CompassRow({ pos, target, icon, label, revealM, value, dead, title, onClick }) {
  const hasTarget = Boolean(target)
  const dist = hasTarget ? distanceM(pos, target) : null
  const deg = hasTarget ? bearingDeg(pos, target) : 0
  const close = hasTarget && dist <= revealM
  const distLabel = dist == null ? '' : dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`

  return (
    <div
      className={`compass-row ${close ? 'close' : ''} ${dead ? 'dead' : ''} ${onClick ? 'clickable' : ''}`}
      title={title}
      onClick={onClick}
    >
      {hasTarget ? (
        <span className="compass-row-dial">
          <span className="compass-row-arrow" style={{ transform: `rotate(${deg}deg)` }}>
            ➤
          </span>
        </span>
      ) : (
        <span className="compass-row-icon">{icon}</span>
      )}
      <span className="compass-row-label">{label}</span>
      <span className="compass-row-value">{value ?? (close ? t('¡Muy cerca!') : distLabel)}</span>
    </div>
  )
}

// Colapsado por defecto: un solo botón redondo con el recuento, igual que
// el resto de botones sueltos del HUD (ranking, misiones…) en vez de una
// tarjeta siempre abierta ocupando la esquina. Un toque la despliega.
export default function CompassPanel({ rows }) {
  const [open, setOpen] = useState(false)
  const visible = rows.filter(Boolean)
  if (visible.length === 0) return null

  const anyClose = visible.some((r) => r.target && distanceM(r.pos, r.target) <= r.revealM)

  if (!open) {
    return (
      <button
        className={`compass-toggle ${anyClose ? 'close' : ''}`}
        onClick={() => setOpen(true)}
        aria-label={t('Brújulas')}
      >
        🧭
        <span className="compass-toggle-count">{visible.length}</span>
      </button>
    )
  }

  return (
    <div className="compass-panel">
      <div className="compass-row compass-row-header clickable" onClick={() => setOpen(false)}>
        <span className="compass-row-icon">🧭</span>
        <span className="compass-row-label">{t('Brújulas')}</span>
        <span className="compass-row-value">✕</span>
      </div>
      {visible.map((row, i) => (
        <CompassRow key={i} {...row} />
      ))}
    </div>
  )
}
