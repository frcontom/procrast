import { useState } from 'react'
import type { Habit, HabitLog } from '../../supabase/types'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
  daysInMonth: number
  onDelete: (id: string) => void
  onEdit: (habit: Habit) => void
  onReorder?: (ids: string[]) => void
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

export function HabitList({ habits, logs, daysInMonth, onDelete, onEdit, onReorder }: Props) {
  const sorted = [...habits].sort((a, b) => a.sort_order - b.sort_order)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
    setDragIdx(idx)
  }
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverIdx(idx)
  }
  const handleDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx || !onReorder) return
    const reordered = [...sorted]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(idx, 0, moved)
    onReorder(reordered.map((h) => h.id))
    setDragIdx(null)
    setOverIdx(null)
  }
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null) }

  return (
    <div className="space-y-2">
      {sorted.map((habit, idx) => {
        const doneCount = logs.filter((l) => l.habit_id === habit.id).length
        const pct = Math.round((doneCount / daysInMonth) * 100)
        const streak = getStreak(habit.id, logs)
        const trend = getTrend(habit.id, logs, daysInMonth)
        const since = daysSince(streak.lastDate)
        const pctColor = pct >= 80 ? '#28C76F' : pct >= 40 ? '#FF9800' : '#EA5455'
        const isDragging = dragIdx === idx
        const isOver = overIdx === idx

        return (
          <div
            key={habit.id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            className={`bg-secondary/40 border border-white/[0.04] rounded-xl px-4 py-3 hover:bg-secondary/60 hover:border-white/10 transition-all cursor-grab active:cursor-grabbing ${
              isDragging ? 'opacity-40 border-accent/50' : ''
            } ${isOver ? 'border-accent/50 ring-1 ring-accent/30' : ''}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-text-secondary/20 group-hover:text-text-secondary/40 transition-colors cursor-grab active:cursor-grabbing text-xs select-none shrink-0">⠿</span>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ backgroundColor: habit.color + '20', color: habit.color }}>
                {habit.icon && !habit.icon.startsWith('bi-') ? habit.icon : '◉'}
              </span>
              <span className="text-[13px] font-medium text-white truncate flex-1">{habit.name}</span>
              <div className="w-[60px] h-1.5 bg-white/5 rounded-full overflow-hidden shrink-0">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: habit.color }} />
              </div>
              <span className="text-[11px] font-semibold tabular-nums text-white/70 min-w-[38px] text-right">{doneCount}/{daysInMonth}</span>
              <span className="text-[11px] font-bold tabular-nums min-w-[34px] text-right" style={{ color: pctColor }}>{pct}%</span>
              <div className="w-[32px] text-center shrink-0">
                {streak.current > 0 ? (
                  <span className="text-[11px] font-medium text-[#FF9800]">🔥{streak.current}</span>
                ) : since > 2 ? (
                  <span className="text-[11px] text-[#EA5455]/70">⚠️</span>
                ) : (
                  <span className="text-[11px] text-white/20">—</span>
                )}
              </div>
              <div className="w-[18px] text-center shrink-0">
                {trend === 'up' ? <span className="text-[#28C76F] text-xs">📈</span> : trend === 'down' ? <span className="text-[#EA5455] text-xs">📉</span> : <span className="text-white/40 text-xs">📊</span>}
              </div>
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
