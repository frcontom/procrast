import type { Habit, HabitLog } from '../../supabase/types'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
  daysInMonth: number
  onDelete: (id: string) => void
  onEdit: (habit: Habit) => void
}

function getStreak(habitId: string, logs: HabitLog[]): { current: number; lastDate: string | null } {
  const hLogs = logs.filter((l) => l.habit_id === habitId).map((l) => l.date).sort().reverse()
  if (hLogs.length === 0) return { current: 0, lastDate: null }
  let streak = 1
  for (let i = 1; i < hLogs.length; i++) {
    const diff = Math.round((new Date(hLogs[i - 1]).getTime() - new Date(hLogs[i]).getTime()) / 86400000)
    if (diff === 1) streak++
    else break
  }
  return { current: streak, lastDate: hLogs[0] }
}

function getTrend(habitId: string, logs: HabitLog[], daysInMonth: number): 'up' | 'down' | 'stable' {
  const hLogs = logs.filter((l) => l.habit_id === habitId)
  const half = Math.floor(daysInMonth / 2)
  const firstHalf = hLogs.filter((l) => parseInt(l.date.split('-')[2]) <= half).length
  const secondHalf = hLogs.filter((l) => parseInt(l.date.split('-')[2]) > half).length
  if (secondHalf > firstHalf) return 'up'
  if (secondHalf < firstHalf) return 'down'
  return 'stable'
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999
  return Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

export function HabitList({ habits, logs, daysInMonth, onDelete, onEdit }: Props) {
  return (
    <div className="space-y-2">
      {habits.map((habit) => {
        const doneCount = logs.filter((l) => l.habit_id === habit.id).length
        const pct = Math.round((doneCount / daysInMonth) * 100)
        const streak = getStreak(habit.id, logs)
        const trend = getTrend(habit.id, logs, daysInMonth)
        const since = daysSince(streak.lastDate)
        const pctColor = pct >= 80 ? '#28C76F' : pct >= 40 ? '#FF9800' : '#EA5455'

        return (
          <div key={habit.id} className="bg-secondary/40 border border-white/[0.04] rounded-xl px-4 py-3 hover:bg-secondary/60 hover:border-white/10 transition-all">
            <div className="flex items-center gap-3">
              {/* Icon + Name */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: habit.color + '20', color: habit.color }}>
                  {habit.icon && !habit.icon.startsWith('bi-') ? habit.icon : '◉'}
                </span>
                <span className="text-[13px] font-medium text-white truncate">{habit.name}</span>
              </div>

              {/* Progress bar + stats */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="w-[60px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: habit.color }} />
                </div>
                <span className="text-[11px] font-semibold tabular-nums text-white/70 min-w-[38px] text-right">{doneCount}/{daysInMonth}</span>
                <span className="text-[11px] font-bold tabular-nums min-w-[34px] text-right" style={{ color: pctColor }}>{pct}%</span>
              </div>

              {/* Streak */}
              <div className="w-[32px] text-center shrink-0">
                {streak.current > 0 ? (
                  <span className="text-[11px] font-medium text-[#FF9800]">🔥{streak.current}</span>
                ) : since > 2 ? (
                  <span className="text-[11px] text-[#EA5455]/70">⚠️</span>
                ) : (
                  <span className="text-[11px] text-white/20">—</span>
                )}
              </div>

              {/* Trend */}
              <div className="w-[18px] text-center shrink-0">
                {trend === 'up' ? <span className="text-[#28C76F] text-xs">📈</span> : trend === 'down' ? <span className="text-[#EA5455] text-xs">📉</span> : <span className="text-white/40 text-xs">📊</span>}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onEdit(habit)} className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-white/5 border border-white/[0.06] text-text-secondary hover:bg-accent/20 hover:border-accent/30 hover:text-accent transition-all" title="Editar">✏️</button>
                <button onClick={() => onDelete(habit.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-xs bg-white/5 border border-white/[0.06] text-danger/50 hover:bg-danger/10 hover:border-danger/30 hover:text-danger transition-all" title="Eliminar">🗑️</button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
