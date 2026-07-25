let audioCtx: AudioContext | null = null
let ambientNode: AudioBufferSourceNode | null = null
let ambientGain: GainNode | null = null

function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

export function getAudioCtx() { return getCtx() }

export function playStartSound() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(523, ctx.currentTime)
  osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08)
  gain.gain.setValueAtTime(0.25, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.3)
}

export function playFinishSound() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15)
  osc.frequency.setValueAtTime(440, ctx.currentTime + 0.3)
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.8)
}

export function playWarningSound() {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'square'
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.15)
}

export function startAmbient(type: 'rain' | 'forest' | 'waves' | 'coffee', volume = 0.1) {
  stopAmbient()
  const ctx = getCtx()
  ambientGain = ctx.createGain()
  ambientGain.gain.setValueAtTime(volume, ctx.currentTime)
  ambientGain.connect(ctx.destination)

  const bufferSize = ctx.sampleRate * 4
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    switch (type) {
      case 'rain':
        data[i] = (Math.random() * 2 - 1) * Math.pow(Math.random(), 3)
        break
      case 'forest':
        data[i] = Math.sin(i * 0.01) * 0.1 + (Math.random() * 2 - 1) * 0.3 + Math.sin(i * 0.003) * 0.2
        break
      case 'waves':
        data[i] = Math.sin(i * 0.005) * 0.4 * Math.max(0, Math.sin(i * 0.001))
        break
      case 'coffee':
        data[i] = (Math.random() * 2 - 1) * 0.15 + Math.sin(i * 0.02 + Math.sin(i * 0.001) * 10) * 0.05
        break
    }
  }

  ambientNode = ctx.createBufferSource()
  ambientNode.buffer = buffer
  ambientNode.loop = true
  ambientNode.connect(ambientGain)
  ambientNode.start()
}

export function stopAmbient() {
  if (ambientNode) {
    try { ambientNode.stop() } catch {}
    ambientNode = null
  }
}

export function setAmbientVolume(volume: number) {
  if (ambientGain) {
    ambientGain.gain.setValueAtTime(volume, getCtx().currentTime)
  }
}

let breathingNodes: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode } | null = null

export function playBreathingSound() {
  stopBreathingSound()
  const ctx = getCtx()
  const gain = ctx.createGain()
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0, ctx.currentTime)

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(180, ctx.currentTime)
  osc.connect(gain)

  const lfo = ctx.createOscillator()
  lfo.type = 'sine'
  lfo.frequency.setValueAtTime(0.125, ctx.currentTime) // 8s cycle
  const lfoGain = ctx.createGain()
  lfoGain.gain.setValueAtTime(80, ctx.currentTime)
  lfo.connect(lfoGain)
  lfoGain.connect(osc.frequency)

  // Volume follows the same LFO (inhale louder, exhale softer)
  const volMod = ctx.createGain()
  lfo.connect(volMod)
  volMod.gain.setValueAtTime(0.04, ctx.currentTime)
  volMod.connect(gain.gain)
  gain.gain.setValueAtTime(0.05, ctx.currentTime)

  osc.start()
  lfo.start()
  breathingNodes = { osc, gain, lfo }
}

export function stopBreathingSound() {
  if (breathingNodes) {
    try { breathingNodes.osc.stop() } catch {}
    try { breathingNodes.lfo.stop() } catch {}
    breathingNodes = null
  }
}
