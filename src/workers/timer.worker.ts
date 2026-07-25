let targetTime = 0
let durationMs = 0
let running = false
let tickTimer: ReturnType<typeof setTimeout> | null = null

function tick() {
  if (!running) return
  const now = performance.now()
  const remainingMs = Math.max(0, targetTime - now)
  const elapsedMs = Math.max(0, durationMs - remainingMs)

  self.postMessage({
    type: 'TICK',
    remainingSeconds: Math.ceil(remainingMs / 1000),
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    progressPercent: durationMs > 0 ? Math.min(100, Math.round((elapsedMs / durationMs) * 100)) : 0,
  })

  if (remainingMs <= 0) {
    running = false
    self.postMessage({ type: 'FINISH' })
    return
  }

  const nextMs = (Math.floor(now / 1000) + 1) * 1000
  const delay = Math.max(50, nextMs - now)
  tickTimer = setTimeout(tick, delay)
}

self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data
  switch (type) {
    case 'START':
      durationMs = data.durationMs
      targetTime = performance.now() + durationMs
      running = true
      tick()
      self.postMessage({ type: 'STARTED', data: { durationMs } })
      break
    case 'PAUSE':
      if (running) {
        running = false
        if (tickTimer) clearTimeout(tickTimer)
        const remainingMs = Math.max(0, targetTime - performance.now())
        self.postMessage({ type: 'PAUSED', data: { remainingMs } })
      }
      break
    case 'RESUME':
      if (!running) {
        targetTime = performance.now() + data.remainingMs
        durationMs = data.durationMs
        running = true
        tick()
        self.postMessage({ type: 'RESUMED' })
      }
      break
    case 'CANCEL':
      running = false
      if (tickTimer) clearTimeout(tickTimer)
      break
  }
}
