import type { CalendarActivity } from '../../supabase/types'
import { Modal } from '../shared/Modal'

interface Props {
  open: boolean
  date: string
  activities: CalendarActivity[]
  onToggle: (id: string, done: boolean) => void
  onEdit: (a: CalendarActivity) => void
  onDelete: (id: string) => void
  onAdd: () => void
  onClose: () => void
}

function formatDay(date: string) {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function DayModal({ open, date, activities, onToggle, onEdit, onDelete, onAdd, onClose }: Props) {
  const sorted = [...activities].sort((a, b) => (a.start_time || '99').localeCompare(b.start_time || '99'))
  const doneCount = sorted.filter((a) => a.done).length

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-semibold text-white capitalize">{formatDay(date)}</h3>
          {sorted.length > 0 && (
            <p className="text-[11px] text-text-secondary mt-0.5">{doneCount} de {sorted.length} hechas</p>
          )}
        </div>
        <button type="button" onClick={onClose} className="text-text-secondary hover:text-white text-lg leading-none">✕</button>
      </div>

      <div className="p-5 space-y-2 max-h-[55vh] overflow-y-auto">
        {sorted.length === 0 && (
          <p className="text-sm text-text-secondary/60 py-8 text-center">Sin actividades este día.</p>
        )}
        {sorted.map((a) => (
          <div key={a.id} className="flex items-start gap-3 bg-card rounded-lg p-3 group" style={{ borderLeft: `3px solid ${a.color}` }}>
            <button
              onClick={() => onToggle(a.id, !a.done)}
              className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center text-[10px] shrink-0 transition-all
                ${a.done ? 'bg-success border-success text-white' : 'border-white/25 hover:border-success'}`}
              aria-label="marcar hecha"
            >
              {a.done ? '✓' : ''}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm text-white ${a.done ? 'line-through opacity-50' : ''}`}>{a.title}</span>
                {a.start_time && <span className="text-[10px] text-text-secondary">{a.start_time}</span>}
                <span className="text-[10px] text-text-secondary/50">{a.duration_minutes}min</span>
              </div>
              {a.objective && <p className="text-[11px] text-text-secondary mt-0.5">{a.objective}</p>}
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(a)} className="text-text-secondary hover:text-white text-sm" aria-label="editar">✎</button>
              <button onClick={() => onDelete(a.id)} className="text-text-secondary hover:text-danger text-sm" aria-label="eliminar">🗑</button>
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-white/10">
        <button onClick={onAdd} className="w-full bg-accent hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm transition-colors">
          + Agregar actividad a este día
        </button>
      </div>
    </Modal>
  )
}
