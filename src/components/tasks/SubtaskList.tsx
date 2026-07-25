import { useState } from 'react'
import type { TaskSubtask } from '../../supabase/types'

interface Props {
  subtasks: TaskSubtask[]
  onToggle: (id: string, status: string) => void
  onDelete: (id: string) => void
  onEdit?: (st: TaskSubtask) => void
  onReorder?: (ids: string[]) => void
  onStartPomodoro?: (st: TaskSubtask) => void
}

const DIFFICULTY_BADGE: Record<string, { icon: string; color: string }> = {
  easy: { icon: '🟢', color: '#4CAF50' },
  normal: { icon: '🟡', color: '#FF9800' },
  hard: { icon: '🔴', color: '#FF6B6B' },
}

function buildTree(items: TaskSubtask[]): { node: TaskSubtask; depth: number; hasChildren: boolean; isLast: boolean }[] {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order)
  const map = new Map<string, TaskSubtask[]>()
  const roots: TaskSubtask[] = []

  for (const s of sorted) {
    if (s.depends_on && sorted.some((x) => x.id === s.depends_on)) {
      const kids = map.get(s.depends_on) || []
      kids.push(s)
      map.set(s.depends_on, kids)
    } else {
      roots.push(s)
    }
  }

  const result: { node: TaskSubtask; depth: number; hasChildren: boolean; isLast: boolean }[] = []

  function walk(list: TaskSubtask[], depth: number) {
    for (let i = 0; i < list.length; i++) {
      const node = list[i]
      const children = map.get(node.id) || []
      const hasChildren = children.length > 0
      const isLast = i === list.length - 1
      result.push({ node, depth, hasChildren, isLast })
      if (hasChildren) walk(children, depth + 1)
    }
  }

  walk(roots, 0)
  return result
}

