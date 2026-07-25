import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import type { TaskGoal, TaskSubtask } from '../../supabase/types'
import { calculateRhythm } from '../../lib/rhythmCalculator'
import { SubtaskList } from './SubtaskList'
import { SubtaskForm } from './SubtaskForm'
import { HexCalendar } from './HexCalendar'

interface Props {
  goal: TaskGoal
  subtasks: TaskSubtask[]
  onSubtaskToggle: (id: string, status: string) => void
  onSubtaskDelete: (id: string) => void
  onAddSubtask: (data: any) => void
  onEditGoal: () => void
}

const PRIORITY_LABELS: Record<string, string> = { critical: 'Crítica', high: 'Alta', normal: 'Normal', low: 'Baja' }
const PRIORITY_COLORS: Record<string, string> = { critical: '#FF6B6B', high: '#FF9800', normal: '#60A5FA', low: '#4CAF50' }

export function GoalDetail({ goal, subtasks, onSubtaskToggle, onSubtaskDelete, onAddSubtask, onEditGoal }: Props) {
  const user = useUser()
  const [links, setLinks] = useState<any[]>([])
  const [todayMin, setTodayMin] = useState(0)

  const totalEstimated = goal.estimated_minutes
  const totalCompleted = subtasks.reduce((a, s) => a + s.completed_minutes, 0)
  const pct = Math.min(100, Math.round((totalCompleted / Math.max(1, totalEstimated)) * 100))
  const doneCount = subtasks.filter((s) => s.status === 'completed').length

  const rhythm = calculateRhythm({
    startDate: new Date(goal.start_date || goal.created_at),
    deadline: new Date(goal.deadline),
    estimatedMinutes: totalEstimated,
    completedMinutes: totalCompleted,
  })

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('task_pomodoro_links').select('*').eq('user_id', user.id).in('subtask_id', subtasks.map((s) => s.id)).gte('date', today).then(({ data }: any) => {
      if (data) setLinks(data)
    })
    supabase.from('task_pomodoro_links').select('minutes').eq('user_id', user.id).in('subtask_id', subtasks.map((s) => s.id)).gte('date', today).then(({ data }: any) => {
      if (data) setTodayMin(Math.round(data.reduce((a: number, l: any) => a + (l.minutes || 0), 0)))
    })
  }, [user, subtasks])

  const subtaskDays = links.map((l: any) => l.date)

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-white/10 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{goal.icon || '🎯'}</span>
              <span className="text-lg font-semibold">{goal.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: PRIORITY_COLORS[goal.priority] + '30', color: PRIORITY_COLORS[goal.priority] }}>
                {PRIORITY_LABELS[goal.priority]}
              </span>
              {rhythm.behind && <span className="text-[10px] px-2 py-0.5 rounded-full bg-danger/20 text-danger">⚠️ Atrasado</span>}
            </div>
            {goal.description && <p className="text-sm text-text-secondary">{goal.description}</p>}
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-text-secondary">Progreso</span>
            <span className="text-accent font-medium">{pct}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-3">
          {[
            { label: 'Completado', value: `${totalCompleted}min` },
            { label: 'Meta total', value: `${totalEstimated}min` },
            { label: 'Meta/día', value: `${rhythm.rhythmDaily}min` },
            { label: 'Faltan', value: `${rhythm.daysRemaining}d` },
            { label: 'Hecho hoy', value: `${todayMin}min` },
          ].map((s) => (
            <div key={s.label} className="bg-secondary/50 rounded-lg p-2 text-center">
              <div className="text-sm font-bold text-white">{s.value}</div>
              <div className="text-[9px] text-text-secondary uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        {rhythm.behind && (
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 text-xs">
            <span className="text-danger font-medium">🔴 ATRASADO</span>
            <span className="text-text-secondary ml-1">
              — Deberías tener {rhythm.expectedNow}min, llevas {totalCompleted}min. Necesitas {rhythm.neededDaily}min/día.
            </span>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Subtareas ({doneCount}/{subtasks.length})</span>
          <button onClick={onEditGoal} className="text-[10px] text-text-secondary hover:text-white transition-colors">✏️ Editar meta</button>
        </div>

        <SubtaskList subtasks={subtasks} onToggle={onSubtaskToggle} onDelete={onSubtaskDelete} />
        <SubtaskForm onSave={onAddSubtask} />
      </div>

      <div className="bg-card rounded-xl border border-white/10 p-4">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">📅 Calendario</span>
        <HexCalendar
          startDate={goal.start_date || goal.created_at.slice(0, 10)}
          deadline={goal.deadline}
          estimatedMinutes={totalEstimated}
          completedMinutes={totalCompleted}
          subtaskDays={subtaskDays}
        />
      </div>

      {goal.notes && (
        <div className="bg-card rounded-xl border border-white/10 p-4">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">📝 Notas</span>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{goal.notes}</p>
        </div>
      )}
    </div>
  )
}
