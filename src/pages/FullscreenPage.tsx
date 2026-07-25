import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTimerStore } from '../store/useTimerStore'
import { sessionManager } from '../lib/sessionManager'
import { playStartSound } from '../lib/sound'
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

const MOTIVATION_LISTS = [
  ['Decide','Enfoca','Ejecuta','Resiste','Termina'],
  ['Inicia','Enfoca','Fluye','Persiste','Conquista'],
  ['Acción','Enfoque','Impulso','Disciplina','Victoria'],
  ['Inicia','Enfoca','Fluye','Persiste','Logra'],
  ['Empieza','Concentra','Avanza','Persiste','Finaliza'],
  ['Ahora','Enfoca','Progresa','Resiste','Logrado'],
  ['Rompe','Entra','Fluye','Resiste','Conquista'],
  ['Acción','Control','Ritmo','Constancia','Éxito'],
  ['Despierta','Enfoca','Produce','Persiste','Vence'],
  ['Atrévete','Avanza','Impulsa','Resiste','Triunfa'],
  ['Comienza','Enfoca','Construye','Persevera','Domina'],
  ['Respira','Entra','Fluye','Mantente','Cumple'],
  ['Orden','Acción','Progreso','Disciplina','Victoria'],
  ['Decide','Compromiso','Acción','Persistencia','Meta'],
  ['Inicia','Concentra','Produce','Mantén','Termina'],
  ['Activa','Enfoca','Ejecuta','Completa','Celebra'],
  ['Empieza','Conquista','Impulso','Persistencia','Logro'],
  ['Muévete','Enfoca','Avanza','Resiste','Gana'],
  ['Hoy','Aquí','Enfoque','Constancia','Cumplido'],
  ['Levántate','Apunta','Avanza','Resiste','Vence'],
  ['Crea','Construye','Fortalece','Persevera','Domina'],
  ['Piensa','Decide','Ejecuta','Persiste','Cumple'],
  ['Control','Calma','Fluye','Constancia','Resultado'],
  ['Enciende','Concentra','Profundiza','Resiste','Finaliza'],
  ['Empieza','Produce','Progresa','Remata','Victoria'],
  ['Acción','Entra','Fluye','Resiste','Conquista'],
  ['Inicia','Impulso','Ritmo','Disciplina','Éxito'],
  ['Vamos','Enfoque','Avanza','Persiste','Logrado'],
  ['Hazlo','Sigue','Continúa','Resiste','Termina'],
  ['Despega','Acelera','Mantén','Empuja','Conquista'],
  ['Inicia','Crece','Fortalece','Supera','Domina'],
]

function calculateScore(elapsed: number, total: number, cycleCount: number): number {
  const base = 50
  const completion = Math.round((elapsed / Math.max(total, 1)) * 30)
  const cycleBonus = cycleCount > 0 ? 10 : 0
  return Math.min(100, base + completion + cycleBonus)
}