export function SubtaskList({ subtasks, onToggle, onDelete, onEdit, onReorder, onStartPomodoro }: Props) {
  const doneCount = subtasks.filter((s) => s.status === 'completed').length
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  const tree = buildTree(subtasks)

  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setOverIdx(idx) }
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx || !onReorder) return
    const flat = tree.map((t) => t.node)
    const [moved] = flat.splice(dragIdx, 1)
    flat.splice(idx, 0, moved)
    onReorder(flat.map((s) => s.id))
    setDragIdx(null)
    setOverIdx(null)
  }
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null) }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-text-secondary">Tareas <span className="text-white">{doneCount}</span><span className="text-text-secondary/40">/{subtasks.length}</span></span>
      </div>

      {subtasks.length === 0 ? (
        <div className="text-center text-text-secondary text-xs py-8 bg-secondary/30 rounded-lg border border-dashed border-white/5">
          <div className="text-lg mb-1">📝</div>
          <p>Añade tareas específicas para trabajar en esta meta</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tree.map(({ node: st, depth, hasChildren, isLast }, idx) => {
            const isDragging = dragIdx === idx
            const isOver = overIdx === idx
            const isDone = st.status === 'completed'
            const isChecklist = st.estimated_minutes === 0
            const pct = st.estimated_minutes > 0 ? Math.min(100, Math.round((st.completed_minutes / st.estimated_minutes) * 100)) : 0
            const diff = DIFFICULTY_BADGE[st.difficulty] || DIFFICULTY_BADGE.normal
            const depSubtask = st.depends_on ? subtasks.find((s) => s.id === st.depends_on) : null
            const isLocked = !!depSubtask && depSubtask.status !== 'completed'

            return (
              <div key={st.id} className="relative">
                {depth > 0 && (
                  <div className="absolute left-[18px] top-0 bottom-0 w-px bg-white/5" />
                )}
                <div
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  style={{ marginLeft: depth * 28 }}
                  className={`group rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                    isDragging ? 'opacity-40 border-accent/50' : ''
                  } ${isOver ? 'border-accent/50 ring-1 ring-accent/30' : ''} ${
                    isDone ? 'bg-white/[0.02] border-white/5 opacity-55' : 'bg-secondary/70 border-white/[0.06] hover:bg-secondary hover:border-white/10'
                  }`}
                >
                  <div className="px-3 py-2.5">
                    <div className="flex items-start gap-1.5">
                      {depth > 0 && (
                        <div className="mt-3 shrink-0 flex flex-col items-center" style={{ width: 12 }}>
                          <div className="w-2 h-px bg-white/20" />
                        </div>
                      )}
                      <span className="mt-1.5 text-text-secondary/20 group-hover:text-text-secondary/40 transition-colors cursor-grab active:cursor-grabbing text-xs select-none shrink-0">⠿</span>
                      <button
                        onClick={() => !isLocked && onToggle(st.id, isDone ? 'pending' : 'completed')}
                        className={`mt-0.5 w-4 h-4 rounded-sm flex items-center justify-center text-xs shrink-0 transition-all ${isLocked ? 'opacity-30 cursor-not-allowed' : ''} ${
                          isDone ? 'bg-success/20 text-success' : isChecklist ? 'border border-white/30 hover:border-accent' : st.completed_minutes > 0 ? 'bg-warning/20 text-warning' : 'border border-white/20 hover:border-accent'
                        }`}
                      >
                        {isLocked ? '🔒' : isDone ? '✓' : isChecklist ? '◯' : st.completed_minutes > 0 ? '◐' : ''}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${isDone ? 'line-through text-text-secondary/60' : isLocked ? 'text-text-secondary/60' : 'text-white'}`}>
                            {st.name}
                          </span>
                          <span className="text-xs shrink-0" title={diff.icon}>{diff.icon}</span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 text-xs w-full">
                          {isChecklist ? (
                            <span className="text-text-secondary/40">—</span>
                          ) : (
                            <>
                              <span className="tabular-nums font-medium shrink-0" style={{ color: isDone ? '#28C76F' : '#a0a0b0' }}>
                                {st.completed_minutes}/{st.estimated_minutes}min
                              </span>
                              <span className="text-white/20 shrink-0">|</span>
                              <span className="tabular-nums text-text-secondary/60 shrink-0">⌛ {st.completed_minutes + st.estimated_minutes}</span>
                              <div className="w-[60%] bg-white/5 rounded-full h-2 overflow-hidden ring-1 ring-white/5 relative">
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%`, background: pct >= 100 ? 'linear-gradient(90deg, #28C76F, #81E6A0)' : pct >= 50 ? 'linear-gradient(90deg, #FF9800, #FFB74D)' : 'linear-gradient(90deg, var(--accent), #b388ff)' }} />
                                <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${pct >= 50 ? 'text-white' : 'text-text-secondary'}`}>{pct}%</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        {!isChecklist && (
                          <button onClick={() => onStartPomodoro?.(st)} className="w-auto h-7 flex items-center gap-1 px-2 rounded-md text-[10px] font-medium bg-secondary border border-white/[0.06] text-text-secondary hover:bg-accent/20 hover:border-accent/30 hover:text-accent transition-all" title="Iniciar Pomodoro">▶ {st.estimated_minutes}min</button>
                        )}
                        <div className={`flex items-center gap-0.5 ${isDone ? 'opacity-0 group-hover:opacity-100' : ''}`}>
                          {!isDone && (
                            <>
                              <button onClick={() => onEdit?.(st)} className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-text-secondary hover:bg-accent/20 hover:border-accent/30 hover:text-accent transition-all" title="Editar">✏️</button>
                              <button className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-text-secondary hover:bg-accent/20 hover:border-accent/30 hover:text-accent transition-all" title="Historial">🕐</button>
                            </>
                          )}
                          <button onClick={() => onDelete(st.id)} className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-danger/50 hover:bg-danger/10 hover:border-danger/30 hover:text-danger transition-all" title="Eliminar">🗑️</button>
                        </div>
                      </div>
                    </div>

                    {isDone && (
                      <div className="mt-1.5 ml-7">
                        <span className="text-[10px] text-success/60 italic">Completada</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}