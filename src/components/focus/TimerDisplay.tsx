import type { TimerState } from '../../store/useTimerStore'

interface Props {
  remainingSeconds: number
  elapsedSeconds: number
  progressPercent: number
  state: TimerState
  isStopwatch: boolean
}

export function TimerDisplay({ remainingSeconds, elapsedSeconds, progressPercent, state, isStopwatch }: Props) {
  const displaySeconds = isStopwatch ? elapsedSeconds : remainingSeconds
  const hours = Math.floor(displaySeconds / 3600)
  const mins = Math.floor((displaySeconds % 3600) / 60)
  const secs = displaySeconds % 60
  const timeStr = hours > 0
    ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  const isWarning = state === 'RUNNING' && remainingSeconds <= 10 && remainingSeconds > 0 && !isStopwatch

  const stateColor = state === 'RUNNING' ? '#4CAF50' :
    state === 'PAUSED' ? '#FF9800' :
    state === 'FINISHED' ? '#00BCD4' :
    state === 'CANCELLED' ? '#ef5350' : '#ffffff'

  const displayColor = isWarning ? '#ef5350' : stateColor

  return (
    <div className="flex flex-col items-center select-none">
      <div
        className={`text-8xl font-extralight tracking-[0.18em] tabular-nums leading-none transition-all duration-300 ${isWarning ? 'animate-pulse' : ''}`}
        style={{
          color: displayColor,
          textShadow: state === 'RUNNING' ? `0 0 50px ${displayColor}50` : 'none',
        }}
      >
        {timeStr}
      </div>

      {!isStopwatch && (
        <div className="flex items-center gap-3 mt-6 w-full max-w-xs">
          <div className="flex-1 h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%`, backgroundColor: displayColor }}
            />
          </div>
          <span className="text-xs text-text-secondary/60 tabular-nums w-8 text-right font-mono">{progressPercent}%</span>
        </div>
      )}

      {!isStopwatch && (
        <div className="mt-2 text-[10px] text-text-secondary/40 uppercase tracking-widest">
          {progressPercent}% completado
        </div>
      )}
    </div>
  )
}
