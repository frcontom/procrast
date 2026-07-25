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

  const stateColor = state === 'RUNNING' ? '#4CAF50' :
    state === 'PAUSED' ? '#FF9800' :
    state === 'FINISHED' ? '#00BCD4' :
    state === 'CANCELLED' ? '#ef5350' : '#ffffff'

  return (
    <div className="flex flex-col items-center select-none">
      <div
        className="text-8xl font-extralight tracking-[0.15em] tabular-nums leading-none"
        style={{
          color: stateColor,
          textShadow: state === 'RUNNING' ? `0 0 40px ${stateColor}40` : 'none',
        }}
      >
        {timeStr}
      </div>

      {!isStopwatch && (
        <div className="flex items-center gap-3 mt-6 w-full max-w-xs">
          <div className="flex-1 h-1 bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%`, backgroundColor: stateColor }}
            />
          </div>
          <span className="text-xs text-text-secondary/60 tabular-nums w-8 text-right font-mono">{progressPercent}%</span>
        </div>
      )}
    </div>
  )
}
