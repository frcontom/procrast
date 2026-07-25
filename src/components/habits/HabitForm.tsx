import { useState } from 'react'

interface Props {
  onSave: (data: { name: string }) => void
  onClose: () => void
}

export function HabitForm({ onSave, onClose }: Props) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim() })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-card rounded-xl border border-white/10 p-5 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-sm font-semibold text-white mb-4">Nuevo hábito</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del hábito"
            className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-white"
            autoFocus required />

          <div className="flex gap-2.5">
            <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-accent hover:bg-[var(--accent-hover)] text-white transition-all active:scale-[0.97] shadow-lg shadow-accent/20">
              + Crear
            </button>
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium border border-white/10 text-text-secondary hover:text-white hover:border-white/30 hover:bg-white/5 transition-all active:scale-[0.97]">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
