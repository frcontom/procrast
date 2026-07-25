import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import { Greeting } from '../components/layout/Greeting'
import { GamificationPanel } from '../components/shared/GamificationPanel'
import { DailyGoals } from '../components/shared/DailyGoals'
import { ProductivityScore } from '../components/analytics/ProductivityScore'
import { FocusChart } from '../components/analytics/FocusChart'
import { MonthlyTrend } from '../components/analytics/MonthlyTrend'
import { ActivityBreakdown } from '../components/analytics/ActivityBreakdown'
import { WeeklyRanking } from '../components/analytics/WeeklyRanking'
import { RecentActivity } from '../components/analytics/RecentActivity'

export function DashboardPage() {
  const user = useUser()
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(500).then(({ data }: any) => {
      if (data) setSessions(data)
    })
  }, [user])

  const completed = sessions.filter((s) => s.state === 'completed').length
  const cancelled = sessions.filter((s) => s.state === 'cancelled').length
  const totalMinutes = Math.round(sessions.reduce((a, s) => a + (s.elapsed_seconds || 0) / 60, 0))
  const completionRate = sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0

  // Mejor día de la semana
  const dayTotals: Record<number, number> = {}
  sessions.forEach((s) => {
    if (!s.started_at) return
    const d = new Date(s.started_at)
    const day = d.getDay()
    dayTotals[day] = (dayTotals[day] || 0) + (s.elapsed_seconds || 0) / 60
  })
  const bestDay = Object.entries(dayTotals).sort(([, a], [, b]) => b - a)[0]
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const bestDayName = bestDay ? dayNames[Number(bestDay[0])] : '—'

  // Racha actual (días consecutivos con al menos 1 sesión completada)
  const streakDays = useMemo(() => {
    const doneDays = new Set(
      sessions.filter((s) => s.state === 'completed' && s.started_at)
        .map((s) => s.started_at.slice(0, 10))
    )
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().slice(0, 10)
      if (doneDays.has(ds)) streak++
      else break
    }
    return streak
  }, [sessions])

  // Promedio de minutos por sesión completada
  const avgMinutes = completed > 0 ? Math.round(totalMinutes / completed) : 0

  return (
    <div className="space-y-6">
      <Greeting />

      {/* Stats grid */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-accent">{sessions.length}</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">Sesiones</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-[#28C76F]">{completed}</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">Completadas</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-[#EA5455]">{cancelled}</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">Canceladas</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-[#00BCD4]">{totalMinutes}</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">Minutos</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center">
          <div className={`text-2xl font-bold ${completionRate >= 70 ? 'text-[#28C76F]' : completionRate >= 40 ? 'text-[#FF9800]' : 'text-[#EA5455]'}`}>{completionRate}%</div>
          <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">Tasa</div>
        </div>
      </div>

      {/* Second row: highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center">
          <div className="text-sm text-text-secondary mb-1">🔥 Racha actual</div>
          <div className="text-3xl font-bold text-[#FF9800]">{streakDays}</div>
          <div className="text-[10px] text-text-secondary/60 mt-0.5">días seguidos</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center">
          <div className="text-sm text-text-secondary mb-1">⚡ Promedio</div>
          <div className="text-3xl font-bold text-accent">{avgMinutes}</div>
          <div className="text-[10px] text-text-secondary/60 mt-0.5">min / sesión</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center">
          <div className="text-sm text-text-secondary mb-1">🏆 Mejor día</div>
          <div className="text-3xl font-bold text-[#00BCD4]">{bestDay ? Math.round(Number(bestDay[1])) : 0}</div>
          <div className="text-[10px] text-text-secondary/60 mt-0.5">{bestDayName}</div>
        </div>
        <ProductivityScore completed={completed} total={sessions.length} totalMinutes={totalMinutes} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FocusChart sessions={sessions} />
        <MonthlyTrend sessions={sessions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActivityBreakdown sessions={sessions} />
        <WeeklyRanking sessions={sessions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GamificationPanel />
        <DailyGoals />
        <RecentActivity sessions={sessions} />
      </div>
    </div>
  )
}
