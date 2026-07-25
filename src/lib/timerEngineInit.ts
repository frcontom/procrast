import { sessionManager } from './sessionManager'
import { useTimerStore } from '../store/useTimerStore'
import { playFinishSound, playWarningSound } from './sound'

let initialized = false

export function initTimerEngine() {
  if (initialized) return
  initialized = true

  const engine = sessionManager.getEngine()

  engine.on('TICK', () => {
    const s = engine.getSnapshot()
    const st = useTimerStore.getState()
    st.setRemaining(s.remainingSeconds)
    st.setElapsed(s.elapsedSeconds)
    st.setProgress(s.progressPercent)
    if (!st.isStopwatch && s.remainingSeconds <= 10 && s.remainingSeconds > 0) {
      playWarningSound()
    }
  })

  engine.on('FINISH', async () => {
    const st = useTimerStore.getState()
    await sessionManager.finish()
    playFinishSound()
    st.setFinishedAt(new Date().toISOString())
    st.setRemaining(0)
    st.setProgress(100)
  })
}
