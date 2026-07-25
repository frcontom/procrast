import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import { useTimerStore } from '../../store/useTimerStore'
import { getLevelProgress } from '../../lib/gamification'

export function FocusSidebarPanels() {
  const location = useLocation()
  const isFocus = location.pathname === '/focus'

  if (!isFocus) return null

  return (
    <div className="space-y-3 px-3 py-3 border-b border-white/10 overflow-y-auto max-h-[calc(100vh-16rem)]">
      <ProfileSelector />
      <ActivityTypeSelector />
      <DurationSelector />
      <CyclesConfig />
      <DailyGoalsPanel />
      <GamificationPanel />
      <QuickStatsPanel />
    </div>
  )
}

function ProfileSelector() {
  return (
    <div>
      <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">👤 Perfil</label>
      <select className="w-full bg-[var(--bg-primary)] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-accent text-text-secondary cursor-pointer">
        <option value="focus">Focus (25 min, estudio)</option>
        <option value="deep">Deep Work (45 min, programación)</option>
      </select>
    </div>
  )
}

function ActivityTypeSelector() {
  const store = useTimerStore()
  const [showCustom, setShowCustom] = useState(false)

  return (
    <div>
      <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">📚 Tipo de actividad</label>
      {!showCustom ? (
        <div className="flex gap-1">
          <select value={store.activityType} onChange={(e) => {
            if (e.target.value === 'personalizado') { setShowCustom(true); return }
            store.setActivityType(e.target.value)
          }}
            className="flex-1 bg-[var(--bg-primary)] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-accent text-text-secondary cursor-pointer">
            <option value="estudio">📚 Estudio</option>
            <option value="programacion">💻 Programación</option>
            <option value="trading">📈 Trading</option>
            <option value="lectura">📖 Lectura</option>
            <option value="escritura">✍️ Escritura</option>
            <option value="trabajo">💼 Trabajo</option>
            <option value="personalizado">✨ Personalizado</option>
          </select>
        </div>
      ) : (
        <input type="text" placeholder="Nombre de la actividad"
          onBlur={() => setShowCustom(false)}
          onKeyDown={(e) => { if (e.key === 'Enter') { store.setActivityType((e.target as HTMLInputElement).value); setShowCustom(false) } }}
          className="w-full bg-[var(--bg-primary)] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-accent"
          autoFocus />
      )}
    </div>
  )
}

function DurationSelector() {
  const store = useTimerStore()
  const [showCustom, setShowCustom] = useState(false)

  return (
    <div>
      <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">⏱ Duración</label>
      {!showCustom ? (
        <select value={store.durationMinutes} onChange={(e) => {
          const v = e.target.value
          if (v === 'personalizado') { setShowCustom(true); return }
          store.setDuration(Number(v))
        }}
          className="w-full bg-[var(--bg-primary)] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-accent text-text-secondary cursor-pointer">
          <option value="15">15 min</option>
          <option value="25">25 min</option>
          <option value="30">30 min</option>
          <option value="45">45 min</option>
          <option value="60">1 h</option>
          <option value="90">1 h 30 min</option>
          <option value="120">2 h</option>
          <option value="480">∞ Sin límite</option>
          <option value="personalizado">✨ Personalizado</option>
        </select>
      ) : (
        <div className="flex gap-1">
          <input type="number" min={1} max={480} placeholder="Minutos"
            onKeyDown={(e) => { if (e.key === 'Enter') { store.setDuration(Number((e.target as HTMLInputElement).value)); setShowCustom(false) } }}
            className="flex-1 bg-[var(--bg-primary)] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-accent" autoFocus />
          <button onClick={() => setShowCustom(false)} className="text-text-secondary hover:text-white text-xs">✕</button>
        </div>
      )}
    </div>
  )
}

function CyclesConfig() {
  const store = useTimerStore()
  return (
    <div>
      <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">🔄 Ciclos</label>
      <select value={store.cycleTotal} onChange={(e) => store.setCycleTotal(Number(e.target.value))}
        className="w-full bg-[var(--bg-primary)] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-accent text-text-secondary cursor-pointer">
        <option value="0">Off</option>
        <option value="2">2</option>
        <option value="4">4</option>
        <option value="6">6</option>
        <option value="8">8</option>
      </select>
      {store.cycleTotal > 0 && (
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-[10px] text-text-secondary">{store.cycleCount}/{store.cycleTotal}</span>
          <div className="flex gap-0.5 flex-1">
            {Array.from({ length: store.cycleTotal }, (_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < store.cycleCount ? 'bg-accent' : 'bg-white/10'}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DailyGoalsPanel() {
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
    <div>
      <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">🏆 Meta diaria</label>
      <div className="space-y-1.5">
        <div>
          <div className="flex justify-between text-[10px]"><span className="text-text-secondary">Sesiones</span><span className="text-text-secondary">{todaySessions}/{goalSessions}</span></div>
          <div className="w-full bg-[var(--bg-primary)] rounded-full h-1"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${sessionPct}%` }} /></div>
        </div>
        <div>
          <div className="flex justify-between text-[10px]"><span className="text-text-secondary">Minutos</span><span className="text-text-secondary">{todayMinutes}/{goalMinutes}</span></div>
          <div className="w-full bg-[var(--bg-primary)] rounded-full h-1"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${minutePct}%` }} /></div>
        </div>
      </div>
    </div>
  )
}

function GamificationPanel() {
  const user = useUser()
  const [data, setData] = useState<{ total_xp: number; level: number } | null>(null)
  const [badges, setBadges] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('gamification').select('total_xp, level').eq('user_id', user.id).single().then(({ data: d }: any) => {
      if (d) setData(d)
    })
    supabase.from('badges').select('*').eq('user_id', user.id).eq('unlocked', true).then(({ data: b }: any) => {
      if (b) setBadges(b)
    })
  }, [user])

  if (!data) return null

  const progress = getLevelProgress(data.total_xp, data.level)

  return (
    <div>
      <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">💎 Progreso</label>
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-text-secondary">Nv. {data.level}</span>
        <span className="text-text-secondary">{data.total_xp} XP</span>
      </div>
      <div className="w-full bg-[var(--bg-primary)] rounded-full h-1.5 mb-1">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
      </div>
      {badges.length > 0 && <div className="flex gap-0.5 mt-1">{badges.map((b) => <span key={b.code} className="text-xs" title={b.title}>🏅</span>)}</div>}
    </div>
  )
}

function QuickStatsPanel() {
  const user = useUser()
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('sessions').select('elapsed_seconds, state').eq('user_id', user.id).gte('started_at', today).then(({ data }: any) => {
      if (data) setSessions(data)
    })
  }, [user])

  const todayCount = sessions.filter((s: any) => s.state === 'completed').length
  const todayMin = Math.round(sessions.reduce((a: number, s: any) => a + (s.elapsed_seconds || 0) / 60, 0))
  const h = Math.floor(todayMin / 60)
  const m = todayMin % 60
  const timeStr = h > 0 ? `${h}:${m.toString().padStart(2, '0')}` : `00:${todayMin.toString().padStart(2, '0')}`

  return (
    <div>
      <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">📊 Hoy</label>
      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between"><span className="text-text-secondary">Sesiones</span><span>{todayCount}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Tiempo</span><span>{timeStr}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Racha</span><span>0d 🔥</span></div>
      </div>
    </div>
  )
}
