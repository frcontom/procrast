import { calculateRhythm } from '../../lib/rhythmCalculator'

interface Props {
  startDate: string
  deadline: string
  estimatedMinutes: number
  completedMinutes: number
  subtaskDays: string[]
}

function getDaysBetween(start: Date, end: Date): Date[] {
  const days: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return days
}

export function HexCalendar({ startDate, deadline, estimatedMinutes, completedMinutes, subtaskDays }: Props) {
  const start = new Date(startDate)
  const end = new Date(deadline)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = getDaysBetween(start, end)

  const rhythm = calculateRhythm({
    startDate: start,
    deadline: end,
    estimatedMinutes,
    completedMinutes,
  })

  const dailyTarget = Math.max(1, Math.round(estimatedMinutes / days.length))

  return (
    <div>
      <div className="flex items-center gap-3 mb-3 text-xs text-text-secondary">
        <span>Ritmo: {rhythm.rhythmDaily} min/día</span>
        <span>·</span>
        <span>Progreso: {rhythm.progressPct}%</span>
        <span>·</span>
        <span className={rhythm.behind ? 'text-danger' : 'text-success'}>
          {rhythm.statusLabel}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {days.map((date) => {
          const dateStr = date.toISOString().slice(0, 10)
          const isToday = date.getTime() === today.getTime()
          const isPast = date < today
          const completedMinutesOnDay = subtaskDays
            .filter((d) => d === dateStr)
            .length * dailyTarget
          const metTarget = completedMinutesOnDay >= dailyTarget

          let bg = 'bg-secondary'
          if (isToday) bg = 'border border-accent bg-accent/10'
          else if (isPast && metTarget) bg = 'bg-accent/50'
          else if (isPast && !metTarget) bg = 'bg-danger/20'

          return (
            <div
              key={dateStr}
              title={`${dateStr}: ${completedMinutesOnDay}/${dailyTarget} min`}
              className="hex-day"
              style={{
                width: 44,
                height: 48,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                backgroundColor: bg === 'bg-secondary' ? '#1a1a2e' :
                  bg.includes('accent/50') ? 'rgba(166,108,255,0.5)' :
                  bg.includes('danger/20') ? 'rgba(244,67,54,0.2)' :
                  bg.includes('accent/10') ? 'rgba(166,108,255,0.1)' : '#1a1a2e',
                border: bg.includes('border') ? '1px solid #a66cff' : '1px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: isToday ? '#a66cff' : '#a0a0b0',
                cursor: 'default',
              }}
            >
              {date.getDate()}
            </div>
          )
        })}
      </div>
    </div>
  )
}
