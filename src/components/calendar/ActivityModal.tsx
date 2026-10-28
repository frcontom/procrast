import { useState } from 'react'
import type { CalendarActivity, CalendarActivityInsert } from '../../supabase/types'
import { Modal } from '../shared/Modal'

const COLORS = ['#a66cff', '#00bcd4', '#28c76f', '#ff9800', '#f44336', '#e91e63', '#3f51b5', '#8bc34a']

interface Props {
  open: boolean
  date: string // "YYYY-MM-DD" preseleccionado
  time?: string // "HH:MM" preseleccionado (al hacer clic en una franja)
  activity?: CalendarActivity | null
  onSave: (data: Omit<CalendarActivityInsert, 'user_id'>) => void
  onDelete?: (id: string) => void
  onToggleDone?: (id: string, done: boolean) => void
  onClose: () => void
}

export function ActivityModal({ open, date, time, activity, onSave, onDelete, onToggleDone, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [objective, setObjective] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [activityDate, setActivityDate] = useState(date)
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState(30)

  // Re-sembrar valores cada vez que se abre con otro contexto
  const seedKey = `${activity?.id ?? 'new'}-${date}-${time ?? ''}`
  const [lastSeed, setLastSeed] = useState('')
  if (open && seedKey !== lastSeed) {
    setLastSeed(seedKey)
    setTitle(activity?.title ?? '')
    setObjective(activity?.objective ?? '')
    setColor(activity?.color ?? COLORS[0])
    setActivityDate(activity?.activity_date ?? date)
    setStartTime(activity?.start_time ?? time ?? '')
    setDuration(activity?.duration_minutes ?? 30)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      objective: objective.trim(),
      color,
      activity_date: activityDate,
      start_time: startTime,
      duration_minutes: duration,
    })
  }

  const input = 'w-full bg-card border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-accent outline-none'
  const label = 'block text-[11px] uppercase tracking-wider text-text-secondary mb-1'

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10" style={{ background: `linear-gradient(90deg, ${color}22, transparent)` }}>
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          {activity ? 'Editar actividad' : 'Nueva actividad'}
        </h3>
        <button type="button" onClick={onClose} className="text-text-secondary hover:text-white text-lg leading-none">✕</button>
      </div>

      <form onSubmit={submit} className="p-5 space-y-4">
        <div>
          <label className={label}>Título</label>
          <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Estudiar React" autoFocus />
        </div>

        <div>
          <label className={label}>Objetivo</label>
          <textarea className={`${input} resize-none`} rows={2} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="¿Para qué? El propósito de esta actividad" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={label}>Día</label>
            <input type="date" className={input} value={activityDate} onChange={(e) => setActivityDate(e.target.value)} />
          </div>
          <div>
            <label className={label}>Hora</label>
            <input type="time" className={input} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className={label}>Minutos</label>
            <input type="number" min={5} step={5} className={input} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className={label}>Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-110' : ''}`}
                style={{ backgroundColor: c }}
                aria-label={`color ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {activity && onDelete && (
            <button type="button" onClick={() => onDelete(activity.id)} className="text-danger hover:bg-danger/10 px-3 py-2 rounded-lg text-sm transition-colors">
              🗑 Eliminar
            </button>
          )}
          {activity && onToggleDone && (
            <button
              type="button"
              onClick={() => onToggleDone(activity.id, !activity.done)}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${activity.done ? 'bg-white/10 text-text-secondary' : 'bg-success/15 text-success hover:bg-success/25'}`}
            >
              {activity.done ? '↺ Marcar pendiente' : '✓ Ya la hice'}
            </button>
          )}
          <button type="submit" className="ml-auto bg-accent hover:bg-[var(--accent-hover)] text-white px-5 py-2 rounded-lg text-sm transition-colors">
            {activity ? 'Guardar' : 'Agregar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
