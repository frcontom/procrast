import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimerStore } from '../store/useTimerStore'
import { sessionManager } from '../lib/sessionManager'
import { playStartSound, playFinishSound } from '../lib/sound'
import { formatTime } from '../lib/formatters'

// @ts-ignore - Vite glob import
const bgImageModules = import.meta.glob('/src/assets/focus/*.png', { eager: true, query: '?url', import: 'default' })
const bgImages = Object.values(bgImageModules) as string[]

const GRADIENTS = [
  'linear-gradient(135deg,#0f0c29,#302b63,#24243e)',
  'linear-gradient(135deg,#000428,#004e92)',
  'linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)',
  'linear-gradient(135deg,#0d0d0d,#1a1a2e,#2d2d44)',
  'linear-gradient(135deg,#0b0b1a,#1a1a3e,#2a1a4e)',
  'linear-gradient(135deg,#0a0f1e,#0d1b3e,#162a4e)',
  'linear-gradient(135deg,#0f0f1a,#1a1a2e,#252540)',
  'linear-gradient(135deg,#0c0c1e,#1a1a3e,#282850)',
]

function calculateScore(elapsed: number, total: number, cycleCount: number): number {
  const base = 50
  const completion = Math.round((elapsed / Math.max(total, 1)) * 30)
  const cycleBonus = cycleCount > 0 ? 10 : 0
  return Math.min(100, base + completion + cycleBonus)
}

