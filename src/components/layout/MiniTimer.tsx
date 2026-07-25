import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimerStore } from '../../store/useTimerStore'
import { sessionManager } from '../../lib/sessionManager'
import { formatTime } from '../../lib/formatters'
import { SubtaskHistory } from '../tasks/SubtaskHistory'

export function MiniTimer() {
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const state = useTimerStore((s) => s.state)
  const remainingSeconds = useTimerStore((s) => s.remainingSeconds)
  const durationMinutes = useTimerStore((s) => s.durationMinutes)
  const sessionName = useTimerStore((s) => s.sessionName)
  const returnGoalId = useTimerStore((s) => s.returnGoalId)
  const currentSubtaskId = useTimerStore((s) => s.currentSubtaskId)

  if (state === 'IDLE' || state === 'FINISHED' || state === 'CANCELLED') return null

  const totalSeconds = durationMinutes * 60
  const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0
  const eta = new Date(Date.now() + remainingSeconds * 1000)
  const etaStr = eta.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  if (collapsed) {
    return (
      <div className="px-3 py-2 border-t border-white/10">
        <button onClick={() => setCollapsed(false)}
          className="flex items-center justify-center w-full gap-2 py-1.5 rounded-lg text-[10px] text-text-secondary hover:text-white hover:bg-white/5 transition-all">
          <span className={`w-2 h-2 rounded-full ${state === 'RUNNING' ? 'bg-[#28C76F] animate-pulse' : 'bg-[#FF9F43]'}`} />
          <span className="tabular-nums font-medium">{formatTime(remainingSeconds)}</span>
          <span className="text-white/20">·</span>
          <span className="text-accent/60">⤴</span>
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="px-3 py-3 border-t border-white/10">
        <div className="bg-card rounded-xl border border-white/[0.06] p-3 space-y-2.5 shadow-lg shadow-black/20">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${state === 'RUNNING' ? 'bg-[#28C76F] animate-pulse' : 'bg-[#FF9F43]'}`} />
              <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">
                {state === 'RUNNING' ? 'En foco' : 'En pausa'}
              </span>
            </div>
            <button onClick={() => setCollapsed(true)}
              className="text-text-secondary/30 hover:text-text-secondary/70 transition-colors text-xs px-1"
              title="Minimizar">
              ⤵
            </button>
          </div>

          {/* Timer with ETA tooltip */}
          <div className="text-center group relative">
            <div className="text-2xl font-bold tabular-nums tracking-tight text-white">
              {formatTime(remainingSeconds)}
            </div>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-secondary border border-white/10 rounded-lg px-2 py-1 text-[9px] text-text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
              Finaliza ~{etaStr}
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

          {/* Session name - clickable for history */}
          {sessionName && (
            <button
              onClick={() => currentSubtaskId && setShowHistory(true)}
              className={`w-full text-[10px] text-center truncate block transition-colors ${
                currentSubtaskId
                  ? 'text-accent/80 hover:text-accent cursor-pointer'
                  : 'text-text-secondary cursor-default'
              }`}
              title={currentSubtaskId ? 'Ver historial' : ''}
            >
              {returnGoalId ? '📋 ' : '◆ '}{sessionName}
            </button>
          )}

          {/* Actions: 3 buttons */}
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
            <button
              onClick={() => navigate('/focus/fullscreen')}
              className="flex items-center justify-center px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-white/5 text-text-secondary hover:bg-white/10 hover:text-white transition-all active:scale-[0.97]"
              title="Ir al Pomodoro"
            >
              ⛶
            </button>
          </div>
        </div>
      </div>

      {showHistory && currentSubtaskId && (
        <SubtaskHistory
          subtask={{ id: currentSubtaskId, name: sessionName, estimated_minutes: 0, completed_minutes: 0 } as any}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  )
}
