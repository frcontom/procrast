import type { TimerState } from '../../store/useTimerStore'

interface Props {
  state: TimerState
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onCancel: () => void
}

export function TimerControls({ state, onStart, onPause, onResume, onCancel }: Props) {
  const isRunning = state === 'RUNNING'
  const isPaused = state === 'PAUSED'
  const canCancel = state === 'RUNNING' || state === 'PAUSED'

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={isRunning ? onPause : isPaused ? onResume : onStart}
        className="flex items-center gap-2.5 px-10 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.97] duration-150 bg-accent hover:bg-[var(--accent-hover)] text-white shadow-lg shadow-accent/20 hover:shadow-accent/30"
      >
        <span className="text-lg">{isRunning ? '⏸' : '▶'}</span>
        <span>{isRunning ? 'Pausar' : isPaused ? 'Reanudar' : 'Iniciar'}</span>
      </button>

      {canCancel && (
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.97] duration-150 border border-white/15 text-text-secondary hover:text-white hover:border-white/30 hover:bg-white/5"
        >
          <span className="text-base">✕</span>
          <span>Cancelar</span>
        </button>
      )}
    </div>
  )
}
