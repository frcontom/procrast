import { useState } from 'react'
import type { Habit, HabitLog } from '../../supabase/types'

interface Props {
  habits: Habit[]
  logs: HabitLog[]
  daysInMonth: number
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
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

export function HabitList({ habits, logs, daysInMonth, onDelete, onRename }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const startEdit = (habit: Habit) => {
    setEditingId(habit.id)
    setEditName(habit.name)
  }

  const saveEdit = () => {
    if (!editingId || !editName.trim()) { setEditingId(null); return }
    onRename(editingId, editName.trim())
    setEditingId(null)
  }

  return (
    <div className="space-y-1.5">
      {habits.map((habit) => {
        const doneCount = logs.filter((l) => l.habit_id === habit.id).length
        const pct = Math.round((doneCount / daysInMonth) * 100)
        const streak = getStreak(habit.id, logs)
        const trend = getTrend(habit.id, logs, daysInMonth)
        const since = daysSince(streak.lastDate)

        const pctColor = pct >= 80 ? '#28C76F' : pct >= 40 ? '#FF9800' : '#EA5455'

        return (
          <div key={habit.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors group">
            <span className="text-base shrink-0" style={{ color: habit.color }}>{habit.icon}</span>

            {editingId === habit.id ? (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onClick={() => setEditingId(null)}>
                <div className="bg-[#2B313D] border border-[#156390] rounded-xl p-4 w-80 mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text" value={editName} onChange={(e) => setEditName(e.target.value.slice(0, 60))}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null) }}
                    className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-white"
                    autoFocus
                  />
                  <p className="text-[10px] text-text-secondary mt-2">Enter = guardar · Escape = cancelar · Se cierra en 30s</p>
                </div>
              </div>
            ) : (
              <span className="text-[13px] text-white truncate flex-1">{habit.name}</span>
            )}

            <div className="w-[60px] h-1 bg-white/5 rounded-full overflow-hidden shrink-0">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: habit.color }} />
            </div>

            <span className="text-[11px] font-semibold tabular-nums min-w-[36px] text-right text-white/80">{doneCount}/{daysInMonth}</span>
            <span className="text-[11px] font-semibold tabular-nums min-w-[32px] text-right" style={{ color: pctColor }}>{pct}%</span>

            {streak.current > 0 ? (
              <span className="text-[11px] shrink-0">🔥{streak.current}</span>
            ) : since > 2 ? (
              <span className="text-[11px] text-warning shrink-0">⚠️</span>
            ) : (
              <span className="text-[11px] text-text-secondary/40 shrink-0">—</span>
            )}

            <span className="text-[11px] shrink-0 w-4 text-center">
              {trend === 'up' ? <span className="text-[#28C76F]">📈</span> : trend === 'down' ? <span className="text-[#EA5455]">📉</span> : <span className="text-text-secondary/60">📊</span>}
            </span>

            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => startEdit(habit)} className="w-6 h-6 flex items-center justify-center rounded text-xs text-text-secondary/40 hover:text-white hover:bg-white/5 transition-all" title="Editar">✏️</button>
              <button onClick={() => onDelete(habit.id)} className="w-6 h-6 flex items-center justify-center rounded text-xs text-danger/30 hover:text-danger hover:bg-danger/5 transition-all" title="Eliminar">🗑️</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
