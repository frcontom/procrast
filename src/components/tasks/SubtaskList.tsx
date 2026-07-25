import type { TaskSubtask } from '../../supabase/types'

interface Props {
  subtasks: TaskSubtask[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

const DIFFICULTY_COLORS = { easy: '#4CAF50', normal: '#FF9800', hard: '#FF6B6B' }
const DIFFICULTY_LABELS = { easy: 'F', normal: 'N', hard: 'D' }

export function SubtaskList({ subtasks, onToggle, onDelete }: Props) {
  const sorted = [...subtasks].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="space-y-1">
      {sorted.map((st) => (
        <div key={st.id} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${st.status === 'completed' ? 'bg-secondary/30' : 'bg-secondary hover:bg-white/5'}`}>
          <button onClick={() => onToggle(st.id)}
            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${st.status === 'completed' ? 'bg-accent border-accent' : 'border-white/20 hover:border-accent'}`}>
            {st.status === 'completed' && <span className="text-white text-[8px]">✓</span>}
          </button>

          <span className={`text-xs flex-1 ${st.status === 'completed' ? 'line-through text-text-secondary' : ''}`}>
            {st.name}
          </span>

          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: DIFFICULTY_COLORS[st.difficulty] + '30', color: DIFFICULTY_COLORS[st.difficulty] }}>
            {DIFFICULTY_LABELS[st.difficulty]}
          </span>

          <span className="text-[10px] text-text-secondary">{st.estimated_minutes}min</span>

          <div className="w-16 bg-secondary rounded-full h-1.5">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, Math.round((st.completed_minutes / Math.max(1, st.estimated_minutes)) * 100))}%` }} />
          </div>

          <button onClick={() => onDelete(st.id)} className="text-danger/50 hover:text-danger text-xs transition-colors">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
