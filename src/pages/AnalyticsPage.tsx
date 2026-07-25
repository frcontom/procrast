import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import { ProductivityScore } from '../components/analytics/ProductivityScore'
import { FocusChart } from '../components/analytics/FocusChart'
import { MonthlyTrend } from '../components/analytics/MonthlyTrend'
import { ActivityBreakdown } from '../components/analytics/ActivityBreakdown'
import { WeeklyRanking } from '../components/analytics/WeeklyRanking'
import { RecentActivity } from '../components/analytics/RecentActivity'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export function AnalyticsPage() {
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
  const totalMinutes = Math.round(sessions.reduce((acc: number, s: any) => acc + (s.elapsed_seconds || 0) / 60, 0))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Sesiones', value: sessions.length, color: 'text-accent' },
          { label: 'Completadas', value: completed, color: 'text-success' },
          { label: 'Canceladas', value: cancelled, color: 'text-danger' },
          { label: 'Minutos totales', value: totalMinutes, color: 'text-warning' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-white/10 p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProductivityScore completed={completed} total={sessions.length} totalMinutes={totalMinutes} />
        <div className="md:col-span-2">
          <FocusChart sessions={sessions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MonthlyTrend sessions={sessions} />
        <ActivityBreakdown sessions={sessions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeeklyRanking sessions={sessions} />
        <RecentActivity sessions={sessions} />
      </div>
    </div>
  )
}
