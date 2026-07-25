import type { TaskSubtask } from '../../supabase/types'

interface Props {
  subtasks: TaskSubtask[]
  onToggle: (id: string, status: string) => void
  onDelete: (id: string) => void
}

const DIFFICULTY_BADGE: Record<string, { icon: string; color: string }> = {
  easy: { icon: '🟢', color: '#4CAF50' },
  normal: { icon: '🟡', color: '#FF9800' },
  hard: { icon: '🔴', color: '#FF6B6B' },
}

export function SubtaskList({ subtasks, onToggle, onDelete }: Props) {
  const sorted = [...subtasks].sort((a, b) => a.sort_order - b.sort_order)
  const doneCount = sorted.filter((s) => s.status === 'completed').length

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-text-secondary">Tareas ✅ {doneCount}/{sorted.length}</span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center text-text-secondary text-[10px] py-4">
          📝 Añade tareas específicas para trabajar en esta meta
        </div>
      ) : (
        <div className="space-y-1">
          {sorted.map((st) => {
            const isDone = st.status === 'completed'
            const pct = st.estimated_minutes > 0 ? Math.min(100, Math.round((st.completed_minutes / st.estimated_minutes) * 100)) : 0
            const diff = DIFFICULTY_BADGE[st.difficulty] || DIFFICULTY_BADGE.normal

            let statusIcon = '◯'
            if (isDone) statusIcon = '✅'
            else if (st.completed_minutes > 0) statusIcon = '◐'

            return (
              <div key={st.id} className={`bg-secondary rounded-lg p-2.5 transition-colors ${isDone ? 'opacity-60' : 'hover:bg-white/5'}`}>
                <div className="flex items-center gap-2">
                  <button onClick={() => onToggle(st.id, isDone ? 'pending' : 'completed')} className="text-sm shrink-0">
                    {statusIcon}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-medium truncate ${isDone ? 'line-through text-text-secondary' : ''}`}>{st.name}</span>
                      <span className="text-[10px]" title={diff.icon}>{diff.icon}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-text-secondary mt-0.5 flex-wrap">
                      <span>{st.completed_minutes}/{st.estimated_minutes}min</span>
                      <span>{pct}%</span>
                      {st.completed_minutes > 0 && st.estimated_minutes > 0 && <span>⌛ {st.completed_minutes + st.estimated_minutes}min real</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isDone && (
                      <>
                        <button className="text-[10px] text-text-secondary/60 hover:text-white transition-colors px-1" title="Iniciar Pomodoro">▶</button>
                        <button className="text-[10px] text-text-secondary/30 hover:text-text-secondary transition-colors" title="Subir">▲</button>
                        <button className="text-[10px] text-text-secondary/30 hover:text-text-secondary transition-colors" title="Bajar">▼</button>
                        <button className="text-[10px] text-text-secondary/60 hover:text-white transition-colors" title="Editar">✏️</button>
                        <button className="text-[10px] text-text-secondary/60 hover:text-white transition-colors" title="Historial">🕐</button>
                      </>
                    )}
                    <button onClick={() => onDelete(st.id)} className="text-[10px] text-danger/50 hover:text-danger transition-colors" title="Eliminar">🗑️</button>
                  </div>
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
      )}
    </div>
  )
}
