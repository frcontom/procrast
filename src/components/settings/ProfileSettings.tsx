interface Props {
  name: string
  activityType: string
  onNameChange: (name: string) => void
  onActivityChange: (type: string) => void
}

const ACTIVITY_TYPES = [
  { id: 'focus', label: 'Focus' },
  { id: 'deep_work', label: 'Deep Work' },
  { id: 'reading', label: 'Lectura' },
  { id: 'coding', label: 'Código' },
  { id: 'writing', label: 'Escritura' },
]

export function ProfileSettings({ name, activityType, onNameChange, onActivityChange }: Props) {
  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Perfil</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Nombre</label>
          <input type="text" value={name} onChange={(e) => onNameChange(e.target.value)}
            className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
        </div>

        <div>
          <label className="block text-xs text-text-secondary mb-1">Actividad predeterminada</label>
          <div className="flex gap-2">
            {ACTIVITY_TYPES.map((a) => (
              <button key={a.id} onClick={() => onActivityChange(a.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activityType === a.id ? 'bg-[var(--accent)] text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
