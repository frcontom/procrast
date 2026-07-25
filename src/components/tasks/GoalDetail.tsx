import type { TaskGoal, TaskSubtask } from '../../supabase/types'

export function GoalDetail({ goal, subtasks }: { goal: TaskGoal; subtasks: TaskSubtask[] }) {
  const totalEstimated = subtasks.reduce((a, s) => a + s.estimated_minutes, 0) || goal.estimated_minutes
  const totalCompleted = subtasks.reduce((a, s) => a + s.completed_minutes, 0)
  const progressPct = Math.min(100, Math.round((totalCompleted / Math.max(1, totalEstimated)) * 100))
  const doneCount = subtasks.filter((s) => s.status === 'completed').length

  const priorityColors = { critical: '#FF6B6B', high: '#FF9800', normal: '#A66CFF', low: '#4CAF50' }

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">{goal.name}</h2>
          {goal.description && (
            <p className="text-text-secondary text-sm mt-0.5">{goal.description}</p>
          )}
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: priorityColors[goal.priority] + '30', color: priorityColors[goal.priority] }}>
          {goal.priority === 'critical' ? 'Crítica' : goal.priority === 'high' ? 'Alta' : goal.priority === 'normal' ? 'Normal' : 'Baja'}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4 text-xs text-text-secondary">
        <span>📅 {goal.deadline}</span>
        <span>⏱ {totalEstimated} min</span>
        <span>✓ {doneCount}/{subtasks.length} tareas</span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-text-secondary">Progreso</span>
          <span className="text-accent font-medium">{progressPct}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      </div>
    </div>
  )
}
