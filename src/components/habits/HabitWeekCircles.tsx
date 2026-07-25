import type { Habit, HabitLog } from '../../supabase/types'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function HabitWeekCircles({ habits, logs }: Props) {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const doneCount = habits.filter((h) => logs.some((l) => l.habit_id === h.id && l.date === dateStr)).length
    const allDone = doneCount >= habits.length && habits.length > 0
    const someDone = doneCount > 0 && !allDone
    const isPast = dateStr < today.toISOString().slice(0, 10)
    const isToday = dateStr === today.toISOString().slice(0, 10)
    return { dateStr, dayName: DAYS[d.getDay()], dayNum: d.getDate(), allDone, someDone, isPast, isToday, doneCount }
  })

  const completedCount = weekDays.filter((d) => d.allDone).length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-text-secondary uppercase tracking-wider">Últimos 7 días</span>
        <span className="text-[10px] text-text-secondary/50">{completedCount}/7 completos</span>
      </div>
      <div className="flex items-center justify-between">
        {weekDays.map((d) => {
          let circleBg = 'bg-white/5'
          let circleText = 'text-white/20'
          let dot = '○'
          if (d.allDone) { circleBg = 'bg-[#28C76F]'; circleText = 'text-white'; dot = '✓' }
          else if (d.someDone && d.isPast) { circleBg = 'bg-[#FF9800]/20'; circleText = 'text-[#FF9800]'; dot = '◐' }
          else if (d.isPast && !d.someDone) { circleBg = 'bg-[#EA5455]/8'; circleText = 'text-[#EA5455]/40'; dot = '✕' }

          if (d.isToday) {
            circleBg = d.allDone ? 'bg-[#28C76F]' : d.someDone ? 'bg-[#FF9800]/20' : 'bg-secondary'
            circleText = d.allDone ? 'text-white' : d.someDone ? 'text-[#FF9800]' : 'text-accent'
            dot = d.allDone ? '✓' : d.someDone ? '◐' : '◉'
          }

          return (
            <div key={d.dateStr} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${circleBg} ${circleText}`}>
                {d.isToday || d.isPast ? dot : d.dayNum}
              </div>
              <span className={`text-[9px] ${d.isToday ? 'text-accent font-medium' : 'text-text-secondary/40'}`}>{d.dayName}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
