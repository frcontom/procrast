import { useEffect, useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'

interface Stats {
  total_sessions: number
  completed_sessions: number
  total_seconds: number
  current_streak: number
}

export function StatsCard() {
  const user = useUser()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data }: any) => {
        if (!data) return
        const completed = data.filter((s: any) => s.state === 'completed').length
        const totalSeconds = data.reduce((acc: number, s: any) => acc + (s.elapsed_seconds || 0), 0)
        setStats({
          total_sessions: data.length,
          completed_sessions: completed,
          total_seconds: totalSeconds,
          current_streak: 0,
        })
      })
  }, [user])

  if (!stats || stats.total_sessions === 0) return null

  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-md">
      <div className="bg-secondary rounded-xl p-3 text-center">
        <div className="text-lg font-bold text-accent">{stats.completed_sessions}</div>
        <div className="text-[10px] text-text-secondary uppercase tracking-wider">Sesiones</div>
      </div>
      <div className="bg-secondary rounded-xl p-3 text-center">
        <div className="text-lg font-bold text-success">{Math.round(stats.total_seconds / 60)}</div>
        <div className="text-[10px] text-text-secondary uppercase tracking-wider">Minutos</div>
      </div>
      <div className="bg-secondary rounded-xl p-3 text-center">
        <div className="text-lg font-bold text-warning">{stats.current_streak}</div>
        <div className="text-[10px] text-text-secondary uppercase tracking-wider">Racha</div>
      </div>
    </div>
  )
}
