import { useState, useEffect } from 'react'
import type { TaskSubtask } from '../../supabase/types'
import { formatMinutes } from '../../lib/formatters'
import { findNextTask } from '../../lib/findNextTask'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'

interface Props {
  subtasks: TaskSubtask[]
  onToggle: (id: string, status: string) => void
  onDelete: (id: string) => void
  onEdit?: (st: TaskSubtask) => void
  onReorder?: (ids: string[]) => void
  onSetDependency?: (id: string, dependsOn: string | null) => void
  onStartPomodoro?: (st: TaskSubtask) => void
  onShowHistory?: (st: TaskSubtask) => void
  onBulkImport?: (st: TaskSubtask) => void
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
      result.push({ node, depth, hasChildren: children.length > 0, isLast: i === list.length - 1 })
      if (children.length > 0) walk(children, depth + 1)
    }
  }

  walk(roots, 0)
  return result
}

function sumSubtree(subtasks: TaskSubtask[], parentId: string): { estimated: number; completed: number } {
  const children = subtasks.filter((s) => s.depends_on === parentId)
  let estimated = 0
  let completed = 0
  for (const c of children) {
    estimated += c.estimated_minutes
    completed += c.completed_minutes
    const sub = sumSubtree(subtasks, c.id)
    estimated += sub.estimated
    completed += sub.completed
  }
  return { estimated, completed }
}

