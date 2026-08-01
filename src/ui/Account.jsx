import { useEffect, useState } from 'react'
import { FACTIONS, levelInfo } from '../game/items'
import {
  getAccount,
  linkEmail,
  sendLoginLink,
  renameProfile,
  fetchTitles,
  fetchMyTitles,
  buyTitle,
  equipTitle,
} from '../game/online'
import { t, locale } from '../game/i18n'

function TitlesSection({ equipped, onTitle, onScrap, onToast, scrap }) {
  const [catalog, setCatalog] = useState([])
  const [mine, setMine] = useState(new Set())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchTitles().then(setCatalog).catch(() => {})
    fetchMyTitles()
      .then((ids) => setMine(new Set(ids)))
      .catch(() => {})
  }, [])

  async function toggleEquip(id) {
    setBusy(true)
    try {
      const next = equipped === id ? null : id
      await equipTitle(next)
      onTitle(next)
    } catch (e) {
      onToast(t('No se pudo: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  async function buy(id, price) {
    setBusy(true)
    try {
      const newScrap = await buyTitle(id)
      onScrap(newScrap)
      setMine((s) => new Set(s).add(id))
      onToast(t('🏅 ¡Título adquirido!'))
    } catch (e) {
      onToast(t('No se pudo comprar: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  if (catalog.length === 0) return null
  const owned = catalog.filter((t) => mine.has(t.id))
  const buyable = catalog.filter((t) => !mine.has(t.id) && t.price !== null)
  const locked = catalog.filter((t) => !mine.has(t.id) && t.price === null)

  return (
    <>
      <h3 className="section-title">{t('🏅 Títulos')}</h3>
      <div className="account-card">
        {owned.length > 0 && (
          <div className="title-list">
            {owned.map((title) => (
              <button
                key={title.id}
                className={`title-chip ${equipped === title.id ? 'equipped' : ''}`}
                disabled={busy}
                onClick={() => toggleEquip(title.id)}
              >
                {t(title.name)}
                {equipped === title.id && ' ✓'}
              </button>
            ))}
          </div>
        )}
        {buyable.length > 0 && (
          <div className="title-list">
            {buyable.map((title) => (
              <button
                key={title.id}
                className="title-chip buy"
                disabled={busy || scrap < title.price}
                onClick={() => buy(title.id, title.price)}
              >
                {t(title.name)} · {title.price} ⚙️
              </button>
            ))}
          </div>
        )}
        {locked.length > 0 && (
          <p className="modal-desc small">
            {t('🔒 Por logros: {list} (completa sets del Catálogo)', {
              list: locked.map((title) => t(title.name)).join(', '),
            })}
          </p>
        )}
      </div>
    </>
  )
}

// Vincular (guardar el progreso de este dispositivo) y recuperar (traer un
// progreso ya vinculado desde otro dispositivo) son la misma pantalla con
// dos modos, no dos tarjetas sueltas — solo uno de los dos tiene sentido a
// la vez, así que antes estaban confusamente repartidos por todo el perfil.
function SecuritySection({ user, onToast }) {
  const [mode, setMode] = useState('link') // 'link' | 'recover'
  const [email, setEmail] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const [pendingEmail, setPendingEmail] = useState(null)
  const [linkSent, setLinkSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const anonymous = user ? user.is_anonymous && !user.email : true

  async function link() {
    setBusy(true)
    try {
      await linkEmail(email.trim())
      setPendingEmail(email.trim())
      onToast(t('📧 Revisa tu correo y confirma para guardar tu cuenta'))
    } catch (e) {
      onToast(t('No se pudo vincular: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  async function sendLink() {
    setBusy(true)
    try {
      await sendLoginLink(loginEmail.trim())
      setLinkSent(true)
      onToast(t('📧 Enlace enviado: ábrelo en ESTE dispositivo'))
    } catch (e) {
      onToast(t('No se pudo enviar: {e}', { e: t(e.message) }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h3 className="section-title">{t('🔒 Guardar progreso')}</h3>

      {user === null ? (
        <p className="modal-desc">{t('Consultando al Gremio…')}</p>
      ) : !anonymous ? (
        <div className="account-card ok">
          <strong>{t('✅ Cuenta guardada')}</strong>
          <p className="modal-desc small">
            {t('Vinculada a {email}. Tu progreso te sigue a cualquier dispositivo.', {
              email: user.email ?? user.new_email,
            })}
          </p>
        </div>
      ) : mode === 'link' ? (
        <div className="account-card warn">
          <strong>{t('⚠️ Partida de invitado')}</strong>
          <p className="modal-desc small">
            {t(
              'Tu progreso vive solo en este dispositivo. Vincula tu email y quedará a salvo para siempre (mismo personaje, mismo inventario).',
            )}
          </p>
          {pendingEmail ? (
            <p className="modal-desc small">
              {t('📧 Enviado a {email}. Abre el enlace para confirmar.', { email: pendingEmail })}
            </p>
          ) : (
            <>
              <div className="account-line">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  className="sell-btn"
                  disabled={busy || !email.includes('@')}
                  onClick={link}
                >
                  {t('Vincular')}
                </button>
              </div>
              <button className="ghost-btn small" onClick={() => setMode('recover')}>
                {t('¿Ya tienes cuenta? Recupérala →')}
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="account-card">
          <strong>{t('Recuperar cuenta')}</strong>
          <p className="modal-desc small">
            {t('Te mandamos un enlace de acceso al email que ya tienes vinculado.')}
          </p>
          {linkSent ? (
            <p className="modal-desc small">
              {t('📧 Enlace enviado. Ábrelo aquí para recuperarla.')}
            </p>
          ) : (
            <div className="account-line">
              <input
                type="email"
                placeholder="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
              <button
                className="sell-btn"
                disabled={busy || !loginEmail.includes('@')}
                onClick={sendLink}
              >
                {t('Recuperar')}
              </button>
            </div>
          )}
          <button className="ghost-btn small" onClick={() => setMode('link')}>
            {t('← Volver a vincular')}
          </button>
        </div>
      )}
    </>
  )
}

export default function Account({
  username,
  faction,
  xp,
  scrap,
  explored = 0,
  equippedTitle = null,
  onTitle,
  onScrap,
  onRenamed,
  onToast,
  onClose,
}) {
  const [user, setUser] = useState(null)
  const [name, setName] = useState(username ?? '')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getAccount().then(setUser)
  }, [])

  const { level } = levelInfo(xp)
  const f = faction ? FACTIONS[faction] : null

  async function saveName() {
    if (name.trim() === username) return
    setBusy(true)
    try {
      const clean = await renameProfile(name)
      onRenamed(clean)
      onToast(t('✏️ Nombre actualizado'))
    } catch (e) {
      onToast(t('No se pudo renombrar: {e}', { e: t(e.message) }))
      setName(username ?? '')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal rank-modal account-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('👤 Tu cuenta')}</h2>

        <div className="account-card">
          <div className="account-line">
            <input
              className="account-name"
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              className="sell-btn"
              disabled={busy || name.trim() === username}
              onClick={saveName}
            >
              {t('Guardar')}
            </button>
          </div>
          <p className="account-meta">
            {f ? `${f.emoji} ${t(f.name)} · ` : ''}
            {t('Nv {n}', { n: level })} · {xp.toLocaleString(locale())} XP · ⚙️{' '}
            {scrap.toLocaleString(locale())}
          </p>
        </div>

        <SecuritySection user={user} onToast={onToast} />

        <h3 className="section-title">{t('🗺️ Exploración')}</h3>
        <div className="account-card">
          <p className="account-meta">
            {t('{n} sectores despejados de la Niebla · {km} km² · ≈ {c} campos de fútbol', {
              n: explored.toLocaleString(locale()),
              km: (explored * 0.00114).toLocaleString(locale(), { maximumFractionDigits: 2 }),
              c: Math.round(explored * 0.16).toLocaleString(locale()),
            })}
          </p>
          <p className="modal-desc small">
            {t(
              'La tormenta re-cubre lo que no patrullas, pero lo cartografiado cuenta para siempre — para ti y para tu facción.',
            )}
          </p>
        </div>

        <TitlesSection
          equipped={equippedTitle}
          onTitle={onTitle}
          onScrap={onScrap}
          onToast={onToast}
          scrap={scrap}
        />

        <button className="primary-btn" onClick={onClose}>
          {t('Volver al mapa')}
        </button>
      </div>
    </div>
  )
}
