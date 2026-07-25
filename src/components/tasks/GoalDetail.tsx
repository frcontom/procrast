import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import type { TaskGoal, TaskSubtask } from '../../supabase/types'
import { calculateRhythm } from '../../lib/rhythmCalculator'
import { formatMinutes } from '../../lib/formatters'
import { SubtaskList } from './SubtaskList'
import { SubtaskForm } from './SubtaskForm'
import { SubtaskHistory } from './SubtaskHistory'
import { HexCalendar } from './HexCalendar'

interface Props {
  goal: TaskGoal
  subtasks: TaskSubtask[]
  onSubtaskToggle: (id: string, status: string) => void
  onSubtaskDelete: (id: string) => void
  onAddSubtask: (data: any) => void
  onEditSubtask?: (id: string, data: any) => void
  onReorderSubtasks?: (ids: string[]) => void
  onSetDependency?: (id: string, dependsOn: string | null) => void
  onStartPomodoro?: (st: TaskSubtask) => void
  onCleanAll?: () => void
  onImportSubtasks?: (tasks: any[]) => void
}

const PRIORITY_LABELS: Record<string, string> = { critical: 'Crítica', high: 'Alta', normal: 'Normal', low: 'Baja' }
const PRIORITY_COLORS: Record<string, string> = { critical: '#FF6B6B', high: '#FF9800', normal: '#60A5FA', low: '#4CAF50' }

export function GoalDetail({ goal, subtasks, onSubtaskToggle, onSubtaskDelete, onAddSubtask, onEditSubtask, onReorderSubtasks, onSetDependency, onStartPomodoro, onCleanAll, onImportSubtasks }: Props) {
  const user = useUser()
  const [links, setLinks] = useState<any[]>([])
  const [todayMin, setTodayMin] = useState(0)
  const [editingSubtask, setEditingSubtask] = useState<TaskSubtask | null>(null)
  const [historySubtask, setHistorySubtask] = useState<TaskSubtask | null>(null)

  const goalIcon = goal.icon && !goal.icon.startsWith('bi-') ? goal.icon : '🎯'

  const totalEstimated = subtasks.reduce((a, s) => a + s.estimated_minutes, 0) || goal.estimated_minutes
  const totalCompleted = subtasks.reduce((a, s) => a + Math.min(s.completed_minutes, s.estimated_minutes), 0)
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
    supabase.from('task_pomodoro_links').select('subtask_id, minutes, subtask_name').eq('user_id', user.id).in('subtask_id', subtasks.map((s) => s.id)).gte('date', today).then(({ data }: any) => {
      if (data) {
        const bySubtask: Record<string, number> = {}
        for (const l of data) {
          bySubtask[l.subtask_id] = (bySubtask[l.subtask_id] || 0) + (l.minutes || 0)
        }
        let capped = 0
        for (const s of subtasks) {
          const raw = bySubtask[s.id] || 0
          capped += Math.min(raw, s.estimated_minutes)
        }
        setTodayMin(Math.round(capped))
      }
    })
  }, [user, subtasks])

  const subtaskDays = links.filter((l: any) => !l.subtask_name?.includes('(cancelado)')).map((l: any) => l.date)

  return (
    <>
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-white/10 p-4">
        <div id="tk-detail-header" className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl shrink-0" style={{ color: goal.color || '#A66CFF' }}>{goalIcon}</span>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight truncate">{goal.name}</h3>
              {goal.description && <p className="text-xs text-text-secondary mt-0.5">{goal.description}</p>}
            </div>
          </div>
          <div id="tk-header-badges" className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {(goal.priority === 'critical' || goal.priority === 'high') && (
              <span id="tk-priority-badge" className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.5px] text-white"
                style={{ backgroundColor: PRIORITY_COLORS[goal.priority] }}>
                {goal.priority === 'critical' ? '🔴 Crítica' : '🟠 Alta'}
              </span>
            )}
            <span id="tk-status-badge" className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-[0.5px] text-white"
              style={{ backgroundColor: rhythm.behind ? '#EA5455' : pct >= 100 ? '#28C76F' : pct > 0 ? '#28C76F' : '#a0a0b0' }}>
              {pct >= 100 ? 'Completado' : rhythm.behind ? 'ATRASADO' : pct > 0 ? 'Al día' : 'Sin empezar'}
            </span>
          </div>
        </div>

        <div id="tk-progress-bar" className="mb-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="tabular-nums text-text-secondary">{formatMinutes(totalCompleted)}/{formatMinutes(totalEstimated)}</span>
            <span className="text-white/20">|</span>
            <span className={`tabular-nums font-medium ${pct >= 100 ? 'text-success' : 'text-accent'}`}>{pct}%</span>
            <span className="text-white/20">|</span>
            <div className="flex-1 bg-secondary rounded-full h-2">
              <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div id="tk-metrics" className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2 mb-3">
          {[
            { label: 'Completado', value: formatMinutes(totalCompleted) },
            { label: 'Meta total', value: formatMinutes(totalEstimated) },
            { label: 'Meta/día', value: formatMinutes(rhythm.rhythmDaily) },
            { label: 'Faltan', value: `${rhythm.daysRemaining}d` },
            { label: 'Hecho hoy', value: formatMinutes(todayMin) },
          ].map((s) => (
            <div key={s.label} className="bg-secondary rounded-lg p-2.5 text-center">
              <div className="text-base font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-text-secondary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div id="tk-warning-banner">
        {rhythm.behind && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs text-[#EA5455] mb-3"
            style={{ backgroundColor: 'rgba(234,84,85,0.1)', border: '1px solid rgba(234,84,85,0.3)' }}>
            <span className="text-base shrink-0">⚠️</span>
            <span className="flex-1">
              <strong>ATRASADO</strong> — Deberías tener <strong>{formatMinutes(rhythm.expectedNow)}</strong>, llevas <strong>{formatMinutes(totalCompleted)}</strong>. Necesitas <strong>{formatMinutes(rhythm.neededDaily)}/día</strong>.
            </span>
          </div>
        )}
        </div>
      </div>

      <div id="tk-calendar" className="bg-card rounded-xl border border-white/10 p-4">
        <HexCalendar
          startDate={goal.start_date || goal.created_at.slice(0, 10)}
          deadline={goal.deadline}
          estimatedMinutes={totalEstimated}
          completedMinutes={totalCompleted}
          subtaskDays={subtaskDays}
        />
      </div>

      <div id="tk-subtasks" className="bg-card rounded-xl border border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Subtareas ({doneCount}/{subtasks.length})</span>
          <SubtaskForm onSave={(data) => {
            if (editingSubtask) onEditSubtask?.(editingSubtask.id, data)
            else onAddSubtask(data)
          }} onImport={onImportSubtasks} editSubtask={editingSubtask} onCloseEdit={() => setEditingSubtask(null)} subtaskList={subtasks} onCleanAll={onCleanAll} />
        </div>

        <SubtaskList subtasks={subtasks} onToggle={onSubtaskToggle} onDelete={onSubtaskDelete} onEdit={setEditingSubtask} onReorder={onReorderSubtasks} onSetDependency={onSetDependency} onStartPomodoro={onStartPomodoro} onShowHistory={setHistorySubtask} />
      </div>

      {goal.notes && (
        <div id="tk-notes" className="bg-card rounded-xl border border-white/10 p-4">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2 block">📝 Notas</span>
          <p className="text-sm text-text-secondary whitespace-pre-wrap">{goal.notes}</p>
        </div>
      )}
    </div>

    {historySubtask && (
      <SubtaskHistory subtask={historySubtask} onClose={() => setHistorySubtask(null)} />
    )}
    </>
  )
}
