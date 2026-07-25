import { useState } from 'react'

interface Props {
  initialName?: string
  onSave: (data: { name: string }) => void
  onClose: () => void
}

export function HabitForm({ initialName, onSave, onClose }: Props) {
  const [name, setName] = useState(initialName || '')
  const isEdit = !!initialName

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card rounded-xl border border-white/10 p-5 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-semibold text-white mb-4">{isEdit ? 'Editar hábito' : 'Nuevo hábito'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del hábito"
            className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-white"
            autoFocus required />

          <div className="flex gap-2.5">
            <button type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all active:scale-[0.97]"
              style={{ backgroundColor: 'var(--accent)', boxShadow: '0 4px 14px rgba(166,108,255,0.25)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}>
              {isEdit ? 'Guardar' : '+ Crear'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium text-text-secondary hover:text-white transition-all active:scale-[0.97]"
              style={{ border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.backgroundColor = 'transparent' }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
