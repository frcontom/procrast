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
  const isIdle = state === 'IDLE'

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={isRunning ? onPause : isPaused ? onResume : onStart}
        className={`flex items-center gap-2.5 px-10 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.97] duration-150 text-white ${
          isRunning
            ? 'bg-warning hover:bg-[#e68900] shadow-lg shadow-warning/20'
            : isIdle
              ? 'bg-[#156390] hover:bg-[#1a7ab5] shadow-lg shadow-[#156390]/30 hover:shadow-[#156390]/50'
              : 'bg-[#156390] hover:bg-[#1a7ab5] shadow-lg shadow-black/30'
        }`}
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