function celebrationMessage(duration: number, streak: number, sessionsToday: number, score: number): string {
  if (score >= 90) return `¡Imparable! ${duration} min de enfoque absoluto. ${streak > 0 ? `${streak} días seguidos.` : ''} Sigue así, esta racha te llevará lejos.`
  if (score >= 70) return `Muy bien! ${duration} min completados. ${sessionsToday > 0 ? `Ya llevas ${sessionsToday} sesión${sessionsToday > 1 ? 'es' : ''} hoy.` : ''} Un paso más cerca de tu meta.`
  if (score >= 50) return `Buen inicio! ${duration} min de trabajo. La constancia construye resultados. ¿Listo para la siguiente?`
  return `${duration} min completados. Cada sesión cuenta. Sigue acumulando minutos de enfoque.`
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

function SparkleBurst({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    let animId = 0
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = []
    let elapsed = 0
    const animate = () => {
      elapsed++
      if (elapsed % 90 === 0 && particles.length < 120) {
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2
          const speed = 2 + Math.random() * 5
          particles.push({
            x: c.width / 2, y: c.height / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            r: 2 + Math.random() * 4,
            alpha: 1,
          })
        }
      }
      ctx.clearRect(0, 0, c.width, c.height)
      ctx.shadowBlur = 8
      ctx.shadowColor = color
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.alpha -= 0.008
        if (p.alpha <= 0) { particles.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      }
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-30" />
}

export function FullscreenPage() {
  const navigate = useNavigate()
  const store = useTimerStore()
  const { state, remainingSeconds, elapsedSeconds, durationMinutes, activityType, sessionName, cycleCount, cycleTotal, isStopwatch, strictMode, returnGoalId, returnGoalName } = store
  const [bgIndex, setBgIndex] = useState(0)
  const prevStateRef = useRef(state)
  const cursorTimerRef = useRef<number | undefined>(undefined)
  const slideshowRef = useRef<number | undefined>(undefined)
  const scoreTimerRef = useRef<number | undefined>(undefined)
  const [streak, setStreak] = useState(0)
  const [xpGained, setXpGained] = useState(0)
  const [floatXp, setFloatXp] = useState(0)
  const [sessionsToday, setSessionsToday] = useState(0)
  const [motivationList] = useState(() => MOTIVATION_LISTS[Math.floor(Math.random() * MOTIVATION_LISTS.length)])
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const pickBg = useCallback(() => {
    setBgIndex((prev) => {
      let next: number
      do { next = Math.floor(Math.random() * GRADIENTS.length) }
      while (next === prev && GRADIENTS.length > 1)
      return next
    })
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
        setShowCancelConfirm(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [strictMode])

  const handleCancel = () => {
    sessionManager.cancel()
    if (returnGoalId) navigate(`/tasks?goal=${returnGoalId}`)
    else navigate('/focus')
  }

  const prevState = prevStateRef.current
  prevStateRef.current = state
  const justFinished = prevState !== 'FINISHED' && state === 'FINISHED'
  const justCancelled = prevState !== 'CANCELLED' && state === 'CANCELLED' || state === 'IDLE'

  useEffect(() => {
    if (justFinished) {
      setFloatXp(xpGained)
      setTimeout(() => setFloatXp(0), 3000)
    }
    if (justCancelled) {
      navigate('/focus')
    }
  }, [state])

  const displaySeconds = isStopwatch ? elapsedSeconds : remainingSeconds
  const totalSeconds = durationMinutes * 60
  const pct = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 0

  const stateColor = state === 'RUNNING' ? '#28C76F' :
    state === 'PAUSED' ? '#FF9F43' :
    state === 'FINISHED' ? '#00CFE8' :
    state === 'CANCELLED' ? '#EA5455' : '#A8E6CF'

  const pc = progressColor(pct, state)
  const ringColor = pc.color
  const progressLabel = pc.label

  const stateLabel = state === 'IDLE' ? 'Listo' :
    state === 'RUNNING' ? 'En curso' :
    state === 'PAUSED' ? 'Pausado' :
    state === 'FINISHED' ? 'Completado' : 'Cancelado'

  const showBreathing = state === 'PAUSED'
  const showMiniStats = state === 'RUNNING' || state === 'PAUSED'
  const showCelebration = state === 'FINISHED'

  const canStart = state === 'IDLE' || state === 'FINISHED' || state === 'CANCELLED'
  const primaryLabel = canStart ? 'Iniciar' : state === 'RUNNING' ? 'Pausar' : 'Reanudar'
  const cancelDisabled = state === 'IDLE' || state === 'FINISHED' || state === 'CANCELLED' || strictMode

  const score = calculateScore(elapsedSeconds, totalSeconds, cycleCount)
  const name = sessionName || activityType || '—'

  const images = bgImages
  const hasImages = images.length > 0

  return (
    <div id="fullscreenOverlay" className="fixed inset-0 z-[2000] flex items-center justify-end overflow-hidden bg-black select-none">
      <div id="fullscreenBg" key={bgIndex} className="absolute inset-0 bg-contain bg-center bg-no-repeat z-0 animate-[bgFadeIn_1s_ease]"
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

        {floatXp > 0 && (
          <div className="text-accent text-xl font-bold animate-[floatUp_2.5s_ease-out] pointer-events-none">
            +{floatXp} XP
          </div>
        )}

        <div id="fullscreenTimerRingContainer" className="relative w-[360px] h-[360px]">
          <div id="fullscreenRingTrack"
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(${ringColor}18 0deg, ${ringColor}18 360deg)`,
              WebkitMask: 'radial-gradient(circle at center, transparent 68%, black 68%)',
              mask: 'radial-gradient(circle at center, transparent 68%, black 68%)',
            }}
          />
          <div id="fullscreenRingFill"
            className="absolute inset-0 rounded-full transition-all duration-300"
            style={{
              background: `conic-gradient(from 0deg, rgba(255,255,255,0.04) ${100 - Math.max(0.5, pct)}%, ${ringColor} ${100 - Math.max(0.5, pct)}%)`,
              WebkitMask: 'radial-gradient(circle at center, transparent 68%, black 68%)',
              mask: 'radial-gradient(circle at center, transparent 68%, black 68%)',
              filter: 'drop-shadow(0 0 8px ' + ringColor + '50)',
            }}
          />
          <div id="fullscreenTimer"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[80px] font-bold drop-shadow-lg transition-opacity duration-300"
            style={{ color: showCelebration ? 'rgba(255,255,255,0.2)' : stateColor, textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            {formatTime(displaySeconds)}
          </div>
        </div>

        {showBreathing && (
          <div id="fullscreenBreathe" className="flex flex-col items-center gap-5 animate-[breatheFadeIn_0.5s_ease]">
            <div className="w-20 h-20 rounded-full border-2 animate-[breathe_8s_ease-in-out_infinite]"
              style={{ borderColor: 'rgba(255,255,255,0.3)', boxShadow: '0 0 30px rgba(96,165,250,0.15)' }} />
            <span id="breatheText" className="text-2xl font-light tracking-[4px] uppercase"
              style={{ color: 'rgba(255,255,255,0.7)', textShadow: '0 0 20px rgba(96,165,250,0.2)' }}>
              Inhala · Exhala
            </span>
          </div>
        )}

        {/* Segmented progress timeline */}
        {totalSeconds > 0 && (() => {
          const segCount = motivationList.length
          const segSeconds = totalSeconds / segCount
          const segLabels = motivationList
          return (
            <div id="fullscreenProgress" className="w-full">
              <div className="flex gap-1.5">
              {Array.from({ length: segCount }).map((_, i) => {
                const segStart = i * segSeconds
                const segEnd = (i + 1) * segSeconds
                const filled = Math.max(0, Math.min(1, (elapsedSeconds - segStart) / segSeconds))
                const isComplete = elapsedSeconds >= segEnd
                const isCurrent = elapsedSeconds >= segStart && elapsedSeconds < segEnd
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full h-[8px] rounded-full transition-all duration-500 relative overflow-hidden bg-white/[0.04]">
                      <div className={`absolute inset-0 rounded-full transition-all duration-500 ${isComplete ? 'bg-[#28C76F]' : ''}`} />
                      {isCurrent && (
                        <div className="absolute inset-0 rounded-full transition-all duration-300"
                          style={{ width: `${filled * 100}%`, background: 'linear-gradient(90deg, #A66CFF, #b388ff)' }} />
                      )}
                    </div>
                    <span className={`text-[11px] text-center leading-tight font-medium tracking-wide transition-all duration-500 ${
                      isComplete ? 'text-[#28C76F]' : isCurrent ? 'text-white' : 'text-white/20'
                    }`}>
                      {segLabels[i % segLabels.length] || ''}
                    </span>
                  </div>
                )
              })}
              </div>
            </div>
          )
        })()}

        <div id="fullscreenInfo" className="flex gap-4 text-lg text-white/60">
          <span>{stateLabel}</span>
          <span className="opacity-40">·</span>
          <span>{formatTime(elapsedSeconds)}</span>
          <span className="opacity-40">/</span>
          <span>{formatTime(totalSeconds)}</span>
          <span className="opacity-40">·</span>
          <span style={{ color: ringColor }}>{Math.round(pct)}% <span className="text-white/40 text-sm">{progressLabel}</span></span>
        </div>

        {showMiniStats && (
          <div id="fullscreenMiniStats" className="flex items-center gap-0 text-lg text-white/70 animate-[breatheFadeIn_0.3s_ease]">
            <span className="px-5 border-r border-white/10">{streakEmoji(streak)} <span id="fsStreak">{streak}</span></span>
            <span className="px-5 border-r border-white/10">⚡ <span id="fsXp">{xpGained}</span> XP</span>
            <span className="px-5 border-r border-white/10">📊 <span id="fsToday">{sessionsToday}</span> hoy</span>
            {cycleTotal > 0 && <span className="px-5">🔄 {cycleCount}/{cycleTotal}</span>}
          </div>
        )}



        {!showCelebration && (
          <div id="fullscreenActions" className="flex gap-3 w-full justify-center">
            <button id="fullscreenPrimary"
              onClick={() => {
                if (canStart) { sessionManager.startSession(isStopwatch ? 480 : durationMinutes, activityType, sessionName, strictMode, false); playStartSound() }
                else if (state === 'RUNNING') sessionManager.pause()
                else sessionManager.resume()
              }}
              className="flex items-center gap-2.5 px-10 py-3.5 rounded-xl text-base font-medium bg-[#156390] hover:bg-[#1a7ab5] text-white transition-all active:scale-[0.97] shadow-lg shadow-black/30">
              <span className="text-xl">{state === 'RUNNING' ? '⏸' : '▶'}</span>
              <span>{primaryLabel}</span>
            </button>
            <button id="fullscreenCancel"
              disabled={cancelDisabled}
              onClick={() => { if (!strictMode) setShowCancelConfirm(true) }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border transition-all active:scale-[0.97] ${cancelDisabled ? 'border-white/5 text-white/20 cursor-not-allowed' : 'border-white/20 text-white/60 hover:text-white/90 hover:border-white/40 cursor-pointer'}`}>
              <span>✕</span>
              <span>Cancelar</span>
            </button>
          </div>
        )}

        {!showCelebration && cycleCount > 0 && store.phase !== 'work' && (
          <div className="relative z-[2] flex justify-center mt-1">
            <button onClick={() => {
              const engine = sessionManager.getEngine()
              engine.reset()
              const wd = store.workDuration > 0 ? store.workDuration : durationMinutes
              store.setCycleCount(store.cycleCount + 1)
              store.setPhase('work')
              store.setDuration(wd)
              sessionManager.startSession(wd, activityType, sessionName, strictMode, false)
              playStartSound()
            }}
              className="text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-4">
              ⏭ Saltar descanso
            </button>
          </div>
        )}
      </div>

      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black gap-6 px-10">
          <SparkleBurst color={stateColor} />
          <div className="text-5xl mb-2">🎉</div>
          <div className="text-2xl font-semibold text-white tracking-wide">¡Sesión completada!</div>

          <div className="text-[100px] font-extrabold leading-none" style={{ color: stateColor, textShadow: `0 0 50px ${stateColor}50` }}>
            {score}
          </div>
          <div className="text-base tracking-[6px] uppercase text-white/50 -mt-2">FOCUS SCORE</div>

          <div className="max-w-md text-center text-base text-white/70 leading-relaxed mt-2">
            {celebrationMessage(durationMinutes, streak, sessionsToday, score)}
          </div>

          <div className="flex items-center gap-6 text-sm text-white/60 mt-2">
            <span className="flex items-center gap-1.5">⚡ +{xpGained} XP</span>
            <span className="flex items-center gap-1.5">{streakEmoji(streak)} {streak} días</span>
            <span className="flex items-center gap-1.5">📊 {sessionsToday} hoy</span>
          </div>

          <div className="flex gap-3 mt-4">
            <button onClick={() => { sessionManager.startSession(isStopwatch ? 480 : durationMinutes, activityType, sessionName, strictMode, false); playStartSound() }}
              className="px-8 py-3 rounded-xl text-sm font-medium bg-[#156390] hover:bg-[#1a7ab5] text-white transition-all active:scale-[0.97]">
              ▶ Siguiente
            </button>
            <button onClick={() => navigate('/focus')}
              className="px-8 py-3 rounded-xl text-sm font-medium border border-white/20 text-white/60 hover:text-white/90 hover:border-white/40 transition-all active:scale-[0.97]">
              Ir a Focus
            </button>
            {returnGoalId && (
              <button onClick={() => navigate(`/tasks?goal=${returnGoalId}`)}
                className="px-8 py-3 rounded-xl text-sm font-medium border border-accent/40 text-accent hover:text-accent/80 hover:border-accent/60 transition-all active:scale-[0.97]">
                📋 {returnGoalName || 'Ir a la tarea'}
              </button>
            )}
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70" onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-card rounded-xl border border-white/10 p-6 w-full max-w-sm mx-4 shadow-2xl text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-4xl mb-3">😤</div>
            <h3 className="text-base font-semibold text-white mb-1">¿Rendirte?</h3>
            <p className="text-xs text-text-secondary mb-5">Si cancelas ahora, perderás el progreso de esta sesión.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium bg-secondary hover:bg-white/10 text-text-secondary hover:text-white transition-all">
                Seguir
              </button>
              <button onClick={handleCancel}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium bg-danger hover:bg-danger/80 text-white transition-all">
                Rendirme 😤
              </button>
            </div>
            {returnGoalName && (
              <p className="text-[10px] text-text-secondary/40 mt-3">Volverás a: {returnGoalName}</p>
            )}
          </div>
        </div>
      )}

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
        @keyframes bgFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-60px) scale(1.3); }
        }
      `}</style>
    </div>
  )
}
