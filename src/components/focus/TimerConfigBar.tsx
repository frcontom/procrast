import { useState } from 'react'
import { useTimerStore } from '../../store/useTimerStore'

const DURATION_PRESETS = [15, 25, 30, 45, 60, 90, 120]

export function TimerConfigBar() {
  const store = useTimerStore()
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [customDuration, setCustomDuration] = useState('')
  const [showCustomActivity, setShowCustomActivity] = useState(false)
  const [customActivity, setCustomActivity] = useState('')

  const selectDuration = (v: number | string) => {
    if (v === 'custom') { setShowCustomDuration(true); return }
    if (v === 'infinity') { store.setDuration(480); return }
    setShowCustomDuration(false)
    store.setDuration(Number(v))
  }

  const applyCustomDuration = () => {
    const n = parseInt(customDuration)
    if (n >= 1 && n <= 480) store.setDuration(n)
    setShowCustomDuration(false)
    setCustomDuration('')
  }

  const selectActivity = (v: string) => {
    if (v === 'custom') { setShowCustomActivity(true); return }
    setShowCustomActivity(false)
    store.setActivityType(v)
  }

  const applyCustomActivity = () => {
    if (customActivity.trim()) store.setActivityType(customActivity.trim())
    setShowCustomActivity(false)
    setCustomActivity('')
  }

  const disabled = store.state !== 'IDLE' && store.state !== 'FINISHED' && store.state !== 'CANCELLED'
  const isStopwatch = store.durationMinutes >= 480

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3 flex-wrap justify-center">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-secondary uppercase tracking-wider">Actividad</span>
          {!showCustomActivity ? (
            <select value={store.activityType} onChange={(e) => selectActivity(e.target.value)} disabled={disabled}
              className="bg-[var(--bg-primary)] border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 text-text-secondary cursor-pointer disabled:opacity-40 transition-all appearance-none">
              <option value="estudio">📚 Estudio</option>
              <option value="programacion">💻 Programación</option>
              <option value="trading">📈 Trading</option>
              <option value="lectura">📖 Lectura</option>
              <option value="escritura">✍️ Escritura</option>
              <option value="trabajo">💼 Trabajo</option>
              <option value="custom">✨ Personalizado</option>
            </select>
          ) : (
            <div className="flex items-center gap-1">
              <input type="text" value={customActivity} onChange={(e) => setCustomActivity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyCustomActivity()} placeholder="Nombre..." autoFocus
                className="bg-[var(--bg-primary)] border border-accent/50 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-accent w-28" />
              <button onClick={applyCustomActivity} className="text-accent hover:text-white text-xs">✓</button>
              <button onClick={() => setShowCustomActivity(false)} className="text-text-secondary hover:text-white text-xs">✕</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <span className="text-[10px] text-text-secondary uppercase tracking-wider">Duración</span>
        {DURATION_PRESETS.map((min) => (
          <button key={min} onClick={() => selectDuration(min)} disabled={disabled}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              store.durationMinutes === min && !isStopwatch && !showCustomDuration
                ? 'bg-accent text-white shadow-sm shadow-accent/30'
                : 'bg-[var(--bg-primary)] text-text-secondary hover:text-white hover:bg-white/5 border border-white/5'
            } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}>
            {min < 60 ? `${min}min` : `${min / 60}h`}
          </button>
        ))}
        <button onClick={() => selectDuration('infinity')} disabled={disabled}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isStopwatch ? 'bg-accent text-white shadow-sm shadow-accent/30' : 'bg-[var(--bg-primary)] text-text-secondary hover:text-white hover:bg-white/5 border border-white/5'
          } ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}>
          ∞
        </button>
        {!showCustomDuration ? (
          <button onClick={() => selectDuration('custom')} disabled={disabled}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all bg-[var(--bg-primary)] text-text-secondary hover:text-white hover:bg-white/5 border border-white/5 ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}>
            ✎
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input type="number" value={customDuration} onChange={(e) => setCustomDuration(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyCustomDuration()} min={1} max={480} placeholder="min" autoFocus
              className="w-16 bg-[var(--bg-primary)] border border-accent/50 rounded-lg px-2 py-1.5 text-xs focus:outline-none" />
            <button onClick={applyCustomDuration} className="text-accent hover:text-white text-xs">✓</button>
            <button onClick={() => setShowCustomDuration(false)} className="text-text-secondary hover:text-white text-xs">✕</button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] text-text-secondary uppercase tracking-wider">Ciclos</span>
        <select value={store.cycleTotal} onChange={(e) => store.setCycleTotal(Number(e.target.value))} disabled={disabled}
          className="bg-[var(--bg-primary)] border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-accent text-text-secondary cursor-pointer disabled:opacity-40 transition-all appearance-none">
          <option value="0">Off</option>
          <option value="2">2</option>
          <option value="4">4</option>
          <option value="6">6</option>
          <option value="8">8</option>
        </select>
        {store.cycleTotal > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-secondary">{store.cycleCount}/{store.cycleTotal}</span>
            <div className="flex gap-0.5">
              {Array.from({ length: store.cycleTotal }, (_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < store.cycleCount ? 'bg-accent' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