export function SubtaskList({ subtasks, onToggle, onDelete, onEdit, onReorder, onSetDependency, onStartPomodoro, onShowHistory, onBulkImport }: Props) {
  const doneCount = subtasks.filter((s) => s.status === 'completed').length
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [overHeader, setOverHeader] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [links, setLinks] = useState<any[]>([])
  const user = useUser()

  useEffect(() => {
    if (!user || subtasks.length === 0) return
    const ids = subtasks.map((s) => s.id)
    supabase.from('task_pomodoro_links').select('subtask_id, minutes').eq('user_id', user.id).in('subtask_id', ids).then(({ data }: any) => {
      if (data) setLinks(data)
    })
  }, [user, subtasks])

  const tree = buildTree(subtasks)
  const nextTask = findNextTask(subtasks)

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
    setDragIdx(idx)
  }
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverIdx(idx)
  }
  const handleDrop = (e: React.DragEvent, idx: number) => {
    if (dragIdx === null || dragIdx === idx) return
    const dragged = tree[dragIdx]?.node
    const target = tree[idx]?.node
    if (!dragged || !target) return

    if (e.shiftKey) {
      if (onSetDependency) {
        const newParent = target.id === dragged.depends_on ? null : target.id
        onSetDependency(dragged.id, newParent)
      }
    } else if (onReorder) {
      const flat = tree.map((t) => t.node)
      const [moved] = flat.splice(dragIdx, 1)
      flat.splice(idx, 0, moved)
      onReorder(flat.map((s) => s.id))
    }

    setDragIdx(null)
    setOverIdx(null)
  }
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null); setOverHeader(false) }

  const handleHeaderDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverHeader(true)
  }

  const handleHeaderDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setOverHeader(false)
    if (dragIdx === null || !onSetDependency) return
    const dragged = tree[dragIdx]?.node
    if (!dragged || !dragged.depends_on) { setDragIdx(null); return }
    onSetDependency(dragged.id, null)
    setDragIdx(null)
  }

  return (
    <div>
      <div className={`flex items-center justify-between mb-3 px-2 -mx-2 rounded-lg transition-colors ${overHeader ? 'bg-accent/10 ring-1 ring-accent/30' : ''}`}
        onDragOver={handleHeaderDragOver}
        onDragLeave={() => setOverHeader(false)}
        onDrop={handleHeaderDrop}
      >
        <span className="text-[11px] font-medium text-text-secondary">Tareas <span className="text-white">{doneCount}</span><span className="text-text-secondary/40">/{subtasks.length}</span></span>
        {overHeader && <span className="text-[10px] text-accent">Suelta para convertir en tarea principal</span>}
      </div>

      {subtasks.length === 0 ? (
        <div className="text-center text-text-secondary text-xs py-8 bg-secondary/30 rounded-lg border border-dashed border-white/5">
          <div className="text-lg mb-1">📝</div>
          <p>Añade tareas específicas para trabajar en esta meta</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tree.map(({ node: st, depth }, idx) => {
            const isDragging = dragIdx === idx
            const isOver = overIdx === idx
            const isDone = st.status === 'completed'
            const isNext = nextTask?.id === st.id && !isDone
            const isChecklist = st.estimated_minutes === 0
            const diff = DIFFICULTY_BADGE[st.difficulty] || DIFFICULTY_BADGE.normal
            const depSubtask = st.depends_on ? subtasks.find((s) => s.id === st.depends_on) : null
            const isLocked = !!depSubtask && depSubtask.status !== 'completed'
            const subtree = isChecklist ? sumSubtree(subtasks, st.id) : null
            const displayEstimated = isChecklist && subtree && (subtree.estimated > 0 || subtree.completed > 0) ? subtree.estimated : st.estimated_minutes
            const displayCompleted = isChecklist && subtree && (subtree.estimated > 0 || subtree.completed > 0) ? subtree.completed : st.completed_minutes
            const displayPct = displayEstimated > 0 ? Math.min(100, Math.round((displayCompleted / displayEstimated) * 100)) : 0
            const bestPct = displayEstimated > 0 ? Math.max(displayPct, Math.min(100, Math.ceil((links.filter((l) => l.subtask_id === st.id && l.minutes >= 1).reduce((max, l) => Math.max(max, l.minutes || 0), 0) / displayEstimated) * 100))) : displayPct

            return (
              <div key={st.id} className="relative">
                <div
                  draggable
                   onDragStart={(e) => handleDragStart(e, idx)}
                   onDragOver={(e) => handleDragOver(e, idx)}
                   onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  style={{ marginLeft: depth * 28, borderLeft: isDone ? '3px solid transparent' : `3px solid ${diff.color}40` }}
                  className={`group rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                    isDragging ? 'opacity-40 border-accent/50' : ''
                  } ${isOver ? 'border-accent/50 ring-1 ring-accent/30' : ''} ${
                    isNext ? 'border-accent/60 ring-2 ring-accent/30 shadow-lg shadow-accent/15 bg-accent/[0.07]' : isDone ? 'bg-white/[0.02] border-white/5 opacity-55' : 'bg-secondary/70 border-white/[0.06] hover:bg-secondary hover:border-white/10'
                  }`}
                >
                  <div className="px-3 py-2.5">
                    <div className="flex items-start gap-1">
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
                          {isNext && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-accent text-white font-bold uppercase tracking-wider shrink-0">Siguiente</span>}
                          <span className="text-xs shrink-0" title={diff.icon}>{diff.icon}</span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 text-xs w-full">
                          {(displayEstimated === 0 && displayCompleted === 0) ? (
                            <span className="text-text-secondary/40">—</span>
                          ) : (
                            <>
                              <span className="tabular-nums font-medium shrink-0" style={{ color: isDone ? '#28C76F' : '#a0a0b0' }}>
                                {formatMinutes(displayCompleted)}/{formatMinutes(displayEstimated)}
                              </span>
                              <span className="text-white/20 shrink-0">|</span>
                              <span className="tabular-nums text-text-secondary/60 shrink-0">⌛ {formatMinutes(displayEstimated)}</span>
                              <div className="w-[75%] bg-white/5 rounded-full h-2 overflow-hidden ring-1 ring-white/5 relative">
                                <div className="h-full rounded-full transition-all duration-700"
                                  style={{ width: `${bestPct}%`, background: bestPct >= 100 ? 'linear-gradient(90deg, #28C76F, #81E6A0)' : bestPct >= 50 ? 'linear-gradient(90deg, #FF9800, #FFB74D)' : 'linear-gradient(90deg, var(--accent), #b388ff)' }} />
                                {bestPct > displayPct && (
                                  <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/60">{displayPct}% · mejor {bestPct}%</div>
                                )}
                                {bestPct === displayPct && (
                                <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${displayPct >= 50 ? 'text-white' : 'text-text-secondary'}`}>{displayPct}%</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        {!isChecklist && (
                          <button onClick={() => onStartPomodoro?.(st)}
                            className={`w-auto h-7 flex items-center gap-1 px-2 rounded-md text-[10px] font-medium transition-all ${isNext ? 'bg-accent text-white shadow-sm shadow-accent/30 hover:opacity-90' : 'bg-secondary border border-white/[0.06] text-text-secondary hover:bg-accent/20 hover:border-accent/30 hover:text-accent'}`}>
                            {isNext ? '▶ Empezar' : `▶ ${formatMinutes(st.estimated_minutes)}`}
                          </button>
                        )}
                        <div className={`flex items-center gap-0.5 ${isDone ? 'opacity-0 group-hover:opacity-100' : ''}`}>
                          {!isDone && (
                            <>
                              <button onClick={() => onEdit?.(st)} className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-text-secondary hover:bg-accent/20 hover:border-accent/30 hover:text-accent transition-all" title="Editar">✏️</button>
                              <button onClick={() => onBulkImport?.(st)} className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-text-secondary hover:bg-accent/20 hover:border-accent/30 hover:text-accent transition-all" title="Importar hijas">📥</button>
                              <button onClick={() => onShowHistory?.(st)} className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-text-secondary hover:bg-accent/20 hover:border-accent/30 hover:text-accent transition-all" title="Historial">🕐</button>
                            </>
                          )}
                          <button onClick={() => setDeleteConfirmId(st.id)} className="w-7 h-7 flex items-center justify-center rounded-md text-xs bg-secondary border border-white/[0.06] text-danger/50 hover:bg-danger/10 hover:border-danger/30 hover:text-danger transition-all" title="Eliminar">🗑️</button>
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

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-card rounded-xl border border-white/10 p-5 w-full max-w-xs mx-4 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-3xl mb-3">🗑️</div>
            <h3 className="text-sm font-semibold text-white mb-1">¿Eliminar tarea?</h3>
            <p className="text-[11px] text-text-secondary mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium bg-secondary hover:bg-white/10 text-text-secondary hover:text-white transition-all">
                Cancelar
              </button>
              <button onClick={() => { onDelete(deleteConfirmId); setDeleteConfirmId(null) }}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all"
                style={{ backgroundColor: 'var(--danger)' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}