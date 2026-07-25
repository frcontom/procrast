import type { TaskSubtask } from '../../supabase/types'

interface Props {
  subtasks: TaskSubtask[]
  onToggle: (id: string, status: string) => void
  onDelete: (id: string) => void
}

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  easy: { label: '🟢', color: '#4CAF50' },
  normal: { label: '🟡', color: '#FF9800' },
  hard: { label: '🔴', color: '#FF6B6B' },
}

export function SubtaskList({ subtasks, onToggle, onDelete }: Props) {
  const sorted = [...subtasks].sort((a, b) => a.sort_order - b.sort_order)

  if (sorted.length === 0) {
    return (
      <div className="text-center text-text-secondary text-[10px] py-4">
        📝 Añade tareas específicas para trabajar en esta meta
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {sorted.map((st) => {
        const isDone = st.status === 'completed'
        const pct = st.estimated_minutes > 0 ? Math.min(100, Math.round((st.completed_minutes / st.estimated_minutes) * 100)) : 0
        const diff = DIFFICULTY_CONFIG[st.difficulty] || DIFFICULTY_CONFIG.normal
        const statusIcon = isDone ? '✅' : st.completed_minutes > 0 ? '◐' : '◯'

        return (
          <div key={st.id} className={`bg-secondary rounded-lg p-2.5 transition-colors ${isDone ? 'opacity-60' : 'hover:bg-white/5'}`}>
            <div className="flex items-center gap-2">
              <button onClick={() => onToggle(st.id, isDone ? 'pending' : 'completed')} className="text-sm shrink-0">
                {statusIcon}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-medium truncate ${isDone ? 'line-through text-text-secondary' : ''}`}>{st.name}</span>
                  <span className="text-[10px]" title={diff.label}>{diff.label}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-secondary mt-0.5">
                  <span>{st.completed_minutes}/{st.estimated_minutes}min</span>
                  <span>{pct}%</span>
                  {st.completed_minutes > 0 && st.estimated_minutes > 0 && <span>⌛ {st.completed_minutes + st.estimated_minutes}min real</span>}
                </div>
              </div>
              <button onClick={() => onDelete(st.id)} className="text-[10px] text-danger/50 hover:text-danger transition-colors shrink-0">🗑️</button>
            </div>
            {!isDone && (
              <div className="mt-1.5 w-full bg-[var(--bg-primary)] rounded-full h-1">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
