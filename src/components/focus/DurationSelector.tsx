import { useState } from 'react'

interface Props {
  value: number
  onChange: (minutes: number) => void
  disabled?: boolean
}

const PRESETS = [15, 25, 30, 45, 60, 90, 120]

export function DurationSelector({ value, onChange, disabled }: Props) {
  const [custom, setCustom] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const isStopwatch = value >= 480
  const isCustom = !PRESETS.includes(value) && value !== 480

  const selectPreset = (min: number) => {
    setShowCustom(false)
    onChange(min)
  }

  const selectStopwatch = () => {
    setShowCustom(false)
    onChange(480)
  }

  const applyCustom = () => {
    const v = parseInt(custom)
    if (v >= 1 && v <= 480) {
      onChange(v)
      setShowCustom(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {PRESETS.map((min) => (
          <button key={min} onClick={() => selectPreset(min)} disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              value === min && !isStopwatch && !isCustom
                ? 'bg-accent text-white'
                : 'bg-secondary text-text-secondary hover:text-white hover:bg-white/10'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {min}
          </button>
        ))}
        <button onClick={selectStopwatch} disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isStopwatch ? 'bg-accent text-white' : 'bg-secondary text-text-secondary hover:text-white hover:bg-white/10'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
          Sin límite
        </button>
        <button onClick={() => setShowCustom(!showCustom)} disabled={disabled}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            isCustom && !isStopwatch ? 'bg-accent text-white' : 'bg-secondary text-text-secondary hover:text-white hover:bg-white/10'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
          Personalizado
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input type="number" value={custom} onChange={(e) => setCustom(e.target.value)}
            min={1} max={480} placeholder="Minutos"
            className="w-24 bg-secondary border border-white/10 rounded-lg px-3 py-1.5 text-xs text-center focus:outline-none focus:border-accent" />
          <button onClick={applyCustom}
            className="bg-accent hover:bg-[var(--accent-hover)] text-white px-3 py-1.5 rounded-lg text-xs transition-colors">
            OK
          </button>
        </div>
      )}
    </div>
  )
}
