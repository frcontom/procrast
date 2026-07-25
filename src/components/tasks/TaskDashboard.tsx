import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import type { TaskGoal } from '../../supabase/types'

interface Props {
  goals: TaskGoal[]
  onSelectGoal: (id: string) => void
}

export function TaskDashboard({ goals, onSelectGoal }: Props) {
  const user = useUser()
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('sessions').select('*').eq('user_id', user.id).eq('state', 'completed').order('started_at', { ascending: false }).limit(50).then(({ data }: any) => {
      if (data) setSessions(data)
    })
  }, [user])

  const totalEstimated = goals.reduce((a, g) => a + g.estimated_minutes, 0)
  const completedToday = sessions.filter((s: any) => new Date(s.started_at).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10))
  const todayMin = Math.round(completedToday.reduce((a: number, s: any) => a + (s.elapsed_seconds || 0) / 60, 0))

  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
  const weekData = weekDays.map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dayStr = d.toISOString().slice(0, 10)
    return Math.round(sessions.filter((s: any) => s.started_at?.slice(0, 10) === dayStr).reduce((a: number, s: any) => a + (s.elapsed_seconds || 0) / 60, 0))
  })
  const maxVal = Math.max(...weekData, 1)

  return (
    <div className="space-y-4">
      {goals.length === 0 ? (
        <div className="bg-card rounded-xl border border-white/10 p-12 text-center text-text-secondary text-sm">
          <div className="text-3xl mb-2">🎯</div>
          <p>Crea tu primera meta para comenzar</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-white/10 p-4">
              <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">📊 Progreso global</div>
              <div className="text-2xl font-bold text-accent">{totalEstimated > 0 ? Math.round((totalEstimated / Math.max(1, totalEstimated)) * 100) : 0}%</div>
              <div className="text-xs text-text-secondary mt-1">{goals.length} metas</div>
            </div>
            <div className="bg-card rounded-xl border border-white/10 p-4">
              <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">📅 Hoy</div>
              <div className="text-2xl font-bold text-white">{todayMin} min</div>
              <div className="text-xs text-text-secondary mt-1">{completedToday.length} sesiones</div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-white/10 p-4">
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-3">📊 Actividad semanal</div>
            <div className="flex items-end gap-2 h-24">
              {weekData.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t transition-all duration-300" style={{ height: `${(v / maxVal) * 100}%`, backgroundColor: v > 0 ? 'var(--accent)' : '#1a1a2e', minHeight: v > 0 ? '4px' : '2px' }} />
                  <span className="text-[8px] text-text-secondary">{weekDays[i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider">🏴 Metas activas</span>
            {goals.map((goal) => {
              const pct = goal.estimated_minutes > 0 ? Math.min(100, Math.round((Math.min(goal.estimated_minutes, goal.estimated_minutes) / goal.estimated_minutes) * 100)) : 0
              return (
                <div key={goal.id} onClick={() => onSelectGoal(goal.id)}
                  className="bg-card rounded-xl border border-white/10 p-3 cursor-pointer hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{goal.icon || '🎯'}</span>
                      <span className="text-sm font-medium">{goal.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${pct >= 70 ? 'text-success bg-success/10' : pct >= 40 ? 'text-warning bg-warning/10' : 'text-danger bg-danger/10'}`}>
                      {pct >= 70 ? '✅ Al día' : pct >= 40 ? '⚠️ Regular' : '🔴 Atrasado'}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-secondary rounded-full h-1.5">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: 'var(--accent)' }} />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-text-secondary">
                    <span>📅 {goal.deadline}</span>
                    <span>⏱ {goal.estimated_minutes}min</span>
                  </div>
                </div>
              )
            })}
          </div>

          {sessions.length > 0 && (
            <div className="bg-card rounded-xl border border-white/10 p-4">
              <div className="text-[10px] text-text-secondary uppercase tracking-wider mb-2">🕐 Actividad reciente</div>
              <div className="space-y-1.5">
                {sessions.slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary">{s.activity_type || 'focus'} · <span className="text-text-secondary/60">{s.session_name || '—'}</span></span>
                    <span className="text-text-secondary/60">{Math.round((s.elapsed_seconds || 0) / 60)}min</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
