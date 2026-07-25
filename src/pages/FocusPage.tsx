import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../supabase/auth'
import { useTimerStore } from '../store/useTimerStore'
import { sessionManager } from '../lib/sessionManager'
import { playStartSound } from '../lib/sound'
import { TimerConfigBar } from '../components/focus/TimerConfigBar'
import { TimerDisplay } from '../components/focus/TimerDisplay'
import { TimerControls } from '../components/focus/TimerControls'
import { SessionNameInput } from '../components/focus/SessionNameInput'
import { StatsOverview } from '../components/focus/StatsOverview'
import { FocusChart } from '../components/focus/FocusChart'
import { ActivityBreakdown } from '../components/focus/ActivityBreakdown'
import { SessionHistory } from '../components/focus/SessionHistory'
import { CycleIndicator } from '../components/focus/CycleIndicator'
import { supabase } from '../supabase/client'

export function FocusPage() {
  const user = useUser()
  const store = useTimerStore()
  const navigate = useNavigate()
  const [lastXp, setLastXp] = useState(0)
  const [sessions, setSessions] = useState<any[]>([])
  const [todayStats, setTodayStats] = useState({ sessions: 0, minutes: 0, streak: 0 })

  useEffect(() => {
    if (!user) return
    sessionManager.setUser(user.id)
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(500).then(({ data }: any) => {
      if (data) setSessions(data)
    })
    supabase.from('sessions').select('elapsed_seconds').eq('user_id', user.id).eq('state', 'completed').gte('started_at', today).then(({ data }: any) => {
      if (data) setTodayStats((p) => ({ ...p, sessions: data.length, minutes: Math.round(data.reduce((a: number, s: any) => a + (s.elapsed_seconds || 0) / 60, 0)) }))
    })
    supabase.from('statistics').select('current_streak').eq('user_id', user.id).single().then(({ data }: any) => {
      if (data) setTodayStats((p) => ({ ...p, streak: data.current_streak || 0 }))
    })
  }, [user])

  useEffect(() => {
    if (store.state === 'FINISHED') {
      setLastXp(50 + Math.round(store.durationMinutes * 1))
      setTimeout(() => setLastXp(0), 4000)
      if (user) {
        supabase.from('sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(500).then(({ data }: any) => {
          if (data) setSessions(data)
        })
      }
    }
  }, [store.state])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const st = useTimerStore.getState()
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (st.state === 'IDLE' || st.state === 'FINISHED' || st.state === 'CANCELLED') {
          playStartSound()
           sessionManager.startSession(st.isStopwatch ? 480 : st.durationMinutes, st.activityType, st.sessionName, st.strictMode, false)
         } else if (st.state === 'RUNNING') sessionManager.pause()
        else if (st.state === 'PAUSED') sessionManager.resume()
      }
      if (e.code === 'Escape' && st.state !== 'IDLE' && !st.strictMode) { sessionManager.cancel() }
      if (e.code === 'KeyF' && (e.ctrlKey || e.metaKey) && st.state !== 'IDLE') {
        e.preventDefault()
        navigate('/focus/fullscreen')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleStart = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    playStartSound()
    await sessionManager.startSession(store.isStopwatch ? 480 : store.durationMinutes, store.activityType, store.sessionName, store.strictMode, false)
    navigate('/focus/fullscreen')
  }

  const handleCancel = async () => {
    if (store.strictMode) return
    await sessionManager.cancel()
  }

  const completed = sessions.filter((s: any) => s.state === 'completed').length
  const totalMinutes = Math.round(sessions.reduce((acc: number, s: any) => acc + (s.elapsed_seconds || 0) / 60, 0))
  const canConfigure = store.state === 'IDLE' || store.state === 'FINISHED' || store.state === 'CANCELLED'

  return (
    <div id="focus-page" className="w-full max-w-3xl mx-auto space-y-6">

      {todayStats.minutes > 0 && (
        <div className="flex items-center justify-center gap-5 text-xs text-text-secondary/70 animate-[fadeSlideDown_0.4s_ease]">
          <span>📊 Hoy: {todayStats.sessions} sesiones</span>
          <span>⏱ {todayStats.minutes} min</span>
          {todayStats.streak > 0 && <span>🔥 {todayStats.streak} días</span>}
        </div>
      )}

      <div id="focus-timer-section" className="bg-card rounded-2xl border border-white/10 overflow-hidden">
        <div id="focus-config-bar" className="px-5 pt-5 pb-3 border-b border-white/5">
          <TimerConfigBar />
        </div>

        <div id="focus-timer-body" className="px-5 py-8 space-y-6">
          <div id="focus-timer-display">
            <TimerDisplay
              remainingSeconds={store.remainingSeconds}
              elapsedSeconds={store.elapsedSeconds}
              progressPercent={store.progressPercent}
              state={store.state}
              isStopwatch={store.isStopwatch}
            />
          </div>

          <div id="focus-session-info" className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-primary)]/50">
              <span className="text-text-secondary/60 text-xs uppercase tracking-wider">Duración</span>
              <span className="text-white font-medium tabular-nums">{store.durationMinutes} min</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-primary)]/50">
              <span className="text-text-secondary/60 text-xs uppercase tracking-wider">Transcurrido</span>
              <span className="text-white font-medium tabular-nums">{Math.floor(store.elapsedSeconds / 60).toString().padStart(2, '0')}:{(store.elapsedSeconds % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>

          <div id="focus-session-name" className="flex justify-center pt-2">
            <SessionNameInput value={store.sessionName} onChange={store.setSessionName} disabled={!canConfigure} />
          </div>

          {store.cycleTotal > 0 && (
            <div className="flex justify-center pt-1">
              <CycleIndicator current={store.cycleCount} total={store.cycleTotal} />
            </div>
          )}

          <div id="focus-timer-controls" className="pt-2">
            <TimerControls
              state={store.state}
              onStart={handleStart}
              onPause={() => sessionManager.pause()}
              onResume={() => sessionManager.resume()}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>

      {lastXp > 0 && (
        <div id="focus-xp-notification" className="bg-card rounded-xl border border-accent/30 p-3 text-center animate-pulse">
          <div className="text-lg font-bold text-accent">+{lastXp} XP</div>
        </div>
      )}

      {(store.state === 'RUNNING' || store.state === 'PAUSED') && (
        <>
          <button onClick={() => navigate('/focus/fullscreen')}
            className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-card border border-white/10 text-text-secondary hover:text-white hover:border-accent/50 flex items-center justify-center transition-all shadow-lg"
            title="Pantalla completa (Ctrl+F)">
            ⛶
          </button>
          <button onClick={() => navigate('/focus/fullscreen')}
            className="w-full bg-card rounded-xl border border-accent/30 text-accent hover:text-white hover:bg-accent/20 p-3 text-sm font-medium transition-colors text-center">
            ⛶ Pantalla completa
          </button>
        </>
      )}
      <div id="focus-stats-card" className="bg-card rounded-xl border border-white/10 p-4">
        <div id="focus-stats-header" className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">📊 Stats</span>
        </div>
        <div id="focus-stats-overview">
          <StatsOverview totalSessions={sessions.length} completedSessions={completed} totalMinutes={totalMinutes} currentStreak={0} />
        </div>
        <div id="focus-stats-charts" className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FocusChart sessions={sessions} />
          <ActivityBreakdown sessions={sessions} />
        </div>
      </div>

      <div id="focus-session-history">
        <SessionHistory />
      </div>
    </div>
  )
}
