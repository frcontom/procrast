import type { TaskGoal } from '../../supabase/types'

interface Props {
  goals: TaskGoal[]
  selectedId: string | null
  onSelect: (id: string) => void
  onEdit: (goal: TaskGoal) => void
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#FF6B6B',
  high: '#FF9800',
  normal: '#60A5FA',
  low: '#4CAF50',
}

export function GoalList({ goals, selectedId, onSelect, onEdit }: Props) {
  const sorted = [...goals].sort((a, b) => {
    const order = { critical: 0, high: 1, normal: 2, low: 3 }
    const pa = a.priority && order[a.priority] !== undefined ? order[a.priority] : 2
    const pb = b.priority && order[b.priority] !== undefined ? order[b.priority] : 2
    if (pa !== pb) return pa - pb
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  })

  if (sorted.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-white/10 p-4 text-center text-text-secondary text-xs">
        <div className="text-lg mb-2">🎯</div>
        Crea tu primera meta para comenzar
      </div>
    )
  }

  return (
    <div id="goal-list" className="bg-card rounded-xl border border-white/10 overflow-hidden">
      <div id="goal-list-header" className="px-3 py-2 border-b border-white/5">
        <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">Metas activas</span>
      </div>
      <div id="goal-list-items" className="divide-y divide-white/5 max-h-[60vh] overflow-y-auto">
        {sorted.map((goal) => {
          return (
            <div
              key={goal.id}
              id={`goal-item-${goal.id}`}
              onClick={() => onSelect(goal.id)}
              className={`flex items-stretch cursor-pointer transition-colors hover:bg-white/5 ${selectedId === goal.id ? 'bg-white/10' : ''}`}
            >
              <div id={`goal-priority-bar-${goal.id}`} className="w-1 shrink-0" style={{ backgroundColor: PRIORITY_COLORS[goal.priority] || '#60A5FA' }} />
              <div className="flex-1 px-3 py-2.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{goal.icon && !goal.icon.startsWith('bi-') ? goal.icon : '🎯'}</span>
                  <span className="text-xs font-medium truncate">{goal.name}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-text-secondary">{goal.deadline}</span>
                  <button onClick={(e) => { e.stopPropagation(); onEdit(goal) }}
                    className="text-[10px] text-text-secondary/50 hover:text-text-secondary transition-colors ml-auto">✏️</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