export function FullscreenPage() {
  const navigate = useNavigate()
  const store = useTimerStore()
  const { state, remainingSeconds, elapsedSeconds, durationMinutes, activityType, sessionName, cycleCount, isStopwatch, strictMode } = store
  const [bgIndex, setBgIndex] = useState(0)
  const prevStateRef = useRef(state)
  const cursorTimerRef = useRef<number | undefined>(undefined)
  const slideshowRef = useRef<number | undefined>(undefined)
  const scoreTimerRef = useRef<number | undefined>(undefined)
  const [streak, setStreak] = useState(0)
  const [xpGained, setXpGained] = useState(0)
  const [sessionsToday, setSessionsToday] = useState(0)

  const pickBg = useCallback(() => {
    setBgIndex((prev) => {
      let next: number
      do { next = Math.floor(Math.random() * GRADIENTS.length) }
      while (next === prev && GRADIENTS.length > 1)
      return next
    })
  }, [])

  useEffect(() => {
    const engine = sessionManager.getEngine()
    const unsubs = [
      engine.on('TICK', () => {}), // store auto-updates via Zustand
      engine.on('FINISH', async () => {
        await sessionManager.finish()
        playFinishSound()
        store.setFinishedAt(new Date().toISOString())
        store.setRemaining(0)
        store.setProgress(100)
      }),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  useEffect(() => {
    if (state === 'IDLE') { navigate('/focus'); return }
    pickBg()
    slideshowRef.current = setInterval(pickBg, 18000)
    document.documentElement.requestFullscreen?.().catch(() => {})

    setStreak(Math.floor(Math.random() * 10))
    setXpGained(50 + Math.round(durationMinutes * 1))
    setSessionsToday(Math.floor(Math.random() * 5) + 1)

    return () => {
      clearInterval(slideshowRef.current)
      clearTimeout(scoreTimerRef.current)
      document.body.style.cursor = 'default'
      if (document.fullscreenElement) document.exitFullscreen?.()
    }
  }, [])

  useEffect(() => {
    const handleMove = () => {
      document.body.style.cursor = 'default'
      clearTimeout(cursorTimerRef.current)
      cursorTimerRef.current = setTimeout(() => { document.body.style.cursor = 'none' }, 3000)
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
      scoreTimerRef.current = setTimeout(() => navigate('/focus'), 2500)
    }
    if (justCancelled) {
      navigate('/focus')
    }
  }, [state])

  const displaySeconds = isStopwatch ? elapsedSeconds : remainingSeconds
  const totalSeconds = durationMinutes * 60
  const pct = totalSeconds > 0 ? (elapsedSeconds / totalSeconds) * 100 : 0

  const stateColor = state === 'RUNNING' ? '#28C76F' :
    state === 'PAUSED' ? '#FF9F43' :
    state === 'FINISHED' ? '#00CFE8' :
    state === 'CANCELLED' ? '#EA5455' : '#A8E6CF'

  const stateLabel = state === 'IDLE' ? 'Listo' :
    state === 'RUNNING' ? 'En curso' :
    state === 'PAUSED' ? 'Pausado' :
    state === 'FINISHED' ? 'Completado' : 'Cancelado'

  const showBreathing = state === 'PAUSED'
  const showMiniStats = state === 'RUNNING' || state === 'PAUSED'
  const showScore = state === 'FINISHED'

  const canStart = state === 'IDLE' || state === 'FINISHED' || state === 'CANCELLED'
  const primaryLabel = canStart ? 'Iniciar' : state === 'RUNNING' ? 'Pausar' : 'Reanudar'
  const cancelDisabled = state === 'IDLE' || state === 'FINISHED' || state === 'CANCELLED' || strictMode

  const score = calculateScore(elapsedSeconds, totalSeconds, cycleCount)
  const name = sessionName || activityType || '—'

  const images = bgImages
  const hasImages = images.length > 0

  return (
    <div id="fullscreenOverlay" className="fixed inset-0 z-[2000] flex items-center justify-end overflow-hidden bg-black select-none">
      <div id="fullscreenBg" className="absolute inset-0 bg-cover bg-center transition-all duration-1000 z-0"
        style={{ backgroundImage: hasImages ? `url(${images[bgIndex % images.length]})` : GRADIENTS[bgIndex] }} />

      <div className="absolute inset-0 bg-black/40 z-[1]" />

      <button onClick={() => navigate('/focus')}
        id="fullscreenExit"
        className="fixed top-5 right-5 z-[3] w-10 h-10 rounded-full bg-transparent border border-white/20 text-white/50 hover:text-white/90 hover:bg-white/10 flex items-center justify-center transition-all text-base">
        ⛶
      </button>

      <div id="fullscreenContent"
        className="relative z-[2] flex flex-col items-center gap-5 max-w-[650px] w-1/2 pr-10 animate-[fullscreenEnter_500ms_ease]">

        <div id="fullscreenName" className="text-[22px] font-medium text-white/60 text-center min-h-[1.5em] drop-shadow-lg">
          {name}
        </div>

        <div id="fullscreenTimerRingContainer" className="relative w-[240px] h-[240px]">
          <div id="fullscreenRingTrack"
            className="absolute inset-0 rounded-full"
            style={{
              background: 'conic-gradient(rgba(255,255,255,0.06) 0deg, rgba(255,255,255,0.06) 360deg)',
              WebkitMask: 'radial-gradient(circle at center, transparent 68%, black 68%)',
              mask: 'radial-gradient(circle at center, transparent 68%, black 68%)',
            }}
          />
          <div id="fullscreenRingFill"
            className="absolute inset-0 rounded-full transition-all duration-300"
            style={{
              background: `conic-gradient(${stateColor} ${pct}%, transparent ${pct}%)`,
              WebkitMask: 'radial-gradient(circle at center, transparent 68%, black 68%)',
              mask: 'radial-gradient(circle at center, transparent 68%, black 68%)',
              filter: 'drop-shadow(0 0 6px ' + stateColor + '40)',
            }}
          />
          <div id="fullscreenTimer"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[52px] font-bold drop-shadow-lg transition-opacity duration-300"
            style={{ color: showScore ? 'rgba(255,255,255,0.2)' : stateColor, textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            {formatTime(displaySeconds)}
          </div>
        </div>

        {showBreathing && (
          <div id="fullscreenBreathe" className="flex flex-col items-center gap-5 animate-[breatheFadeIn_0.5s_ease]">
            <div className="w-20 h-20 rounded-full border-2 border-white/30 animate-[breathe_8s_ease-in-out_infinite]" />
            <span id="breatheText" className="text-2xl font-light text-white/70 tracking-[4px] uppercase">Inhala · Exhala</span>
          </div>
        )}

        {showScore && (
          <div id="fullscreenScore" className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 animate-[scoreFadeIn_0.3s_ease]">
            <div id="scoreNumber" className="text-[120px] font-extrabold drop-shadow-lg" style={{ color: stateColor, textShadow: `0 0 40px ${stateColor}50` }}>
              {score}
            </div>
            <div id="scoreLabel" className="text-lg tracking-[6px] uppercase text-white/60 mt-2">FOCUS SCORE</div>
          </div>
        )}

        <div id="fullscreenProgress" className="w-full h-[3px] bg-white/10 rounded overflow-hidden">
          <div className="h-full rounded transition-all duration-500 ease" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: stateColor }} />
        </div>

        <div id="fullscreenInfo" className="flex gap-2 text-sm text-white/50">
          <span>{stateLabel}</span>
          <span className="opacity-40">·</span>
          <span>{formatTime(elapsedSeconds)}</span>
          <span className="opacity-40">/</span>
          <span>{formatTime(totalSeconds)}</span>
        </div>

        {showMiniStats && (
          <div id="fullscreenMiniStats" className="flex gap-4 text-sm text-white/60 animate-[breatheFadeIn_0.3s_ease]">
            <span>🔥 <span id="fsStreak">{streak}</span></span>
            <span>⚡ <span id="fsXp">{xpGained}</span> XP</span>
            <span>📊 <span id="fsToday">{sessionsToday}</span> hoy</span>
          </div>
        )}



        <div id="fullscreenActions" className="flex gap-3 w-full justify-center">
          <button id="fullscreenPrimary"
            onClick={() => {
              if (canStart) { sessionManager.startSession(store.isStopwatch ? 480 : store.durationMinutes, store.activityType, store.sessionName, store.strictMode, false); playStartSound() }
              else if (state === 'RUNNING') sessionManager.pause()
              else sessionManager.resume()
            }}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium bg-accent hover:bg-[var(--accent-hover)] text-white transition-all active:scale-[0.97] shadow-lg">
            <span className="text-lg">{state === 'RUNNING' ? '⏸' : '▶'}</span>
            <span>{primaryLabel}</span>
          </button>
          <button id="fullscreenCancel"
            disabled={cancelDisabled}
            onClick={() => { if (!strictMode) { sessionManager.cancel(); navigate('/focus') } }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border transition-all active:scale-[0.97] ${cancelDisabled ? 'border-white/5 text-white/20 cursor-not-allowed' : 'border-white/20 text-white/60 hover:text-white/90 hover:border-white/40 cursor-pointer'}`}>
            <span>✕</span>
            <span>Cancelar</span>
          </button>
        </div>
      </div>

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
        @keyframes scoreFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
