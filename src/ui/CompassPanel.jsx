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

// Un único panel en vez de varios chips sueltos apilados a ojo — reúne todo
// lo "regional" (brújulas + estado del Reclamador) en una sola tarjeta.
export default function CompassPanel({ rows }) {
  const visible = rows.filter(Boolean)
  if (visible.length === 0) return null
  return (
    <div className="compass-panel">
      {visible.map((row, i) => (
        <CompassRow key={i} {...row} />
      ))}
    </div>
  )
}
