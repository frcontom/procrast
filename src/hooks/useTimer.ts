import { useEffect } from 'react'
import { TimerEngine } from '../lib/timerEngine'
import { useTimerStore } from '../store/useTimerStore'

const engine = new TimerEngine()

export function useTimer() {
  const { state, setState, setElapsed, setRemaining, setProgress, durationMinutes, setDuration } = useTimerStore()

  useEffect(() => {
    const unsubs = [
      engine.on('TICK', () => {
        const s = engine.getSnapshot()
        setState(s.state)
        setElapsed(s.elapsedSeconds)
        setRemaining(s.remainingSeconds)
        setProgress(s.progressPercent)
      }),
      engine.on('FINISH', () => {
        const s = engine.getSnapshot()
        setState(s.state)
        setElapsed(s.elapsedSeconds)
        setRemaining(0)
        setProgress(100)
      }),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  return {
    state,
    start: () => engine.start(durationMinutes * 60 * 1000),
    pause: () => engine.pause(),
    resume: () => engine.resume(),
    cancel: () => { engine.cancel(); setState('IDLE'); setElapsed(0); setRemaining(durationMinutes * 60); setProgress(0) },
    setDuration,
    getSnapshot: () => engine.getSnapshot(),
  }
}
