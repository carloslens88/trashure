// Tarjeta de hallazgo: genera una imagen con <canvas>, 100% en el cliente,
// sin backend ni assets — solo emoji, texto y gradientes. Pensada para
// compartir en redes al pillar algo raro+ (el loop de crecimiento clásico
// del género).
import { RARITIES } from './items'
import { t } from './i18n'

const W = 900
const H = 1125

export function renderShareCard(item, { username } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  const r = RARITIES[item.type.rarity]

  // Fondo: degradado radial del color de rareza sobre un yermo oscuro. Se
  // evita color-mix() dentro del canvas (soporte desigual entre navegadores
  // para gradientes) pintando el color de rareza semitransparente sobre una
  // base oscura sólida en su lugar.
  ctx.fillStyle = '#0f0a08'
  ctx.fillRect(0, 0, W, H)
  const bg = ctx.createRadialGradient(W / 2, H * 0.38, 60, W / 2, H * 0.38, W * 0.85)
  bg.addColorStop(0, hexToRgba(r.color, 0.45))
  bg.addColorStop(1, hexToRgba(r.color, 0))
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Grano/viñeta simple
  ctx.save()
  ctx.globalAlpha = 0.5
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75)
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.65)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, W, H)
  ctx.restore()

  // Círculo con el emoji
  const cx = W / 2
  const cy = H * 0.36
  const radius = 220
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.fill()
  ctx.lineWidth = 10
  ctx.strokeStyle = r.color
  ctx.shadowColor = r.color
  ctx.shadowBlur = 60
  ctx.stroke()
  ctx.restore()

  ctx.textAlign = 'center'
  ctx.font = `${radius * 1.35}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
  ctx.textBaseline = 'middle'
  ctx.fillText(item.type.emoji, cx, cy + 12)

  // Nombre
  ctx.fillStyle = '#fff'
  ctx.font = '900 64px system-ui, sans-serif'
  ctx.textBaseline = 'alphabetic'
  wrapText(ctx, t(item.type.name), cx, H * 0.62, W - 140, 68)

  // Etiqueta de rareza
  const rarityLabel = t(r.name).toUpperCase()
  ctx.font = '800 34px system-ui, sans-serif'
  const padX = 28
  const tagW = ctx.measureText(rarityLabel).width + padX * 2
  const tagY = H * 0.68
  roundRect(ctx, cx - tagW / 2, tagY, tagW, 58, 29)
  ctx.fillStyle = r.color
  ctx.fill()
  ctx.fillStyle = '#1c1410'
  ctx.fillText(rarityLabel, cx, tagY + 40)

  // Pie: marca + usuario
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.font = '900 40px system-ui, sans-serif'
  ctx.fillText('🗑️ TRASHURE', cx, H * 0.86)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '400 26px system-ui, sans-serif'
  ctx.fillText(
    username ? t('Encontrado por {name} en el yermo', { name: username }) : t('Encontrado en el yermo'),
    cx,
    H * 0.895,
  )

  return canvas
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  const lines = []
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  lines.push(line)
  const startY = y - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((l, i) => ctx.fillText(l, cx, startY + i * lineHeight))
}

function roundRect(ctx, x, y, w, h, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
