import { useEffect, useRef, useState } from 'react'
import { renderShareCard, canvasToBlob } from '../game/shareCard'
import { t } from '../game/i18n'

export default function ShareCardModal({ item, username, onClose }) {
  const imgRef = useRef(null)
  const [blob, setBlob] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const canvas = renderShareCard(item, { username })
    canvasToBlob(canvas).then((b) => {
      setBlob(b)
      if (imgRef.current) imgRef.current.src = URL.createObjectURL(b)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function share() {
    if (!blob) return
    setBusy(true)
    try {
      const file = new File([blob], 'trashure-hallazgo.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Trashure',
          text: t('¡Mira lo que he encontrado en Trashure!'),
        })
      } else {
        download()
      }
    } catch {
      /* el usuario canceló el share nativo: no es un error */
    } finally {
      setBusy(false)
    }
  }

  function download() {
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'trashure-hallazgo.png'
    a.click()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t('📤 Tarjeta de hallazgo')}</h2>
        <img ref={imgRef} className="share-preview" alt={t('Tarjeta de hallazgo')} />
        <button className="primary-btn" disabled={!blob || busy} onClick={share}>
          {t('Compartir 📤')}
        </button>
        <button className="ghost-btn" disabled={!blob} onClick={download}>
          {t('Descargar imagen')}
        </button>
        <button className="ghost-btn" onClick={onClose}>
          {t('Cerrar')}
        </button>
      </div>
    </div>
  )
}
