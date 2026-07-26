import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import { useUIStore } from '../../store/useUIStore'
import { signOut } from '../../supabase/auth'
import { MiniTimer } from './MiniTimer'
import { formatTime } from '../../lib/formatters'

const NAV_ITEMS = [
  { path: '/focus', label: 'Focus', icon: '◆' },
  { path: '/tasks', label: 'Metas', icon: '◎' },
  { path: '/habits', label: 'Hábitos', icon: '✓' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/knowledge', label: 'Notas', icon: '📝' },
  { path: '/identity', label: 'Identidad', icon: '👤' },
  { path: '/coach', label: 'Coach', icon: '🎯' },
]

export function Sidebar() {
  const user = useUser()
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const [todaySessions, setTodaySessions] = useState(0)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [streak, setStreak] = useState(0)
  const [gamification, setGamification] = useState<any>(null)
  const [activeGoals, setActiveGoals] = useState<any[]>([])

  const goalSessions = 4
  const goalMinutes = 120
  const total = goalSessions + goalMinutes
  const done = todaySessions + todayMinutes
  const globalPct = Math.min(100, Math.round((done / total) * 100))

  useEffect(() => {
    if (!user) return
    const today = new Date().toLocaleDateString('en-CA')

    // Today's stats
    supabase.from('sessions').select('elapsed_seconds, state, started_at').eq('user_id', user.id).gte('started_at', today).then(({ data }: any) => {
      if (data) {
        setTodaySessions(data.filter((s: any) => s.state === 'completed').length)
        setTodayMinutes(Math.round(data.reduce((a: number, s: any) => a + (s.elapsed_seconds || 0) / 60, 0)))
      }
    })

    // Streak
    supabase.from('sessions').select('started_at').eq('user_id', user.id).eq('state', 'completed').order('started_at', { ascending: false }).limit(500).then(({ data }: any) => {
      if (data) {
        const days = [...new Set(data.map((s: any) => s.started_at?.slice(0, 10)))].filter(Boolean)
        let s = 0
        for (let i = 0; i < 365; i++) {
          const d = new Date(); d.setDate(d.getDate() - i)
          if (days.includes(d.toLocaleDateString('en-CA'))) s++; else break
        }
        setStreak(s)
      }
    })

    // Gamification
    supabase.from('gamification').select('*').eq('user_id', user.id).single().then(({ data }: any) => {
      if (data) setGamification(data)
    })

    // Active goals
    supabase.from('task_goals').select('*').eq('user_id', user.id).eq('status', 'active').then(({ data: goals }: any) => {
      if (goals && goals.length > 0) {
        const ids = goals.map((g: any) => g.id)
        supabase.from('task_subtasks').select('goal_id, completed_minutes, estimated_minutes').in('goal_id', ids).then(({ data: subs }: any) => {
          if (subs) {
            const map: Record<string, { done: number; total: number }> = {}
            subs.forEach((s: any) => {
              if (!map[s.goal_id]) map[s.goal_id] = { done: 0, total: 0 }
              map[s.goal_id].done += s.completed_minutes
              map[s.goal_id].total += s.estimated_minutes
            })
            setActiveGoals(goals.map((g: any) => {
              const m = map[g.id] || { done: 0, total: 0 }
              return { ...g, completed: m.done, estimated: m.total || g.estimated_minutes }
            }))
          }
        })
      }
    })
  }, [user])

  const thresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100, 10500, 12000, 13600, 15300, 17100, 19000]
  const level = gamification?.level || 1
  const totalXp = gamification?.total_xp || 0
  const currentLevelIdx = level - 1
  const levelStart = thresholds[currentLevelIdx] || 0
  const levelEnd = thresholds[currentLevelIdx + 1] || levelStart + 1000
  const xpPct = Math.min(100, ((totalXp - levelStart) / (levelEnd - levelStart)) * 100)

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-secondary z-40 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-56' : 'w-0 -translate-x-full'}`}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-white/10 shrink-0">
        <span className="text-accent text-lg">⬡</span>
        <span className="font-bold text-sm tracking-wider">FÉRREO</span>
      </div>

      {/* Mini Timer */}
      <MiniTimer />

      {/* 🏆 Meta Diaria */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.5px] text-text-secondary mb-2.5">
          <span className="text-accent">🏆</span> Meta diaria
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Sesiones</span>
            <span className="font-semibold text-white">{todaySessions}<span className="text-text-secondary/50 font-normal">/{goalSessions}</span></span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-secondary">Minutos</span>
            <span className="font-semibold text-white">{todayMinutes}<span className="text-text-secondary/50 font-normal">/{goalMinutes}</span></span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${globalPct}%`, background: 'linear-gradient(90deg, var(--warning, #FF9800), var(--success, #28C76F))' }} />
          </div>
        </div>
      </div>

      {/* 💎 Gamificación */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.5px] text-text-secondary mb-2.5">
          <span className="text-accent">💎</span> Progreso
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-accent">Nv. {level}</span>
            <span className="text-[11px] text-text-secondary">{totalXp} XP</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg, var(--accent), var(--success, #28C76F))' }} />
          </div>
        </div>
      </div>

      {/* 📊 Hoy */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.5px] text-text-secondary mb-2.5">
          <span className="text-accent">📊</span> Hoy
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { value: todaySessions, label: 'Sesiones', color: '#A66CFF' },
            { value: formatTime(todayMinutes * 60), label: 'Tiempo', color: '#00BCD4' },
            { value: `${streak}d`, label: 'Racha', color: '#FF9800' },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-lg py-2 px-1 text-center">
              <div className="text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[8px] text-text-secondary/60 mt-0.5 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 🎯 Metas Activas */}
      {activeGoals.length > 0 && (
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.5px] text-text-secondary mb-2.5">
            <span className="text-accent">🎯</span> Metas activas
          </div>
          <div className="space-y-2.5 max-h-[180px] overflow-y-auto">
            {activeGoals.slice(0, 4).map((g) => {
              const pct = g.estimated > 0 ? Math.min(100, Math.round((g.completed / g.estimated) * 100)) : 0
              return (
                <div key={g.id}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px]">{g.icon || '◎'}</span>
                    <span className="text-[11px] text-text-secondary truncate flex-1">{g.name}</span>
                    <span className="text-[10px] font-semibold" style={{ color: pct >= 100 ? '#28C76F' : '#a0a0b0' }}>{pct}%</span>
                  </div>
                  <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: g.color || '#A66CFF' }} />
                  </div>
                  <div className="flex gap-1.5 text-[8px] text-text-secondary/50 mt-0.5">
                    <span>{g.completed}/{g.estimated}min</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-3 border-t border-white/10">
        {NAV_ITEMS.map(({ path, label, icon }) => (
          <NavLink key={path} to={path} className="block">
            {({ isActive }) => (
              <div className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all relative ${isActive ? 'text-white bg-white/10 font-medium' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}>
                {isActive && <div className="absolute left-0 top-1 bottom-1 w-1 rounded-r-full bg-accent" />}
                <span className="w-5 text-center text-base">{icon}</span>
                <span>{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2 text-[9px] text-text-secondary mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#28C76F]" />
          <span>Conectado</span>
          <span className="ml-auto">⌨ Space</span>
        </div>
        <div className="flex gap-2">
          <NavLink to="/settings" className="flex-1 text-center text-[10px] text-text-secondary hover:text-white py-1.5 rounded bg-white/5 hover:bg-white/10 transition-all">⚙️</NavLink>
          <button onClick={() => signOut()} className="flex-1 text-center text-[10px] text-text-secondary hover:text-danger py-1.5 rounded bg-white/5 hover:bg-white/10 transition-all">⏻</button>
        </div>
      </div>
    </aside>
  )
}
