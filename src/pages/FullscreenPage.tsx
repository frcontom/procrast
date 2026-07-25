import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimerStore } from '../store/useTimerStore'
import { sessionManager } from '../lib/sessionManager'
import { playStartSound } from '../lib/sound'
import { formatTime } from '../lib/formatters'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'

const bgImageModules = import.meta.glob('/src/assets/focus/*.png', { eager: true, query: '?url', import: 'default' })
const bgImages = Object.values(bgImageModules) as string[]

const GRADIENTS = [
  'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
  'linear-gradient(135deg,#000428,#004e92)',
  'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
  'linear-gradient(135deg,#0d0d0d,#1a1a2e,#2d2d44)',
  'linear-gradient(135deg,#0b0b1a,#1a1a3e,#2a1a4e)',
]

function calculateScore(elapsed: number, total: number, cycleCount: number): number {
  const base = 50
  const completion = Math.round((elapsed / Math.max(total, 1)) * 30)
  const cycleBonus = cycleCount > 0 ? 10 : 0
  return Math.min(100, base + completion + cycleBonus)
}

function progressColor(pct: number, state: string): { color: string; label: string } {
  if (state === 'PAUSED') return { color: '#FF9F43', label: '⏸' }
  if (state === 'FINISHED') return { color: '#00CFE8', label: '🎉' }
  if (state === 'CANCELLED') return { color: '#EA5455', label: '✕' }
  if (state === 'IDLE') return { color: '#A8E6CF', label: '⚡' }
  if (pct < 25) return { color: '#6B7280', label: '💪 Empieza' }
  if (pct < 50) return { color: '#60A5FA', label: '🔥 Vamos' }
  if (pct < 75) return { color: '#34D399', label: '⚡ Dale' }
  return { color: '#22C55E', label: '🏆 Meta' }
}

function streakEmoji(streak: number): string {
  if (streak >= 30) return '🔥🔥🔥'
  if (streak >= 7) return '🔥🔥'
  if (streak >= 3) return '🔥'
  return '🔥'
}

