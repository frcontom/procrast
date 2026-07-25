import type { Habit, HabitLog } from '../../supabase/types'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function HabitWeekCircles({ habits, logs }: Props) {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay()) // Sunday start

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return {
      dateStr: d.toISOString().slice(0, 10),
      dayName: DAYS[d.getDay()],
      dayNum: d.getDate(),
      isToday: d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10),
    }
  })

  return (
    <div className="flex items-center justify-around">
      {weekDays.map(({ dateStr, dayName, dayNum, isToday }) => {
        const doneCount = habits.filter((h) => logs.some((l) => l.habit_id === h.id && l.date === dateStr)).length
        const allDone = doneCount >= habits.length && habits.length > 0
        const someDone = doneCount > 0 && !allDone
        const isPast = dateStr < today.toISOString().slice(0, 10)

        let circleClass = 'bg-secondary border border-white/[0.06] text-text-secondary'
        let indicator = ''
        if (allDone) { circleClass = 'bg-[#28C76F] text-white'; indicator = '✓' }
        else if (someDone) { circleClass = 'bg-[#FF9800]/20 border-[#FF9800]/40 text-[#FF9800]'; indicator = '◐' }
        else if (isPast) { circleClass = 'bg-[#EA5455]/10 border-[#EA5455]/20 text-[#EA5455]/60'; indicator = '✕' }

        if (isToday) {
          circleClass = allDone
            ? 'bg-[#28C76F] text-white ring-2 ring-accent/50'
            : someDone
              ? 'bg-[#FF9800]/20 border-[#FF9800]/40 text-[#FF9800] ring-2 ring-accent/50'
              : 'bg-secondary border-2 border-dashed border-accent/60 text-accent'
          indicator = allDone ? '✓' : someDone ? '◐' : '◉'
        }

        return (
          <div key={dateStr} className="flex flex-col items-center gap-1.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${circleClass}`}>
              {indicator || dayNum}
            </div>
            <span className="text-[9px] text-text-secondary/50">{dayName}</span>
          </div>
        )
      })}
    </div>
  )
}
