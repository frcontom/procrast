import { useState } from 'react'

interface Props {
  monthKey: string
  onImport: (names: string[]) => void
  onClose: () => void
}

export function HabitMassImport({ monthKey, onImport, onClose }: Props) {
  const [text, setText] = useState('')
  const lines = text.trim().split('\n').filter(Boolean)

  const handleImport = () => {
    if (lines.length === 0) return
    onImport(lines)
    onClose()
  }

  const monthName = new Date(monthKey + '-01').toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-card rounded-xl border border-white/10 p-5 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-white">📄 Importación masiva</span>
          <button onClick={onClose} className="text-text-secondary hover:text-white text-lg leading-none">&times;</button>
        </div>

        <p className="text-[11px] text-text-secondary mb-3">
          Cada línea será un hábito nuevo para <strong className="text-white">{monthName}</strong>
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Meditar&#10;Leer 20 páginas&#10;Ejercicio 30min&#10;No azúcar"
          className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent resize-none"
          rows={8}
          autoFocus
        />

        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-xs font-medium bg-secondary hover:bg-white/10 text-text-secondary hover:text-white transition-all">
            Cancelar
          </button>
          <button onClick={handleImport} disabled={lines.length === 0}
            className="flex-1 px-4 py-2 rounded-lg text-xs font-medium bg-accent hover:bg-[var(--accent-hover)] text-white transition-all disabled:opacity-40">
            ✅ Importar {lines.length} hábito(s)
          </button>
        </div>
      </div>
    </div>
  )
}
