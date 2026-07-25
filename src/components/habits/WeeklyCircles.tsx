import type { Habit, HabitLog } from '../../supabase/types'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
  onToggle: (habitId: string, date: string) => void
}

export function WeeklyCircles({ habits, logs, onToggle }: Props) {
  const today = new Date()
  const currentDay = today.getDay()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - ((currentDay + 6) % 7))

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    return { dateStr, dayName: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'][i], dayNum: d.getDate() }
  })

  const getLogCount = (habitId: string, dateStr: string) =>
    logs.filter((l) => l.habit_id === habitId && l.date === dateStr).length

  return (
    <div className="space-y-4">
      {habits.map((habit) => (
        <div key={habit.id}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: habit.color }} />
            <span className="text-xs font-medium">{habit.name}</span>
          </div>
          <div className="flex gap-2 justify-center">
            {weekDays.map(({ dateStr, dayName, dayNum }) => {
              const done = getLogCount(habit.id, dateStr) > 0
              const isToday = dateStr === today.toISOString().slice(0, 10)
              return (
                <button
                  key={dateStr}
                  onClick={() => onToggle(habit.id, dateStr)}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                      done
                        ? 'text-white scale-100'
                        : isToday
                          ? 'border-2 border-dashed border-accent text-text-secondary'
                          : 'bg-secondary text-text-secondary hover:bg-white/10'
                    }`}
                    style={done ? { backgroundColor: habit.color } : {}}
                  >
                    {dayNum}
                  </div>
                  <span className="text-[10px] text-text-secondary">{dayName}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
