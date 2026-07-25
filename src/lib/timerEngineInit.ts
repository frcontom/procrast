import { sessionManager } from './sessionManager'
import { useTimerStore } from '../store/useTimerStore'
import { useSettingsStore } from '../store/useSettingsStore'
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
      // Guardar duracion original del trabajo antes del descanso
      st.setWorkDuration(st.durationMinutes)
      const settings = useSettingsStore.getState()
      const breakMinutes = settings.timerConfig.shortBreakMinutes

      st.setPhase('short_break')
      st.setDuration(breakMinutes)
      playFinishSound()

      sessionManager.startSession(breakMinutes, st.activityType, 'Descanso', false, false)
      playStartSound()
      return
    }

    if (st.phase !== 'work' && st.cycleTotal > 0) {
      // Incrementar ciclo y restaurar duracion del trabajo
      const nextCount = st.cycleCount + 1
      st.setCycleCount(nextCount)
      const workMin = st.workDuration > 0 ? st.workDuration : st.durationMinutes
      st.setPhase('work')
      st.setDuration(workMin)
      playFinishSound()

      sessionManager.startSession(workMin, st.activityType, st.sessionName, st.strictMode, false)
      playStartSound()

      if (st.cycleCount >= st.cycleTotal) {
        st.setCycleCount(0)
        st.setCycleTotal(0)
      }
      return
    }

    await sessionManager.finish()
    playFinishSound()
    st.setFinishedAt(new Date().toISOString())
    st.setRemaining(0)
    st.setProgress(100)
    st.setCycleCount(0)

    if (!document.hasFocus() && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Férreo — Focus Mode', {
        body: `¡Sesión de ${st.durationMinutes} min completada!`,
        icon: '/favicon.svg',
      })
    }
  })
}
