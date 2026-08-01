// Sonido 100 % generado con WebAudio: cero assets, cero peso, cero coste.
// Ambiente: viento sobre las ruinas + pings alienígenas lejanos.
// Los navegadores exigen un gesto del usuario antes de sonar: llamar a
// initSound() desde un listener de pointerdown.

let ctx = null
let master = null
let analyser = null
let muted = false
let ambientOn = false
let pingTimer = 0

const VOLUME = 0.7

function resume() {
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {})
}

export function initSound(startMuted = false) {
  if (ctx) {
    resume()
    return
  }
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  muted = startMuted
  master.gain.value = muted ? 0 : VOLUME
  // medidor para poder verificar que de verdad sale señal
  analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  master.connect(analyser)
  master.connect(ctx.destination)
  resume()
  startAmbient()
  // algunos navegadores suspenden el audio al volver del segundo plano
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) resume()
  })
  // acceso de diagnóstico (estado + nivel de señal 0-128)
  window.__trashureAudio = () => {
    if (!ctx || !analyser) return { state: 'off', level: 0 }
    const data = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteTimeDomainData(data)
    const level = Math.max(...data.map((v) => Math.abs(v - 128)))
    return { state: ctx.state, level }
  }
}

export function setMuted(m) {
  muted = m
  resume()
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : VOLUME, ctx.currentTime, 0.05)
}

export function isReady() {
  return Boolean(ctx)
}

function now() {
  return ctx.currentTime
}

// Un tono con envolvente simple
function tone({ freq, dur = 0.15, type = 'sine', gain = 0.12, when = 0, glideTo = null }) {
  if (!ctx) return
  resume()
  const t0 = now() + when
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(master)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

// ---------- Ambiente ----------

function startAmbient() {
  if (ambientOn || !ctx) return
  ambientOn = true

  // Viento: ruido marrón filtrado con ráfagas lentas
  const seconds = 4
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.5
  }
  const noise = ctx.createBufferSource()
  noise.buffer = buffer
  noise.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 320
  const windGain = ctx.createGain()
  windGain.gain.value = 0.08
  // ráfagas: LFO lento sobre el filtro
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.07
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 140
  lfo.connect(lfoGain).connect(filter.frequency)
  noise.connect(filter).connect(windGain).connect(master)
  noise.start()
  lfo.start()

  // Drone grave, casi subliminal: algo enorme pasó por aquí
  const drone = ctx.createOscillator()
  drone.type = 'triangle'
  drone.frequency.value = 55
  const droneGain = ctx.createGain()
  droneGain.gain.value = 0.028
  drone.connect(droneGain).connect(master)
  drone.start()

  scheduleAlienPing()
}

// Pings lejanos: tecnología alienígena que sigue emitiendo entre las ruinas
function scheduleAlienPing() {
  if (!ambientOn) return
  pingTimer = setTimeout(() => {
    const base = 900 + Math.random() * 700
    tone({ freq: base, dur: 1.4, type: 'sine', gain: 0.03, glideTo: base * 0.75 })
    tone({ freq: base * 1.5, dur: 1.1, type: 'sine', gain: 0.015, when: 0.12 })
    scheduleAlienPing()
  }, 9000 + Math.random() * 16000)
}

// ---------- Efectos ----------

export function playCollect(rarity) {
  if (!ctx) return
  const arps = {
    comun: [523, 659],
    pocoComun: [523, 659, 784],
    raro: [587, 740, 880],
    epico: [587, 740, 880, 1175],
    reliquia: [659, 831, 988, 1319],
  }
  if (rarity === 'alien') {
    tone({ freq: 320, dur: 0.5, type: 'sawtooth', gain: 0.06, glideTo: 1280 })
    tone({ freq: 1600, dur: 0.35, type: 'sine', gain: 0.05, when: 0.3, glideTo: 2400 })
    return
  }
  const notes = arps[rarity] ?? arps.comun
  notes.forEach((freq, i) =>
    tone({ freq, dur: 0.18, type: 'triangle', gain: 0.11, when: i * 0.07 }),
  )
}

export function playCoin() {
  tone({ freq: 988, dur: 0.09, type: 'square', gain: 0.06 })
  tone({ freq: 1319, dur: 0.14, type: 'square', gain: 0.06, when: 0.07 })
}

export function playLevelUp() {
  ;[523, 659, 784, 1047].forEach((freq, i) =>
    tone({ freq, dur: 0.22, type: 'triangle', gain: 0.12, when: i * 0.11 }),
  )
}

export function playHideout() {
  // acorde menor misterioso + destello
  ;[220, 262, 330].forEach((freq) =>
    tone({ freq, dur: 1.2, type: 'triangle', gain: 0.05 }),
  )
  tone({ freq: 1760, dur: 0.8, type: 'sine', gain: 0.04, when: 0.35, glideTo: 2640 })
}

export function playError() {
  tone({ freq: 220, dur: 0.2, type: 'square', gain: 0.05, glideTo: 160 })
}

// Alarma de Vigilancia: dos barridos descendentes desafinados + subgrave
export function playVigilance() {
  tone({ freq: 880, dur: 1.1, type: 'sawtooth', gain: 0.05, glideTo: 330 })
  tone({ freq: 932, dur: 1.1, type: 'sawtooth', gain: 0.04, glideTo: 349, when: 0.05 })
  tone({ freq: 880, dur: 1.1, type: 'sawtooth', gain: 0.05, glideTo: 330, when: 1.3 })
  tone({ freq: 55, dur: 2.6, type: 'triangle', gain: 0.08 })
}
