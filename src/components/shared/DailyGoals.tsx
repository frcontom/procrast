import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
export function DailyGoals() {
  const user = useUser()
  const [todaySessions, setTodaySessions] = useState(0)
  const [todayMinutes, setTodayMinutes] = useState(0)

  const goalSessions = 4
  const goalMinutes = 120

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('sessions').select('elapsed_seconds').eq('user_id', user.id).eq('state', 'completed').gte('started_at', today).then(({ data }: any) => {
      if (data) {
        setTodaySessions(data.length)
        setTodayMinutes(Math.round(data.reduce((a: number, s: any) => a + (s.elapsed_seconds || 0) / 60, 0)))
      }
    })
  }, [user])

  const sessionPct = Math.min(100, Math.round((todaySessions / goalSessions) * 100))
  const minutePct = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100))

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">🏆 Meta diaria</h3>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-secondary">Sesiones</span>
            <span className="font-medium">{todaySessions}/{goalSessions}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${sessionPct}%` }} />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text-secondary">Minutos</span>
            <span className="font-medium">{todayMinutes}/{goalMinutes}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${minutePct}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
