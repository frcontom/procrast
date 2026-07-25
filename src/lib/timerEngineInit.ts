import { sessionManager } from './sessionManager'
import { useTimerStore } from '../store/useTimerStore'
import { playFinishSound, playWarningSound, playStartSound } from './sound'

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

    if (st.phase === 'work' && st.cycleTotal > 0 && st.cycleCount < st.cycleTotal) {
      // Ciclo completado -> iniciar descanso
      const newCount = st.cycleCount + 1
      const isLongBreak = newCount % st.cycleTotal === 0
      const breakMinutes = isLongBreak ? 15 : 5

      st.setCycleCount(newCount)
      st.setPhase(isLongBreak ? 'long_break' : 'short_break')
      st.setDuration(breakMinutes)
      playFinishSound()

      sessionManager.startSession(breakMinutes * 60, st.activityType, 'Descanso', false, false)
      playStartSound()
      return
    }

    if (st.phase !== 'work' && st.cycleTotal > 0) {
      // Descanso terminado -> iniciar siguiente sesion de trabajo
      st.setPhase('work')
      st.setDuration(st.durationMinutes)
      playFinishSound()

      sessionManager.startSession(st.durationMinutes * 60, st.activityType, st.sessionName, st.strictMode, false)
      playStartSound()

      if (st.cycleCount >= st.cycleTotal) {
        st.setCycleCount(0)
        st.setCycleTotal(0)
      }
      return
    }

    // Sesion normal o ciclo completado -> guardar y finalizar
    await sessionManager.finish()
    playFinishSound()
    st.setFinishedAt(new Date().toISOString())
    st.setRemaining(0)
    st.setProgress(100)
    st.setCycleCount(0)

    // Notificacion del navegador
    if (!document.hasFocus() && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Férreo — Focus Mode', {
        body: `¡Sesión de ${st.durationMinutes} min completada!`,
        icon: '/favicon.svg',
      })
    }
  })
}
