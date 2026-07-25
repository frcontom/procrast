import { useState } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  customActivities?: string[]
  onAddCustom?: (v: string) => void
}

const DEFAULT_ACTIVITIES = [
  { id: 'estudio', label: '📚 Estudio' },
  { id: 'programacion', label: '💻 Programación' },
  { id: 'trading', label: '📈 Trading' },
  { id: 'lectura', label: '📖 Lectura' },
  { id: 'escritura', label: '✍️ Escritura' },
  { id: 'trabajo', label: '💼 Trabajo' },
]

export function ActivitySelector({ value, onChange, disabled, customActivities = [], onAddCustom }: Props) {
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')

  const allActivities = [
    ...DEFAULT_ACTIVITIES,
    ...customActivities.map((a) => ({ id: a, label: a })),
  ]

  const addCustom = () => {
    if (customName.trim() && onAddCustom) {
      onAddCustom(customName.trim())
      onChange(customName.trim())
      setCustomName('')
      setShowCustom(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {allActivities.map((act) => (
          <button key={act.id} onClick={() => onChange(act.id)} disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              value === act.id
                ? 'bg-accent/20 text-accent border border-accent/50'
                : 'bg-secondary text-text-secondary hover:text-white hover:bg-white/10'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
            {act.label}
          </button>
        ))}
        <button onClick={() => setShowCustom(!showCustom)} disabled={disabled}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-text-secondary hover:text-white hover:bg-white/10 transition-colors">
          + Personalizado
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)}
            placeholder="Nombre de actividad"
            className="w-40 bg-secondary border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent" />
          <button onClick={addCustom}
            className="bg-accent hover:bg-[var(--accent-hover)] text-white px-3 py-1.5 rounded-lg text-xs transition-colors">
            Añadir
          </button>
        </div>
      )}
    </div>
  )
}
