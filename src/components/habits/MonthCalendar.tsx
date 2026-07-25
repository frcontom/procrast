import type { Habit, HabitLog } from '../../supabase/types'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
  monthKey: string
  onToggle: (habitId: string, date: string) => void
}

const DAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']

export function MonthCalendar({ habits, logs, monthKey, onToggle }: Props) {
  const [year, month] = monthKey.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay = new Date(year, month - 1, 1).getDay()
  const today = new Date().toISOString().slice(0, 10)

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateStr = `${monthKey}-${day.toString().padStart(2, '0')}`
    return { day, dateStr, isToday: dateStr === today }
  })

  const getLogCount = (habitId: string, dateStr: string) =>
    logs.filter((l) => l.habit_id === habitId && l.date === dateStr).length

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] text-text-secondary uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map(({ day, dateStr, isToday }) => (
          <div
            key={dateStr}
            className={`rounded-lg p-1 min-h-[60px] transition-colors ${isToday ? 'bg-accent/10 border border-accent/30' : 'bg-secondary/50'}`}
          >
            <div className={`text-[10px] mb-1 ${isToday ? 'text-accent font-bold' : 'text-text-secondary'}`}>
              {day}
            </div>
            <div className="space-y-0.5">
              {habits.map((habit) => {
                const count = getLogCount(habit.id, dateStr)
                if (count === 0) return null
                return (
                  <div
                    key={habit.id}
                    className="w-full h-1.5 rounded-full"
                    style={{ backgroundColor: habit.color }}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {habits.map((habit) => (
          <div key={habit.id} className="flex items-center gap-3">
            <div className="flex flex-wrap gap-1 flex-1">
              {days.map(({ day, dateStr }) => {
                const done = getLogCount(habit.id, dateStr) > 0
                return (
                  <button
                    key={dateStr}
                    onClick={() => onToggle(habit.id, dateStr)}
                    className={`w-6 h-6 rounded text-[9px] font-medium transition-colors ${
                      done ? 'text-white' : 'text-text-secondary hover:bg-white/10'
                    }`}
                    style={{ backgroundColor: done ? habit.color : 'transparent' }}
                    title={`${habit.name} - ${dateStr}`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
