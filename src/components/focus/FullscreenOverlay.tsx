import { useEffect, useState } from 'react'
import { useTimerStore } from '../../store/useTimerStore'
import { formatTime } from '../../lib/formatters'

interface Props {
  onExit: () => void
}

export function FullscreenOverlay({ onExit }: Props) {
  const { state, remainingSeconds, elapsedSeconds, progressPercent, activityType, sessionName, durationMinutes, isStopwatch } = useTimerStore()
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale')
  const [showScore, setShowScore] = useState(false)
  const [cursorHidden, setCursorHidden] = useState(false)

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {})
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (document.fullscreenElement) document.exitFullscreen?.()
    }
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (state === 'PAUSED') {
      timer = setInterval(() => {
        setBreathPhase((p) => p === 'inhale' ? 'exhale' : 'inhale')
      }, 4000)
    }
    return () => clearInterval(timer)
  }, [state])

  useEffect(() => {
    if (state === 'FINISHED') {
      setShowScore(true)
      const t = setTimeout(() => setShowScore(false), 2500)
      return () => clearTimeout(t)
    }
    setShowScore(false)
  }, [state])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const handleMove = () => {
      setCursorHidden(false)
      clearTimeout(timer)
      timer = setTimeout(() => setCursorHidden(true), 3000)
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('keydown', handleMove)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('keydown', handleMove)
      clearTimeout(timer)
    }
  }, [])

  const stateColors = { IDLE: '#a0a0b0', RUNNING: '#4CAF50', PAUSED: '#FF9800', FINISHED: '#00BCD4', CANCELLED: '#FF6B6B' }
  const color = stateColors[state]
  const displaySeconds = isStopwatch ? elapsedSeconds : remainingSeconds
  const radius = 160
  const circumference = 2 * Math.PI * radius
  const offset = !isStopwatch ? circumference - (progressPercent / 100) * circumference : 0

  const focusScore = Math.min(100, Math.round(
    ((durationMinutes / 25) * 50) + (progressPercent * 0.5)
  ))

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
      style={{ cursor: cursorHidden ? 'none' : 'default' }}
    >
      <button onClick={onExit} className="absolute top-4 right-4 text-text-secondary hover:text-white text-sm z-10 transition-colors">
        ⛶ Salir
      </button>

      {state === 'PAUSED' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-4xl font-light transition-all duration-[4000ms] ease-in-out ${breathPhase === 'inhale' ? 'scale-100 opacity-100' : 'scale-110 opacity-60'}`}>
            <div className="text-center">
              <div className="text-6xl mb-4">{breathPhase === 'inhale' ? '🌬️' : '😮‍💨'}</div>
              <div className="text-2xl text-text-secondary">{breathPhase === 'inhale' ? 'Inhala...' : 'Exhala...'}</div>
            </div>
          </div>
        </div>
      )}

      {state === 'FINISHED' && showScore && (
        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
          <div className="text-center">
            <div className="text-7xl font-bold mb-4" style={{ color }}>{focusScore}</div>
            <div className="text-xl text-text-secondary">Focus Score</div>
          </div>
        </div>
      )}

      <div className="relative">
        <svg width="360" height="360" className="-rotate-90">
          <circle cx="180" cy="180" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          {!isStopwatch && (
            <circle cx="180" cy="180" r={radius} fill="none" stroke={color} strokeWidth="4"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              className="transition-all duration-500 ease-linear" />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-7xl font-light tracking-widest tabular-nums" style={{ color }}>
            {formatTime(displaySeconds)}
          </span>
          <span className="text-text-secondary text-sm mt-4 tracking-wider uppercase">
            {sessionName || activityType}
          </span>
          <span className="text-text-secondary text-xs mt-1 opacity-60">
            {state === 'RUNNING' && 'EN FOCO'}
            {state === 'PAUSED' && 'PAUSADO'}
            {state === 'FINISHED' && 'COMPLETADO'}
          </span>
        </div>
      </div>

      <div className="absolute bottom-8 flex items-center gap-8 text-xs text-text-secondary">
        <span>🔥 {progressPercent}%</span>
        <span>⚡ {Math.round(elapsedSeconds / 60)}min</span>
      </div>
    </div>
  )
}
