import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import type { TaskGoal } from '../../supabase/types'

interface Props {
  goals: TaskGoal[]
  onSelectGoal: (id: string) => void
}

const DAY_NAMES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

export function TaskDashboard({ goals, onSelectGoal }: Props) {
  const user = useUser()
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('task_pomodoro_links').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(200).then(({ data }: any) => {
      if (data) setSessions(data)
    })
  }, [user])

  const totalEstimated = goals.reduce((a, g) => a + g.estimated_minutes, 0)
  const totalFromLinks = sessions.reduce((a: number, l: any) => a + (l.minutes || 0), 0)
  const pct = totalEstimated > 0 ? Math.min(100, Math.round((totalFromLinks / totalEstimated) * 100)) : 0
  const pctColor = pct >= 80 ? '#28C76F' : pct >= 40 ? '#FF9F43' : '#A66CFF'

  const today = new Date().toISOString().slice(0, 10)
  const todaySessions = sessions.filter((s: any) => s.date === today)
  const todayMin = todaySessions.reduce((a: number, s: any) => a + (s.minutes || 0), 0)
  const goalTodayMin = 60
  const todayPct = Math.min(100, Math.round((todayMin / Math.max(1, goalTodayMin)) * 100))
  const todayColor = todayMin >= goalTodayMin ? '#28C76F' : todayPct >= 50 ? '#FF9F43' : '#EA5455'

  // Semana: domingo (0) a sabado (6)
  const now = new Date()
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay()) // domingo mas cercano atras
  const weekData = DAY_NAMES.map((_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    const ds = d.toISOString().slice(0, 10)
    return sessions.filter((s: any) => s.date === ds).reduce((a: number, s: any) => a + (s.minutes || 0), 0)
  })
  const maxVal = Math.max(...weekData, 1)
  const totalWeek = weekData.reduce((a, v) => a + v, 0)
  const avgWeek = Math.round(totalWeek / 7)
  const bestIdx = weekData.indexOf(Math.max(...weekData))
  const bestDay = DAY_NAMES[bestIdx]
  const todayIdx = new Date().getDay() // 0=dom, 6=sab

  const totalSubtasks = goals.reduce((a, g) => a + (g as any).subtask_count || 0, 0)

  const behindCount = goals.filter((g) => {
    const elapsed = Math.max(0, Math.round((Date.now() - new Date(g.start_date || g.created_at).getTime()) / 86400000)) || 1
    const dailyTarget = Math.round(g.estimated_minutes / Math.max(1, Math.round((new Date(g.deadline).getTime() - new Date(g.start_date || g.created_at).getTime()) / 86400000)))
    const expected = dailyTarget * elapsed
    return g.status === 'active' && expected > 0 && (g as any).completed_minutes < expected * 0.5
  }).length

  const hasWeekData = weekData.some((v) => v > 0)

  return (
    <div id="task-dashboard" className="space-y-4">
      {goals.length === 0 ? (
        <div className="bg-card rounded-xl border border-white/10 p-12 text-center text-text-secondary text-sm">
          <div className="text-3xl mb-2">🎯</div>
          <p>Crea tu primera meta para comenzar</p>
        </div>
      ) : (
        <>
          <div id="task-stats-row" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div id="task-progreso-global" className="bg-card rounded-xl border border-white/10 p-5 text-center">
              <div id="task-pg-label" className="text-[10px] uppercase tracking-[1px] text-text-secondary mb-2">PROGRESO GLOBAL</div>
              <div id="task-pg-number" className="text-[44px] font-extrabold leading-none" style={{ color: pctColor }}>{pct}%</div>
              <div id="task-pg-minutes" className="text-xs text-text-secondary mt-1">{totalFromLinks} / {totalEstimated} min</div>
              <div id="task-pg-bar" className="w-full bg-secondary rounded-full h-[6px] mt-3 overflow-hidden">
                <div id="task-pg-bar-fill" className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: pctColor }} />
              </div>
              <div id="task-pg-footer" className="text-[11px] text-text-secondary mt-2">{goals.length} meta(s) · {totalSubtasks || 0} tarea(s)</div>
            </div>

            <div id="task-hoy" className="bg-card rounded-xl border border-white/10 p-5 text-center">
              <div id="task-hoy-label" className="text-[10px] uppercase tracking-[1px] text-text-secondary mb-2">HOY</div>
              <div id="task-hoy-number" className="flex items-baseline justify-center gap-1">
                <span className="text-[44px] font-extrabold leading-none" style={{ color: todayColor }}>{todayMin}</span>
                <span className="text-base text-text-secondary">/ {goalTodayMin} min</span>
              </div>
              <div id="task-hoy-info" className="text-xs text-text-secondary mt-1">{todaySessions.length} sesión(es) · {todayPct}% cumplido</div>
              <div id="task-hoy-bar" className="w-full bg-secondary rounded-full h-[6px] mt-3 overflow-hidden">
                <div id="task-hoy-bar-fill" className="h-full rounded-full transition-all duration-500" style={{ width: `${todayPct}%`, backgroundColor: todayColor }} />
              </div>
              <div id="task-hoy-footer" className="flex items-center justify-center gap-5 text-xs text-text-secondary mt-2">
                <span>🔥 Racha: 0d</span>
                <span>🏆 Mejor: 0d</span>
              </div>
            </div>

            <div id="task-streak-card" className="bg-card rounded-xl border border-white/10 p-5 text-center">
              <div id="task-streak-label" className="text-[10px] uppercase tracking-[1px] text-text-secondary mb-2">🔥 RACHA</div>
              <div id="task-streak-number" className="text-[44px] font-extrabold leading-none text-warning">0</div>
              <div id="task-streak-info" className="text-xs text-text-secondary mt-1">días seguidos</div>
              <div id="task-streak-footer" className="text-[11px] text-text-secondary mt-2">🏆 Mejor racha: 0d</div>
            </div>

            <div id="task-atrisk-card" className="bg-card rounded-xl border border-white/10 p-5 text-center">
              <div id="task-atrisk-label" className="text-[10px] uppercase tracking-[1px] text-text-secondary mb-2">🚨 EN RIESGO</div>
              <div id="task-atrisk-number" className="text-[44px] font-extrabold leading-none" style={{ color: behindCount > 0 ? '#EA5455' : '#28C76F' }}>{behindCount}</div>
              <div id="task-atrisk-info" className="text-xs text-text-secondary mt-1">{behindCount === 1 ? 'meta atrasada' : 'metas atrasadas'}</div>
              <div id="task-atrisk-footer" className="text-[11px] text-text-secondary mt-2">{behindCount > 0 ? 'Revisa tu plan diario' : 'Todo al día ✅'}</div>
            </div>
          </div>

          {hasWeekData && (
            <div id="task-weekly-activity" className="bg-card rounded-xl border border-white/10 p-5">
              <div id="task-wa-header" className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-text-secondary">📅 Actividad semanal</span>
                <span className="text-[10px] text-text-secondary">Total: {totalWeek}min · Prom: {avgWeek}min</span>
              </div>
              <div id="task-wa-bars" style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '130px' }}>
                {weekData.map((v, i) => {
                  const isToday = i === todayIdx
                  const hasActivity = v > 0
                  const barHeight = hasActivity ? Math.max(4, (v / maxVal) * 100) : 0
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '130px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 600, marginBottom: '2px', color: hasActivity ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>{v}</span>
                      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {hasActivity ? (
                          <div style={{ width: '70%', height: `${barHeight}%`, minHeight: '4px', borderRadius: '3px 3px 0 0', transition: 'height 0.3s', backgroundColor: isToday ? '#A66CFF' : '#156390', boxShadow: isToday ? '0 0 8px rgba(166,108,255,0.4)' : 'none' }} />
                        ) : (
                          <div style={{ width: '70%', height: '4px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '2px' }} />
                        )}
                      </div>
                      <span style={{ fontSize: '9px', marginTop: '3px', color: isToday ? '#A66CFF' : 'rgba(255,255,255,0.5)', fontWeight: isToday ? 700 : 400 }}>{DAY_NAMES[i]}</span>
                    </div>
                  )
                })}
              </div>
              <div id="task-wa-footer" className="flex justify-between text-[10px] text-text-secondary mt-3">
                <span>🏆 Mejor día: {bestDay.charAt(0).toUpperCase() + bestDay.slice(1)} ({Math.max(...weekData)}min)</span>
                <span style={{ color: todayMin > 0 ? '#A66CFF' : undefined }}>📊 Hoy: {todayMin}min</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider">🏴 {goals.length} meta(s) activas</span>
            {goals.sort((a, b) => {
              const order = { critical: 0, high: 1, normal: 2, low: 3 }
              const pa = a.priority && order[a.priority] !== undefined ? order[a.priority] : 2
              const pb = b.priority && order[b.priority] !== undefined ? order[b.priority] : 2
              if (pa !== pb) return pa - pb
              if (a.status !== b.status) return a.status === 'active' ? -1 : 1
              return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
            }).map((goal) => {
              const goalPct = goal.estimated_minutes > 0 ? Math.min(100, Math.round((Math.min(goal.estimated_minutes, goal.estimated_minutes) / goal.estimated_minutes) * 100)) : 0
              const status = goalPct >= 100 ? 'completed' : goalPct >= 40 ? 'on_track' : 'behind'
              const statusLabel = status === 'completed' ? 'Completado' : status === 'on_track' ? 'Al día' : 'Atrasado'
              const statusColor = status === 'completed' ? '#28C76F' : status === 'on_track' ? '#28C76F' : '#EA5455'
              const daysToDeadline = Math.max(0, Math.round((new Date(goal.deadline).getTime() - Date.now()) / 86400000))
              const todayGoal = Math.round(goal.estimated_minutes / Math.max(1, daysToDeadline + 1))
              return (
                <div key={goal.id} onClick={() => onSelectGoal(goal.id)}
                  className="bg-card rounded-lg border border-white/10 cursor-pointer hover:border-[var(--accent)] transition-all overflow-hidden"
                  style={{ borderLeft: `4px solid ${goal.color || '#A66CFF'}` }}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span style={{ color: goal.color || '#A66CFF' }}>{goal.icon && !goal.icon.startsWith('bi-') ? goal.icon : '🎯'}</span>
                        <span className="text-sm font-bold truncate">{goal.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] px-1.5 py-0.5 rounded text-white font-medium" style={{ backgroundColor: statusColor }}>{statusLabel}</span>
                        <span className="text-sm font-bold">{goalPct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-[5px] overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${goalPct}%`, backgroundColor: statusColor }} />
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-text-secondary">
                      <span>{goal.estimated_minutes}min</span>
                      <span>·</span>
                      <span>{goal.estimated_minutes} tarea(s)</span>
                      <span>·</span>
                      <span>⌛ {daysToDeadline}d restantes</span>
                      <span>·</span>
                      <span>Hoy: <span className="font-bold" style={{ color: todayMin >= todayGoal ? '#28C76F' : '#EA5455' }}>{todayMin}min</span></span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {sessions.length > 0 && (
            <div className="bg-card rounded-xl border border-white/10 p-4">
              <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">🕐 Actividad reciente</div>
              <div className="space-y-1.5">
                {sessions.slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between text-xs py-1">
                    <span className="text-text-secondary">◆ {s.subtask_name || s.activity_type || 'tarea'} → {s.subtask_name || ''}</span>
                    <span className="text-text-secondary/60">{s.minutes || 0}min · {s.date ? new Date(s.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}</span>
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
