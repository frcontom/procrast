import type { Habit, HabitLog } from '../../supabase/types'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
  year: number
  month: number
  onDayClick: (dateStr: string) => void
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function HabitCalendar({ habits, logs, year, month, onDayClick }: Props) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDay = new Date(year, month - 1, 1).getDay()
  const today = new Date().toISOString().slice(0, 10)

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isToday = dateStr === today
    const isPast = dateStr < today
    const dayLogs = logs.filter((l) => l.date === dateStr)
    const doneCount = dayLogs.length
    const allDone = habits.length > 0 && doneCount >= habits.length
    const someDone = doneCount > 0 && !allDone

    let bg = 'bg-secondary/30'
    let icon = '—'
    let label = ''
    if (isToday) { bg = 'bg-accent/10 border border-accent/30'; icon = '◉' }
    else if (allDone) { bg = 'bg-[#28C76F]/15'; icon = '✅'; label = '' }
    else if (someDone) { bg = 'bg-[#FF9800]/10'; icon = '⚡'; label = `${doneCount}/${habits.length}` }
    else if (isPast && doneCount === 0 && habits.length > 0) { bg = 'bg-[#EA5455]/8'; icon = '❌' }

    return { day, dateStr, isToday, isPast, bg, icon, label, doneCount, allDone }
  })

  return (
    <div>
      <div className="grid grid-cols-7 gap-[3px] mb-[3px]">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-[10px] text-text-secondary/60 uppercase tracking-wider py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[3px]">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map(({ day, dateStr, isToday, bg, icon, label, allDone }) => (
          <button
            key={dateStr}
            onClick={() => onDayClick(dateStr)}
            className={`${bg} rounded-lg px-1 py-1.5 text-center cursor-pointer transition-all hover:ring-1 hover:ring-white/20 min-h-[38px]`}
          >
            <div className={`text-[11px] font-bold ${isToday ? 'text-accent' : 'text-white/80'}`}>{day}</div>
            <div className="text-[10px] leading-tight">
              {allDone ? <span className="text-[#28C76F]">{icon}</span> : icon === '◉' ? <span className="text-accent">{icon}</span> : icon === '❌' ? <span className="text-[#EA5455]/60">{icon}</span> : icon === '⚡' ? <span className="text-[#FF9800]">{icon}</span> : <span className="text-white/20">{icon}</span>}
            </div>
            {label && <div className="text-[8px] text-text-secondary/50 mt-0.5">{label}</div>}
          </button>
        ))}
      </div>
    </div>
  )
}
