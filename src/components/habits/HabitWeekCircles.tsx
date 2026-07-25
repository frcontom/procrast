import type { Habit, HabitLog } from '../../supabase/types'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
}

export function HabitWeekCircles({ habits, logs }: Props) {
  const today = new Date()
  const currentDay = today.getDay()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - ((currentDay + 6) % 7))

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return {
      dateStr: d.toISOString().slice(0, 10),
      name: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()],
    }
  })

  return (
    <div className="flex items-center justify-between px-2">
      {weekDays.map(({ dateStr, name }) => {
        const doneCount = habits.filter((h) => logs.some((l) => l.habit_id === h.id && l.date === dateStr)).length
        const isToday = dateStr === today.toISOString().slice(0, 10)
        let symbol = '○'
        let color = '#EA5455'
        if (doneCount >= habits.length && habits.length > 0) { symbol = '●'; color = '#28C76F' }
        else if (doneCount > 0) { symbol = '◐'; color = '#FF9800' }
        if (isToday && doneCount === 0) { symbol = '◉'; color = 'var(--accent)' }
        else if (isToday) { symbol = '◉'; color = 'var(--accent)' }

        return (
          <div key={dateStr} className="flex flex-col items-center gap-1">
            <span style={{ color }} className="text-lg">{symbol}</span>
            <span className="text-[9px] text-text-secondary/60">{name}</span>
          </div>
        )
      })}
    </div>
  )
}
