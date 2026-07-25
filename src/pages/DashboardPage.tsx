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

  const avgMinutes = completed > 0 ? Math.round(totalMinutes / completed) : 0

  return (
    <div className="space-y-6">
      <Greeting />

      {/* Stats Grid Futuristico */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Sesiones', value: sessions.length, icon: '⚡', color: '#A66CFF', gradient: 'from-[#A66CFF]/20 to-[#A66CFF]/5' },
          { label: 'Completadas', value: completed, icon: '✅', color: '#28C76F', gradient: 'from-[#28C76F]/20 to-[#28C76F]/5' },
          { label: 'Canceladas', value: cancelled, icon: '✕', color: '#EA5455', gradient: 'from-[#EA5455]/20 to-[#EA5455]/5' },
          { label: 'Minutos', value: totalMinutes, icon: '⏱', color: '#00BCD4', gradient: 'from-[#00BCD4]/20 to-[#00BCD4]/5' },
          { label: 'Tasa', value: `${completionRate}%`, icon: '🎯', color: completionRate >= 70 ? '#28C76F' : completionRate >= 40 ? '#FF9800' : '#EA5455', gradient: `from-[${completionRate >= 70 ? '#28C76F' : completionRate >= 40 ? '#FF9800' : '#EA5455'}]/20 to-[${completionRate >= 70 ? '#28C76F' : completionRate >= 40 ? '#FF9800' : '#EA5455'}]/5` },
        ].map((s) => (
          <div key={s.label} className="relative rounded-2xl border border-white/[0.06] overflow-hidden group hover:border-white/20 transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', backdropFilter: 'blur(12px)' }}>
            <div className={`absolute inset-0 bg-gradient-to-b ${s.gradient} opacity-50`} />
            <div className="relative p-4 text-center">
              <div className="text-lg mb-1">{s.icon}</div>
              <div className="text-2xl font-bold tracking-tight" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-text-secondary/60 uppercase tracking-wider mt-1 font-medium">{s.label}</div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
          </div>
        ))}
      </div>

      {/* Highlights Futuristico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: 'Racha actual', value: streakDays, unit: 'días', icon: '🔥', color: '#FF9800', glow: 'rgba(255,152,0,0.3)' },
          { label: 'Promedio', value: avgMinutes, unit: 'min/sesión', icon: '⚡', color: '#A66CFF', glow: 'rgba(166,108,255,0.3)' },
          { label: 'Mejor día', value: bestDay ? Math.round(Number(bestDay[1])) : 0, unit: bestDayName, icon: '🏆', color: '#00BCD4', glow: 'rgba(0,188,212,0.3)' },
        ].map((h) => (
          <div key={h.label} className="relative rounded-2xl border border-white/[0.06] p-4 overflow-hidden group hover:border-white/20 transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', backdropFilter: 'blur(12px)' }}>
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: h.color, boxShadow: `0 0 60px ${h.glow}` }} />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: h.color + '20' }}>{h.icon}</div>
              <div>
                <div className="text-[10px] text-text-secondary/60 uppercase tracking-wider font-medium">{h.label}</div>
                <div className="text-xl font-bold text-white">{h.value} <span className="text-xs font-normal text-text-secondary/60">{h.unit}</span></div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${h.color}40, transparent)` }} />
          </div>
        ))}
        <ProductivityScore completed={completed} total={sessions.length} totalMinutes={totalMinutes} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/[0.06] p-4"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', backdropFilter: 'blur(12px)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary/60 mb-3">📊 Enfoque semanal</div>
          <FocusChart sessions={sessions} />
        </div>
        <div className="rounded-2xl border border-white/[0.06] p-4"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', backdropFilter: 'blur(12px)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary/60 mb-3">📈 Tendencia mensual</div>
          <MonthlyTrend sessions={sessions} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/[0.06] p-4"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', backdropFilter: 'blur(12px)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary/60 mb-3">📅 Actividad por día</div>
          <ActivityBreakdown sessions={sessions} />
        </div>
        <div className="rounded-2xl border border-white/[0.06] p-4"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', backdropFilter: 'blur(12px)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary/60 mb-3">🏆 Ranking semanal</div>
          <WeeklyRanking sessions={sessions} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.06] p-4"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', backdropFilter: 'blur(12px)' }}>
          <GamificationPanel />
        </div>
        <div className="rounded-2xl border border-white/[0.06] p-4"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', backdropFilter: 'blur(12px)' }}>
          <DailyGoals />
        </div>
        <div className="rounded-2xl border border-white/[0.06] p-4"
          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))', backdropFilter: 'blur(12px)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary/60 mb-3">📋 Actividad reciente</div>
          <RecentActivity sessions={sessions} />
        </div>
      </div>
    </div>
  )
}
