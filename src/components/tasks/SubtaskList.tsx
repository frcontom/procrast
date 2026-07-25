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
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-text-secondary">Tareas <span className="text-white">{doneCount}</span><span className="text-text-secondary/40">/{sorted.length}</span></span>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center text-text-secondary text-xs py-8 bg-secondary/30 rounded-lg border border-dashed border-white/5">
          <div className="text-lg mb-1">📝</div>
          <p>Añade tareas específicas para trabajar en esta meta</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {sorted.map((st) => {
            const isDone = st.status === 'completed'
            const pct = st.estimated_minutes > 0 ? Math.min(100, Math.round((st.completed_minutes / st.estimated_minutes) * 100)) : 0
            const diff = DIFFICULTY_BADGE[st.difficulty] || DIFFICULTY_BADGE.normal

            return (
              <div
                key={st.id}
                className={`group rounded-lg border transition-all ${
                  isDone
                    ? 'bg-white/[0.02] border-white/5 opacity-55'
                    : 'bg-secondary/70 border-white/[0.06] hover:bg-secondary hover:border-white/10'
                }`}
              >
                <div className="px-3 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => onToggle(st.id, isDone ? 'pending' : 'completed')}
                      className={`mt-0.5 w-4 h-4 rounded-sm flex items-center justify-center text-xs shrink-0 transition-all ${
                        isDone
                          ? 'bg-success/20 text-success'
                          : st.completed_minutes > 0
                            ? 'bg-warning/20 text-warning'
                            : 'border border-white/20 hover:border-accent'
                      }`}
                    >
                      {isDone ? '✓' : st.completed_minutes > 0 ? '◐' : ''}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${isDone ? 'line-through text-text-secondary/60' : 'text-white'}`}>
                          {st.name}
                        </span>
                        <span className="text-xs shrink-0" title={diff.icon}>{diff.icon}</span>
                      </div>

                      <div className="flex items-center gap-2.5 mt-1 text-xs">
                        <span className="font-medium tabular-nums" style={{ color: isDone ? '#28C76F' : '#a0a0b0' }}>
                          {st.completed_minutes}/{st.estimated_minutes}min
                        </span>
                        <span className="text-text-secondary/50">·</span>
                        <span className={`font-medium tabular-nums ${pct >= 100 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-text-secondary'}`}>
                          {pct}%
                        </span>
                        {st.completed_minutes > 0 && (
                          <>
                            <span className="text-text-secondary/50">·</span>
                            <span className="text-text-secondary/60">⌛ {st.completed_minutes + st.estimated_minutes}min real</span>
                          </>
                        )}
                      </div>

                      {!isDone && (
                        <div className="mt-2 w-full bg-[var(--bg-primary)] rounded-full h-1 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#28C76F' : pct >= 50 ? '#FF9800' : 'var(--accent)' }}
                          />
                        </div>
                      )}
                    </div>

                    <div className={`flex items-center gap-0.5 shrink-0 ${isDone ? 'opacity-0 group-hover:opacity-100' : ''}`}>
                      {!isDone && (
                        <>
                          <button className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-text-secondary hover:bg-accent/20 hover:border-accent/30 hover:text-accent transition-all" title="Iniciar Pomodoro">▶</button>
                          <button className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-text-secondary/40 hover:bg-white/10 hover:border-white/20 transition-all" title="Subir">▲</button>
                          <button className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-text-secondary/40 hover:bg-white/10 hover:border-white/20 transition-all" title="Bajar">▼</button>
                          <button className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-text-secondary hover:bg-accent/20 hover:border-accent/30 hover:text-accent transition-all" title="Editar">✏️</button>
                          <button className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-text-secondary hover:bg-accent/20 hover:border-accent/30 hover:text-accent transition-all" title="Historial">🕐</button>
                        </>
                      )}
                      <button onClick={() => onDelete(st.id)} className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-danger/50 hover:bg-danger/10 hover:border-danger/30 hover:text-danger transition-all" title="Eliminar">🗑️</button>
                    </div>
                  </div>

                  {isDone && (
                    <div className="mt-1.5 ml-7">
                      <span className="text-[10px] text-success/60 italic">Completada</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
