import { useEffect, useState } from 'react'
import { levelInfo } from '../game/items'
import { nextRefreshMs } from '../game/spawn'
import { t, getLang, setLang, locale } from '../game/i18n'
import { HATCH_M, petLevel, petForm } from '../game/pet'

function RefreshTimer() {
  const [ms, setMs] = useState(nextRefreshMs())
  useEffect(() => {
    const t = setInterval(() => setMs(nextRefreshMs()), 1000)
    return () => clearInterval(t)
  }, [])
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return (
    <div className="hud-chip">
      ♻️ {m}:{String(s).padStart(2, '0')}
    </div>
  )
}

export default function HUD({
  xp,
  scrap,
  peerCount = 0,
  zoneEvent = null,
  faction = null,
  onOpenAccount = null,
  slim = false, // en paneles (mochila, mercado…): solo nivel y Chatarra
  gpsLabel = '🛰️ GPS',
  muted = false,
  onToggleMute = null,
  streak = 0,
  streakPending = false,
  weather = 'clear',
  pet = null,
  onPetTap = null,
}) {
  const { level, into, need } = levelInfo(xp)
  return (
    <div className="hud">
      <div className="hud-col left">
        <button
          className="hud-card hud-level"
          onClick={onOpenAccount}
          disabled={!onOpenAccount}
          aria-label={t('Tu cuenta')}
        >
          <div className="level-badge">{level}</div>
          <div className="xp-wrap">
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${Math.min(100, (into / need) * 100)}%` }} />
            </div>
            <span className="xp-text">
              {into}/{need} XP
            </span>
          </div>
          {onOpenAccount && <span className="account-hint">👤</span>}
        </button>
        {!slim && faction && (
          <div className="hud-chip" title={t(faction.perk)}>
            {faction.emoji} {t(faction.name)}
          </div>
        )}
        {!slim && streak > 0 && (
          <div
            className={`hud-chip streak ${streakPending ? 'pending' : ''}`}
            title={
              streakPending
                ? t('🔥 Racha en peligro: recoge algo hoy para mantenerla')
                : t('Racha diaria: +{p} % XP', { p: Math.min(streak, 10) * 5 })
            }
          >
            🔥 {streak}
            {streakPending && '⏳'}
          </div>
        )}
        {!slim && pet && pet.stage !== 'none' && (
          <button
            className="hud-chip pet-chip"
            onClick={onPetTap}
            title={
              pet.stage === 'egg'
                ? t('Huevo de incubadora: camina para que eclosione')
                : petForm(pet.species, pet.walkedM).name
            }
          >
            {pet.stage === 'egg'
              ? `🥚 ${Math.max(0, (HATCH_M - pet.walkedM) / 1000).toFixed(1)} km`
              : `${petForm(pet.species, pet.walkedM).emoji} ${t('Nv {n}', { n: petLevel(pet.walkedM) })}`}
          </button>
        )}
        {!slim && weather === 'storm' && (
          <div className="hud-chip storm" title={t('La lluvia destapa cosas: +25 % XP')}>
            {t('🌧️ Tormenta')}
          </div>
        )}
        {!slim && zoneEvent && (
          <div className="hud-chip event" title={t(zoneEvent.desc)}>
            {zoneEvent.emoji} {t(zoneEvent.name)}
          </div>
        )}
      </div>
      <div className="hud-col">
        <div className="hud-card hud-scrap" key={scrap}>
          ⚙️ {scrap.toLocaleString(locale())}
        </div>
        {onToggleMute && (
          <button className="hud-chip mute-chip" onClick={onToggleMute} aria-label={t('Sonido')}>
            {muted ? '🔇' : '🔊'}
          </button>
        )}
        {!slim && <RefreshTimer />}
        {!slim && <div className="hud-chip">{gpsLabel}</div>}
        {!slim && peerCount > 0 && (
          <div className="hud-chip">{t('👥 {n} cerca', { n: peerCount })}</div>
        )}
        <button
          className="hud-chip lang-chip"
          onClick={() => setLang(getLang() === 'es' ? 'en' : 'es')}
          aria-label={t('🌐 Idioma')}
        >
          🌐 {getLang().toUpperCase()}
        </button>
      </div>
    </div>
  )
}