export function FullscreenPage() {
  const navigate = useNavigate()
  const user = useUser()
  const store = useTimerStore()
  const { state, remainingSeconds, elapsedSeconds, durationMinutes, activityType, sessionName, cycleCount, isStopwatch, strictMode } = store
  const [bgIndex, setBgIndex] = useState(0)
  const [soloMode, setSoloMode] = useState(false)
  const [floatXp, setFloatXp] = useState(0)
  const [streak, setStreak] = useState(0)
  const [xpGained, setXpGained] = useState(0)
  const [sessionsToday, setSessionsToday] = useState(0)
  const prevStateRef = useRef(state)
  const cursorTimerRef = useRef<number | undefined>(undefined)
  const slideshowRef = useRef<number | undefined>(undefined)
  const scoreTimerRef = useRef<number | undefined>(undefined)

  const pickBg = useCallback(() => {
    setBgIndex((prev) => {
      let next: number
      do { next = Math.floor(Math.random() * (bgImages.length || GRADIENTS.length)) }
      while (next === prev && (bgImages.length || GRADIENTS.length) > 1)
      return next
    })
  }, [])

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('sessions').select('id', { count: 'exact' }).eq('user_id', user.id).eq('state', 'completed').gte('started_at', today).then(({ count }: any) => setSessionsToday(count || 0))
    supabase.from('statistics').select('current_streak').eq('user_id', user.id).single().then(({ data }: any) => setStreak(data?.current_streak || 0))
  }, [user])

  useEffect(() => {
    if (state === 'IDLE') { navigate('/focus'); return }
    pickBg()
    slideshowRef.current = window.setInterval(pickBg, 18000)
    document.documentElement.requestFullscreen?.().catch(() => {})
    setXpGained(50 + Math.round(durationMinutes * 1))
    return () => {
      clearInterval(slideshowRef.current)
      clearTimeout(scoreTimerRef.current)
      document.body.style.cursor = 'default'
      if (document.fullscreenElement) document.exitFullscreen?.()
    }
  }, [])

  useEffect(() => {
    if (state === 'RUNNING' && remainingSeconds <= 10 && remainingSeconds > 0 && !isStopwatch) {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(1200, ctx.currentTime)
      gain.gain.setValueAtTime(0.04, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06)
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.06)
    }
  }, [remainingSeconds, state])

  useEffect(() => {
    const handleMove = () => {
      document.body.style.cursor = 'default'
      clearTimeout(cursorTimerRef.current)
      cursorTimerRef.current = window.setTimeout(() => { document.body.style.cursor = 'none' }, 3000)
    }
    window.addEventListener('mousemove', handleMove)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      clearTimeout(cursorTimerRef.current)
      document.body.style.cursor = 'default'
    }
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (strictMode) return
        sessionManager.cancel()
        navigate('/focus')
      }
      if (e.code === 'KeyH' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setSoloMode((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [strictMode])

  const prevState = prevStateRef.current
  prevStateRef.current = state
  const justFinished = prevState !== 'FINISHED' && state === 'FINISHED'
  const justCancelled = prevState !== 'CANCELLED' && state === 'CANCELLED' || state === 'IDLE'

  useEffect(() => {
    if (justFinished) {
      setFloatXp(xpGained)
      setTimeout(() => setFloatXp(0), 3000)
      scoreTimerRef.current = window.setTimeout(() => navigate('/focus'), 2500)
    }
    if (justCancelled) navigate('/focus')
  }, [state])

  const displaySeconds = isStopwatch ? elapsedSeconds : remainingSeconds
  const totalSeconds = durationMinutes * 60
  const pct = totalSeconds > 0 ? (elapsedSeconds / totalSeconds) * 100 : 0
  const pc = progressColor(pct, state)
  const ringColor = pc.color
  const stateColor = state === 'RUNNING' ? '#28C76F' : state === 'PAUSED' ? '#FF9F43' : state === 'FINISHED' ? '#00CFE8' : state === 'CANCELLED' ? '#EA5455' : '#A8E6CF'
  const stateLabel = state === 'IDLE' ? 'Listo' : state === 'RUNNING' ? 'En curso' : state === 'PAUSED' ? 'Pausado' : state === 'FINISHED' ? 'Completado' : 'Cancelado'
  const showBreathing = state === 'PAUSED'
  const showMiniStats = state === 'RUNNING' || state === 'PAUSED'
  const showScore = state === 'FINISHED'
  const canStart = state === 'IDLE' || state === 'FINISHED' || state === 'CANCELLED'
  const primaryLabel = canStart ? 'Iniciar' : state === 'RUNNING' ? 'Pausar' : 'Reanudar'
  const cancelDisabled = state === 'IDLE' || state === 'FINISHED' || state === 'CANCELLED' || strictMode
  const score = calculateScore(elapsedSeconds, totalSeconds, cycleCount)
  const name = sessionName || activityType || '—'
  const hasImages = bgImages.length > 0

  return (
    <div id="fullscreenOverlay" className="fixed inset-0 z-[2000] flex items-center justify-center overflow-hidden bg-black select-none">

      <div id="fullscreenBg" key={bgIndex} className={`absolute inset-0 bg-cover bg-center z-0 animate-[bgFadeIn_1s_ease] ${soloMode ? 'opacity-0' : ''}`}
        style={{ backgroundImage: hasImages ? `url(${bgImages[bgIndex % bgImages.length]})` : GRADIENTS[bgIndex % GRADIENTS.length] }} />

      {!soloMode && <div className="absolute inset-0 bg-black/40 z-[1]" />}
      {soloMode && <div className="absolute inset-0 bg-black z-[1]" />}

      {!soloMode && (
        <div id="fullscreenContent" className="relative z-[2] flex flex-col items-center gap-5 max-w-[650px] w-1/2 animate-[fullscreenEnter_500ms_ease]">
          <div id="fullscreenName" className="text-[22px] font-medium text-white/60 text-center min-h-[1.5em] drop-shadow-lg">{name}</div>

          {floatXp > 0 && <div className="text-accent text-xl font-bold animate-[floatUp_2.5s_ease-out] pointer-events-none">+{floatXp} XP</div>}

          {cycleCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-white/50">
              <span>🔄 Ciclo {cycleCount}/{cycleCount}</span>
              <div className="flex gap-1">
                {Array.from({ length: cycleCount }, (_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${i < cycleCount ? 'bg-accent' : 'bg-white/10'}`} />
                ))}
              </div>
            </div>
          )}

          {showBreathing && (
            <div id="fullscreenBreathe" className="flex flex-col items-center gap-5 animate-[breatheFadeIn_0.5s_ease]">
              <div className="w-20 h-20 rounded-full border-2 animate-[breathe_8s_ease-in-out_infinite]" style={{ borderColor: 'rgba(255,255,255,0.3)', boxShadow: '0 0 30px rgba(96,165,250,0.15)' }} />
              <span id="breatheText" className="text-2xl font-light tracking-[4px] uppercase" style={{ color: 'rgba(255,255,255,0.7)', textShadow: '0 0 20px rgba(96,165,250,0.2)' }}>Inhala · Exhala</span>
            </div>
          )}

          {showScore && (
            <div id="fullscreenScore" className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 animate-[scoreFadeIn_0.3s_ease]">
              <div id="scoreNumber" className="text-[120px] font-extrabold drop-shadow-lg" style={{ color: stateColor, textShadow: `0 0 40px ${stateColor}50` }}>{score}</div>
              <div id="scoreLabel" className="text-lg tracking-[6px] uppercase text-white/60 mt-2">FOCUS SCORE</div>
            </div>
          )}

          <div id="fullscreenProgress" className="w-full h-[3px] bg-white/10 rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-500 ease" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: ringColor }} />
          </div>

          <div id="fullscreenInfo" className="flex gap-4 text-lg text-white/60">
            <span>{stateLabel}</span><span className="opacity-40">·</span>
            <span>{formatTime(elapsedSeconds)}</span><span className="opacity-40">/</span>
            <span>{formatTime(totalSeconds)}</span><span className="opacity-40">·</span>
            <span style={{ color: ringColor }}>{Math.round(pct)}% <span className="text-white/40 text-sm">{pc.label}</span></span>
          </div>

          {showMiniStats && (
            <div id="fullscreenMiniStats" className="flex items-center gap-0 text-lg text-white/70 animate-[breatheFadeIn_0.3s_ease]">
              <span className="px-5 border-r border-white/10">{streakEmoji(streak)} <span id="fsStreak">{streak}</span></span>
              <span className="px-5 border-r border-white/10">⚡ <span id="fsXp">{xpGained}</span> XP</span>
              <span className="px-5 border-r border-white/10">📊 <span id="fsToday">{sessionsToday}</span> hoy</span>
              <span className="px-5">🎯 {sessionsToday}/4 ses</span>
            </div>
          )}

          <div id="fullscreenActions" className="flex gap-3 w-full justify-center">
            <button id="fullscreenPrimary" onClick={() => {
              if (canStart) { sessionManager.startSession(isStopwatch ? 480 : durationMinutes, activityType, sessionName, strictMode, false); playStartSound() }
              else if (state === 'RUNNING') sessionManager.pause()
              else sessionManager.resume()
            }}
              className="flex items-center gap-2.5 px-10 py-3.5 rounded-xl text-base font-medium bg-[#156390] hover:bg-[#1a7ab5] text-white transition-all active:scale-[0.97] shadow-lg shadow-black/30">
              <span className="text-xl">{state === 'RUNNING' ? '⏸' : '▶'}</span><span>{primaryLabel}</span>
            </button>
            <button id="fullscreenCancel" disabled={cancelDisabled}
              onClick={() => { if (!strictMode) { sessionManager.cancel(); navigate('/focus') } }}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-medium border transition-all active:scale-[0.97] ${cancelDisabled ? 'border-white/5 text-white/20 cursor-not-allowed' : 'border-white/20 text-white/60 hover:text-white/90 hover:border-white/40 cursor-pointer'}`}>
              <span>✕</span><span>Cancelar</span>
            </button>
          </div>
        </div>
      )}

      <div id="fullscreenTimerRingContainer"
        className={soloMode ? 'fixed inset-0 z-[2] flex items-center justify-center' : 'relative z-[2]'}
        style={{ width: soloMode ? 'min(80vw, 80vh)' : '360px', height: soloMode ? 'min(80vw, 80vh)' : '360px' }}>
        <div className="relative w-full h-full">
          <div id="fullscreenRingTrack" className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(${ringColor}18 0deg, ${ringColor}18 360deg)`,
              WebkitMask: 'radial-gradient(circle at center, transparent 65%, black 65%)',
              mask: 'radial-gradient(circle at center, transparent 65%, black 65%)',
            }} />
          <div id="fullscreenRingFill" className="absolute inset-0 rounded-full transition-all duration-300"
            style={{
              background: `conic-gradient(${ringColor} ${Math.max(0.5, pct)}%, rgba(255,255,255,0.04) ${Math.max(0.5, pct)}%)`,
              WebkitMask: 'radial-gradient(circle at center, transparent 65%, black 65%)',
              mask: 'radial-gradient(circle at center, transparent 65%, black 65%)',
              filter: `drop-shadow(0 0 8px ${ringColor}50)`,
            }} />
          <div id="fullscreenTimer"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-bold drop-shadow-lg transition-opacity duration-300"
            style={{ fontSize: soloMode ? 'clamp(3rem, 15vw, 8rem)' : '80px', color: showScore ? 'rgba(255,255,255,0.2)' : stateColor, textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            {formatTime(displaySeconds)}
          </div>
        </div>
      </div>

      <button onClick={() => navigate('/focus')} id="fullscreenExit"
        className="fixed top-5 right-5 z-[3] w-10 h-10 rounded-full bg-transparent border border-white/20 text-white/50 hover:text-white/90 hover:bg-white/10 flex items-center justify-center transition-all text-base">⛶</button>

      <button onClick={() => setSoloMode((v) => !v)}
        className="fixed top-5 right-16 z-[3] text-white/30 hover:text-white/70 text-xs transition-colors" title="Modo solo círculo (Ctrl+H)">
        {soloMode ? '🔲' : '◯'}
      </button>

      <style>{`
        @keyframes fullscreenEnter {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes breatheFadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(0.8); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        @keyframes scoreFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bgFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.3); }
        }
      `}</style>
    </div>
  )
}
