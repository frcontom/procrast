import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import type { TaskGoal } from '../../supabase/types'

interface Props {
  goals: TaskGoal[]
  onSelectGoal: (id: string) => void
}

export function TodayView({ goals, onSelectGoal }: Props) {
  const user = useUser()
  const [todayMin, setTodayMin] = useState(0)
  const [todaySessions, setTodaySessions] = useState(0)

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('sessions').select('elapsed_seconds').eq('user_id', user.id).eq('state', 'completed').gte('started_at', today).then(({ data }: any) => {
      if (data) {
        setTodaySessions(data.length)
        setTodayMin(Math.round(data.reduce((a: number, s: any) => a + (s.elapsed_seconds || 0) / 60, 0)))
      }
    })
  }, [user])

  if (goals.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-white/10 p-12 text-center text-text-secondary text-sm">
        <div className="text-3xl mb-2">📅</div>
        <p>Sin metas activas. Crea una meta para ver tu plan diario.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-white/10 p-4">
        <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-1">📅 Plan de hoy</div>
        <div className="text-xs text-text-secondary">{todayMin} min completados · {todaySessions} sesiones</div>
      </div>

      {goals.map((goal) => {
        const pct = goal.estimated_minutes > 0 ? Math.min(100, Math.round((Math.min(goal.estimated_minutes, goal.estimated_minutes) / goal.estimated_minutes) * 100)) : 0
        return (
          <div key={goal.id} onClick={() => onSelectGoal(goal.id)}
            className="bg-card rounded-xl border border-white/10 p-4 cursor-pointer hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span>{goal.icon || '🎯'}</span>
              <span className="text-sm font-medium">{goal.name}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-text-secondary mb-2">
              <span>Hoy: {todayMin}min</span>
              <span>·</span>
              <span>Total: {goal.estimated_minutes}min</span>
              <span>·</span>
              <span>📅 {goal.deadline}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
