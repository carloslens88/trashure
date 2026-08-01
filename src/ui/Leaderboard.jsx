import { useEffect, useState } from 'react'
import { levelInfo, FACTIONS } from '../game/items'
import {
  fetchLeaderboard,
  fetchWarStatus,
  fetchTitles,
  fetchExploredTop,
  fetchFactionExplored,
  getUserId,
} from '../game/online'
import { t, locale } from '../game/i18n'

const MEDALS = ['🥇', '🥈', '🥉']

// Competición de cartógrafos: quién le ha arrebatado más yermo a la Niebla
function Territory({ totals, top, me }) {
  if (!totals || totals.length === 0) return null
  const max = Math.max(...totals.map((t) => Number(t.total)), 1)
  const sorted = [...totals].sort((a, b) => b.total - a.total)
  return (
    <div className="war">
      <h3 className="section-title">{t('🗺️ Territorio cartografiado')}</h3>
      {sorted.map((row) => {
        const f = FACTIONS[row.faction]
        if (!f) return null
        return (
          <div key={row.faction} className="war-row">
            <span className="war-name">
              {f.emoji} {t(f.name)}
            </span>
            <div className="war-bar">
              <div
                className="war-fill"
                style={{ width: `${(Number(row.total) / max) * 100}%`, background: f.color }}
              />
            </div>
            <span className="war-xp">{Number(row.total).toLocaleString(locale())}</span>
          </div>
        )
      })}
      {top && top.length > 0 && (
        <div className="rank-list">
          {top.map((row, i) => (
            <div key={row.id} className={`rank-row ${row.id === me ? 'me' : ''}`}>
              <span className="rank-pos">{MEDALS[i] ?? `${i + 1}.`}</span>
              <span className="rank-name">
                {row.faction ? `${FACTIONS[row.faction]?.emoji ?? ''} ` : ''}
                {row.username ?? t('Recolector anónimo')}
                {row.id === me && t(' (tú)')}
              </span>
              <span className="rank-xp">
                {t('{n} sectores', { n: row.explored.toLocaleString(locale()) })}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="modal-desc small">{t('Sectores despejados de la Niebla Tóxica caminando.')}</p>
    </div>
  )
}

function FactionWar({ totals }) {
  if (!totals || totals.length === 0) return null
  const max = Math.max(...totals.map((t) => Number(t.score)), 1)
  const sorted = [...totals].sort((a, b) => b.score - a.score)
  const reigning = totals.find((t) => t.reigning)
  return (
    <div className="war">
      <h3 className="section-title">{t('⚔️ Guerra semanal')}</h3>
      {reigning && (
        <p className="war-champ">
          {t('👑 Campeones: {f} (+10 % XP esta semana)', {
            f: `${FACTIONS[reigning.faction]?.emoji} ${t(FACTIONS[reigning.faction]?.name)}`,
          })}
        </p>
      )}
      {sorted.map((row) => {
        const f = FACTIONS[row.faction]
        if (!f) return null
        return (
          <div key={row.faction} className="war-row">
            <span className="war-name">
              {f.emoji} {t(f.name)}
              {row.reigning ? ' 👑' : ''}
            </span>
            <div className="war-bar">
              <div
                className="war-fill"
                style={{ width: `${(Number(row.score) / max) * 100}%`, background: f.color }}
              />
            </div>
            <span className="war-xp">{Number(row.score).toLocaleString(locale())}</span>
          </div>
        )
      })}
      <p className="modal-desc small">
        {t('El lunes se corona a la facción con más XP recolectado.')}
      </p>
    </div>
  )
}

export default function Leaderboard({ onClose }) {
  const [rows, setRows] = useState(null)
  const [totals, setTotals] = useState(null)
  const [terrTotals, setTerrTotals] = useState(null)
  const [terrTop, setTerrTop] = useState(null)
  const [titleNames, setTitleNames] = useState({})
  const me = getUserId()

  useEffect(() => {
    fetchLeaderboard()
      .then(setRows)
      .catch(() => setRows([]))
    fetchWarStatus()
      .then(setTotals)
      .catch(() => setTotals([]))
    fetchFactionExplored()
      .then(setTerrTotals)
      .catch(() => setTerrTotals([]))
    fetchExploredTop()
      .then(setTerrTop)
      .catch(() => setTerrTop([]))
    fetchTitles()
      .then((ts) => setTitleNames(Object.fromEntries(ts.map((t) => [t.id, t.name]))))
      .catch(() => {})
  }, [])

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal rank-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('🏆 Top Recolectores')}</h2>
        <FactionWar totals={totals} />
        <Territory totals={terrTotals} top={terrTop} me={me} />
        {rows === null ? (
          <p className="modal-desc">{t('Consultando al Gremio…')}</p>
        ) : rows.length === 0 ? (
          <p className="modal-desc">{t('Aún no hay recolectores en el registro.')}</p>
        ) : (
          <div className="rank-list">
            {rows.map((row, i) => (
              <div key={row.id} className={`rank-row ${row.id === me ? 'me' : ''}`}>
                <span className="rank-pos">{MEDALS[i] ?? `${i + 1}.`}</span>
                <span className="rank-name">
                  {row.faction ? `${FACTIONS[row.faction]?.emoji ?? ''} ` : ''}
                  {row.username ?? t('Recolector anónimo')}
                  {row.id === me && t(' (tú)')}
                  {row.title && titleNames[row.title] && (
                    <em className="rank-title">«{t(titleNames[row.title])}»</em>
                  )}
                </span>
                <span className="rank-level">{t('Nv {n}', { n: levelInfo(row.xp).level })}</span>
                <span className="rank-xp">{row.xp.toLocaleString(locale())} XP</span>
              </div>
            ))}
          </div>
        )}
        <button className="primary-btn" onClick={onClose}>
          {t('Volver al mapa')}
        </button>
      </div>
    </div>
  )
}
