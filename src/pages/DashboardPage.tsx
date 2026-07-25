import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import { formatMinutes } from '../lib/formatters'
import { Greeting } from '../components/layout/Greeting'
import { ProductivityScore } from '../components/analytics/ProductivityScore'
import { FocusChart } from '../components/analytics/FocusChart'
import { MonthlyTrend } from '../components/analytics/MonthlyTrend'
import { ActivityBreakdown } from '../components/analytics/ActivityBreakdown'
import { WeeklyRanking } from '../components/analytics/WeeklyRanking'
import { RecentActivity } from '../components/analytics/RecentActivity'
import { GamificationPanel } from '../components/shared/GamificationPanel'

function StatCard({ icon, label, value, color, suffix }: { icon: string; label: string; value: string | number; color: string; suffix?: string }) {
  return (
    <div className="relative rounded-2xl border border-white/[0.06] overflow-hidden group hover:border-white/20 transition-all duration-500"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${color}15, transparent 60%)` }} />
      <div className="relative p-4 text-center">
        <div className="text-lg mb-1 animate-float" style={{ display: 'inline-block' }}>{icon}</div>
        <div className="text-[28px] font-bold tracking-tight tabular-nums" style={{ color }}>{value}{suffix}</div>
        <div className="text-[9px] text-text-secondary/50 uppercase tracking-[1.5px] mt-1 font-semibold">{label}</div>
      </div>
      <div className="absolute bottom-0 left-4 right-4 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)`, opacity: 0.6 }} />
    </div>
  )
}

function HighlightCard({ icon, label, value, unit, color }: { icon: string; label: string; value: string | number; unit: string; color: string }) {
  return (
    <div className="relative rounded-2xl border border-white/[0.06] p-4 overflow-hidden group hover:border-white/20 transition-all duration-500 h-full"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }}>
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full opacity-[0.08] group-hover:opacity-[0.15] transition-all duration-700"
        style={{ backgroundColor: color, boxShadow: `0 0 80px ${color}` }} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${color}10, transparent 60%)` }} />
      <div className="relative flex flex-col justify-center items-center h-full min-h-[80px] text-center">
        <div className="text-[9px] text-text-secondary/50 uppercase tracking-[1.5px] font-semibold">{label}</div>
        <div className="text-xl font-bold text-white tabular-nums mt-0.5">
          {value}
          <span className="text-[11px] font-normal text-text-secondary/40 ml-1">{unit}</span>
        </div>
      </div>
    </div>
  )
}

function GlassCard({ title, icon, children }: { title?: string; icon?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] p-5 h-full transition-all duration-500 hover:border-white/15"
      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))' }}>
      {title && <div className="text-[9px] font-semibold uppercase tracking-[1.5px] text-text-secondary/50 mb-4 flex items-center gap-2">{icon && <span>{icon}</span>}{title}</div>}
      {children}
    </div>
  )
}

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
  const bgColor = completionRate >= 70 ? '#28C76F' : completionRate >= 40 ? '#FF9800' : '#EA5455'

  return (
    <div className="space-y-5">
      {/* Animated background effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.03] animate-glow-pulse"
          style={{ background: 'radial-gradient(circle, #A66CFF, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.03] animate-glow-pulse"
          style={{ background: 'radial-gradient(circle, #00BCD4, transparent 70%)', animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10">
        <Greeting />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 mb-5">
          <StatCard icon="⚡" label="Sesiones" value={sessions.length} color="#A66CFF" />
          <StatCard icon="✅" label="Completadas" value={completed} color="#28C76F" />
          <StatCard icon="✕" label="Canceladas" value={cancelled} color="#EA5455" />
          <StatCard icon="⏱" label="Minutos" value={formatMinutes(totalMinutes)} color="#00BCD4" />
          <StatCard icon="🎯" label="Tasa" value={completionRate} color={bgColor} suffix="%" />
        </div>

        {/* Highlights + Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 mb-5">
          <HighlightCard icon="🔥" label="Racha actual" value={streakDays} unit="días" color="#FF9800" />
          <HighlightCard icon="⚡" label="Promedio" value={avgMinutes} unit="min/sesión" color="#A66CFF" />
          <HighlightCard icon="🏆" label="Mejor día" value={bestDay ? Math.round(Number(bestDay[1])) : 0} unit={bestDayName} color="#00BCD4" />
          <GlassCard>
            <ProductivityScore completed={completed} total={sessions.length} totalMinutes={totalMinutes} />
          </GlassCard>
        </div>

        {/* Primary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
          <GlassCard title="Enfoque semanal" icon="📊">
            <FocusChart sessions={sessions} />
          </GlassCard>
          <GlassCard title="Tendencia mensual" icon="📈">
            <MonthlyTrend sessions={sessions} />
          </GlassCard>
        </div>

        {/* Secondary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-5">
          <GlassCard title="Actividad por día" icon="📅">
            <ActivityBreakdown sessions={sessions} />
          </GlassCard>
          <GlassCard title="Ranking semanal" icon="🏆">
            <WeeklyRanking sessions={sessions} />
          </GlassCard>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <GlassCard title="Jugador" icon="🎮">
            <GamificationPanel />
          </GlassCard>
          <GlassCard title="Metas del día" icon="🎯">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Sesiones</span>
                <span className="text-white font-medium tabular-nums">0 / 4</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-accent to-[#b388ff] transition-all" style={{ width: '0%' }} />
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-text-secondary">Minutos</span>
                <span className="text-white font-medium tabular-nums">0 / 120</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#00BCD4] to-[#4DD0E1] transition-all" style={{ width: '0%' }} />
              </div>
            </div>
          </GlassCard>
          <GlassCard title="Actividad reciente" icon="📋">
            <RecentActivity sessions={sessions} />
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
