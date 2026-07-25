import { useEffect, useState } from 'react'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import { Greeting } from '../components/layout/Greeting'
import { GamificationPanel } from '../components/shared/GamificationPanel'
import { DailyGoals } from '../components/shared/DailyGoals'
import { FocusChart } from '../components/focus/FocusChart'
import { ActivityBreakdown } from '../components/focus/ActivityBreakdown'
import { SessionHistory } from '../components/focus/SessionHistory'

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
  const totalMinutes = Math.round(sessions.reduce((acc: number, s: any) => acc + (s.elapsed_seconds || 0) / 60, 0))
  const completionRate = sessions.length > 0 ? Math.round((completed / sessions.length) * 100) : 0

  return (
    <div className="space-y-6">
      <Greeting />

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total', value: sessions.length, color: 'text-accent' },
          { label: 'Completadas', value: completed, color: 'text-success' },
          { label: 'Canceladas', value: cancelled, color: 'text-danger' },
          { label: 'Tasa', value: `${completionRate}%`, color: completionRate >= 70 ? 'text-success' : 'text-warning' },
          { label: 'Minutos', value: totalMinutes, color: 'text-[#00BCD4]' },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-xl border border-white/10 p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

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
