import type { Habit, HabitLog } from '../../supabase/types'

interface Props {
  dateStr: string
  habits: Habit[]
  logs: HabitLog[]
  isToday: boolean
  onClose: () => void
  onToggle: (habitId: string, date: string) => void
}

export function HabitDayModal({ dateStr, habits, logs, isToday, onClose, onToggle }: Props) {
  const date = new Date(dateStr + 'T12:00:00')
  const label = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const isDone = (habitId: string) => logs.some((l) => l.habit_id === habitId && l.date === dateStr)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-card rounded-xl border border-white/10 p-5 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-white capitalize">{label}</span>
          <button onClick={onClose} className="text-text-secondary hover:text-white text-lg leading-none">&times;</button>
        </div>

        <div className="space-y-2">
          {habits.map((habit) => {
            const done = isDone(habit.id)
            return (
              <div key={habit.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2.5">
                  <span style={{ color: habit.color }}>{habit.icon}</span>
                  <span className="text-sm text-white">{habit.name}</span>
                </div>
                {isToday ? (
                  <button
                    onClick={() => onToggle(habit.id, dateStr)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                      done ? 'bg-[#28C76F] text-white' : 'bg-white/10 text-white/40 hover:bg-white/20'
                    }`}
                  >
                    {done ? '✓' : '⬜'}
                  </button>
                ) : (
                  <span className={`text-xs font-medium ${done ? 'text-[#28C76F]' : 'text-text-secondary'}`}>
                    {done ? '✅ Hecho' : '❌ Pendiente'}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <button onClick={onClose} className="mt-4 w-full py-2 rounded-lg text-xs font-medium bg-secondary hover:bg-white/10 text-text-secondary hover:text-white transition-all">
          Cerrar
        </button>
      </div>
    </div>
  )
}
