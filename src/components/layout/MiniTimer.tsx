import { useTimerStore } from '../../store/useTimerStore'
import { sessionManager } from '../../lib/sessionManager'
import { formatTime } from '../../lib/formatters'

export function MiniTimer() {
  const state = useTimerStore((s) => s.state)
  const remainingSeconds = useTimerStore((s) => s.remainingSeconds)
  const durationMinutes = useTimerStore((s) => s.durationMinutes)
  const sessionName = useTimerStore((s) => s.sessionName)
  const progressPercent = useTimerStore((s) => s.progressPercent)

  if (state === 'IDLE' || state === 'FINISHED' || state === 'CANCELLED') return null

  const totalSeconds = durationMinutes * 60
  const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0

  return (
    <div className="px-3 py-4 border-t border-white/10">
      <div className="bg-card rounded-xl border border-white/[0.06] p-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${state === 'RUNNING' ? 'bg-[#28C76F] animate-pulse' : 'bg-[#FF9F43]'}`} />
            <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
              {state === 'RUNNING' ? 'En foco' : 'En pausa'}
            </span>
          </div>
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums tracking-tight text-white">
            {formatTime(remainingSeconds)}
          </div>
        </div>

        {/* Mini bar */}
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: state === 'RUNNING'
                ? 'linear-gradient(90deg, #A66CFF, #b388ff)'
                : '#FF9F43',
            }}
          />
        </div>

        {/* Session name */}
        {sessionName && (
          <div className="text-[10px] text-text-secondary text-center truncate">
            {sessionName}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              if (state === 'RUNNING') sessionManager.pause()
              else sessionManager.resume()
            }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium bg-accent/20 text-accent hover:bg-accent/30 transition-all active:scale-[0.97]"
          >
            {state === 'RUNNING' ? '⏸ Pausar' : '▶ Reanudar'}
          </button>
          <button
            onClick={() => sessionManager.cancel()}
            className="flex items-center justify-center px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-danger/10 text-danger/70 hover:bg-danger/20 hover:text-danger transition-all active:scale-[0.97]"
            title="Cancelar sesión"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
