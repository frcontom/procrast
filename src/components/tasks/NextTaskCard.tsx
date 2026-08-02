import type { TaskSubtask } from '../../supabase/types'
import { formatMinutes } from '../../lib/formatters'

interface Props {
  task: TaskSubtask
  totalPending: number
  goalName: string
  onStart: (st: TaskSubtask) => void
  onComplete: (id: string) => void
}

const DIFFICULTY: Record<string, { icon: string; label: string; color: string }> = {
  easy: { icon: '🟢', label: 'Fácil', color: '#4CAF50' },
  normal: { icon: '🟡', label: 'Normal', color: '#FF9800' },
  hard: { icon: '🔴', label: 'Difícil', color: '#FF6B6B' },
}

export function NextTaskCard({ task, totalPending, goalName, onStart, onComplete }: Props) {
  const isChecklist = task.estimated_minutes === 0
  const diff = DIFFICULTY[task.difficulty] || DIFFICULTY.normal
  const pct = task.estimated_minutes > 0 ? Math.min(100, Math.round((task.completed_minutes / task.estimated_minutes) * 100)) : 0

  return (
    <div className="relative overflow-hidden rounded-2xl mb-4"
      style={{
        background: 'linear-gradient(135deg, rgba(166,108,255,0.18), rgba(21,99,144,0.15))',
        border: '1px solid rgba(166,108,255,0.45)',
        boxShadow: '0 0 30px rgba(166,108,255,0.18)',
      }}>
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }} />

      <div className="relative p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[10px] font-bold uppercase tracking-[1px] text-accent flex items-center gap-1">
            🎯 Tu siguiente tarea
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full text-text-secondary bg-white/10">{goalName}</span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold text-white leading-snug">{task.name}</div>
            {task.description ? (
              <div className="text-xs text-text-secondary mt-1 line-clamp-2">{task.description}</div>
            ) : null}
          </div>
          <span className="text-xl shrink-0" style={{ color: diff.color }}>{diff.icon}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          <div className="bg-black/20 rounded-lg px-2.5 py-1.5 text-center">
            <div className="text-sm font-bold text-white">{isChecklist ? '—' : formatMinutes(task.estimated_minutes)}</div>
            <div className="text-[9px] text-text-secondary uppercase tracking-wider">Estimado</div>
          </div>
          <div className="bg-black/20 rounded-lg px-2.5 py-1.5 text-center">
            <div className="text-sm font-bold text-white">{pct}%</div>
            <div className="text-[9px] text-text-secondary uppercase tracking-wider">Avance</div>
          </div>
          <div className="bg-black/20 rounded-lg px-2.5 py-1.5 text-center">
            <div className="text-sm font-bold text-white" style={{ color: diff.color }}>{diff.icon} {diff.label}</div>
            <div className="text-[9px] text-text-secondary uppercase tracking-wider">Dificultad</div>
          </div>
          <div className="bg-black/20 rounded-lg px-2.5 py-1.5 text-center">
            <div className="text-sm font-bold text-white">{totalPending}</div>
            <div className="text-[9px] text-text-secondary uppercase tracking-wider">Pendientes</div>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-text-secondary mb-1">
            <span>{isChecklist ? 'Checklist' : 'Pomodoro'}</span>
            <span>{task.completed_minutes}/{task.estimated_minutes || '—'} min</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), #b388ff)' }} />
          </div>
        </div>

        <button
          onClick={() => isChecklist ? onComplete(task.id) : onStart(task)}
          className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
          style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 16px rgba(166,108,255,0.35)' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}>
          {isChecklist ? '☑ Marcar como hecha' : `▶ Empezar ahora (${formatMinutes(task.estimated_minutes)})`}
        </button>
      </div>
    </div>
  )
}
