import { useState } from 'react'
import type { TaskGoal } from '../../supabase/types'

interface Props {
  goal?: TaskGoal | null
  onSave: (data: GoalFormData) => void
  onClose: () => void
}

export interface GoalFormData {
  name: string
  description: string
  deadline: string
  start_date: string
  estimated_minutes: number
  priority: 'critical' | 'high' | 'normal' | 'low'
  color: string
  icon: string
}

const COLORS = ['#FF6B6B', '#4CAF50', '#A66CFF', '#FF9800', '#156390', '#E91E63', '#00BCD4', '#8BC34A']

export function GoalForm({ goal, onSave, onClose }: Props) {
  const [form, setForm] = useState<GoalFormData>({
    name: goal?.name || '',
    description: goal?.description || '',
    deadline: goal?.deadline || '',
    start_date: goal?.start_date || new Date().toISOString().slice(0, 10),
    estimated_minutes: goal?.estimated_minutes || 60,
    priority: goal?.priority || 'normal',
    color: goal?.color || '#A66CFF',
    icon: goal?.icon || 'bi-bullseye',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.deadline) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">{goal ? 'Editar meta' : 'Nueva meta'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Nombre</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" required />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Inicio</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Deadline</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" required />
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Minutos estimados</label>
            <input type="number" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: Number(e.target.value) })}
              className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" min={1} />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Prioridad</label>
            <div className="flex gap-2">
              {(['critical', 'high', 'normal', 'low'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.priority === p ? 'bg-accent text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
                  {p === 'critical' ? 'Crítica' : p === 'high' ? 'Alta' : p === 'normal' ? 'Normal' : 'Baja'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  className={`w-6 h-6 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-white scale-125' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-accent hover:bg-[var(--accent-hover)] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex-1">
              {goal ? 'Guardar' : 'Crear meta'}
            </button>
            <button type="button" onClick={onClose} className="text-text-secondary hover:text-white text-sm px-4 py-2 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
