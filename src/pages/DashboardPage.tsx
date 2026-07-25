import { useEffect, useState, useMemo } from 'react'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import { formatMinutes } from '../lib/formatters'
import { Greeting } from '../components/layout/Greeting'
import { GamificationPanel } from '../components/shared/GamificationPanel'
import { DailyGoals } from '../components/shared/DailyGoals'
import { FocusChart } from '../components/focus/FocusChart'
import { ActivityBreakdown } from '../components/focus/ActivityBreakdown'
import { SessionHistory } from '../components/focus/SessionHistory'
import { ProductivityScore } from '../components/analytics/ProductivityScore'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export function DashboardPage() {
  const user = useUser()
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(500).then(({ data }: any) => {
      if (data) setSessions(data)
    })
  }, [user])

  const completed = sessions.filter((s: any) => s.state === 'completed').length
  const cancelled = sessions.filter((s: any) => s.state === 'cancelled').length
  const totalMinutes = Math.round(sessions.reduce((a, s) => a + (s.elapsed_seconds || 0) / 60, 0))
  const completionRate = sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0

  // Mejor día
  const dayTotals: Record<number, number> = {}
  sessions.forEach((s) => {
    if (!s.started_at) return
    const day = new Date(s.started_at).getDay()
    dayTotals[day] = (dayTotals[day] || 0) + (s.elapsed_seconds || 0) / 60
  })
  const bestDay = Object.entries(dayTotals).sort(([, a], [, b]) => b - a)[0]
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const bestDayName = bestDay ? dayNames[Number(bestDay[0])] : '—'

  // Racha actual
  const streakDays = useMemo(() => {
    const doneDays = new Set(
      sessions.filter((s) => s.state === 'completed' && s.started_at).map((s) => s.started_at.slice(0, 10))
    )
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      if (doneDays.has(d.toISOString().slice(0, 10))) streak++; else break
    }
    return streak
  }, [sessions])

  const avgMinutes = completed > 0 ? Math.round(totalMinutes / completed) : 0

  return (
    <div className="space-y-6">
      <Greeting />

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Sesiones', value: sessions.length, color: '#A66CFF' },
          { label: 'Completadas', value: completed, color: '#28C76F' },
          { label: 'Canceladas', value: cancelled, color: '#EA5455' },
          { label: 'Tasa', value: `${completionRate}%`, color: completionRate >= 70 ? '#28C76F' : completionRate >= 40 ? '#FF9800' : '#EA5455' },
          { label: 'Minutos', value: formatMinutes(totalMinutes), color: '#00BCD4' },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-white/10 p-4 text-center hover:border-white/25 transition-all">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center hover:border-white/25 transition-all">
          <div className="text-sm text-text-secondary mb-1">🔥 Racha</div>
          <div className="text-3xl font-bold text-[#FF9800]">{streakDays}</div>
          <div className="text-[10px] text-text-secondary/60 mt-0.5">días seguidos</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center hover:border-white/25 transition-all">
          <div className="text-sm text-text-secondary mb-1">⚡ Promedio</div>
          <div className="text-3xl font-bold text-[#A66CFF]">{avgMinutes}</div>
          <div className="text-[10px] text-text-secondary/60 mt-0.5">min / sesión</div>
        </div>
        <div className="bg-card rounded-xl border border-white/10 p-4 text-center hover:border-white/25 transition-all">
          <div className="text-sm text-text-secondary mb-1">🏆 Mejor día</div>
          <div className="text-3xl font-bold text-[#00BCD4]">{bestDay ? Math.round(Number(bestDay[1])) : 0}</div>
          <div className="text-[10px] text-text-secondary/60 mt-0.5">{bestDayName}</div>
        </div>
        <ProductivityScore completed={completed} total={sessions.length} totalMinutes={totalMinutes} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <FocusChart sessions={sessions} />
        </div>
        <div className="space-y-4">
          <GamificationPanel />
          <DailyGoals />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActivityBreakdown sessions={sessions} />
        <SessionHistory />
      </div>
    </div>
  )
}
