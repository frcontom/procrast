import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { Habit, HabitLog } from '../supabase/types'
import { HabitForm } from '../components/habits/HabitForm'
import { MonthCalendar } from '../components/habits/MonthCalendar'
import { WeeklyCircles } from '../components/habits/WeeklyCircles'
import { HabitStats } from '../components/habits/HabitStats'

type View = 'month' | 'week' | 'stats'

export function HabitsPage() {
  const user = useUser()
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<View>('month')
  const monthKey = new Date().toISOString().slice(0, 7)

  const loadData = useCallback(() => {
    if (!user) return
    supabase.from('habits').select('*').eq('user_id', user.id).eq('month_key', monthKey).then(({ data }: any) => {
      if (data) setHabits(data)
    })
    supabase.from('habit_logs').select('*').eq('user_id', user.id).then(({ data }: any) => {
      if (data) setLogs(data)
    })
  }, [user, monthKey])

  useEffect(() => { loadData() }, [loadData])

  const saveHabit = async (data: { name: string; icon: string; color: string; is_primary: boolean }) => {
    if (!user) return
    const { data: newHabit }: any = await supabase.from('habits').insert({
      user_id: user.id,
      month_key: monthKey,
      ...data,
    }).select().single()
    if (newHabit) setHabits((prev) => [...prev, newHabit])
    setShowForm(false)
  }

  const deleteHabit = async (id: string) => {
    await supabase.from('habits').delete().eq('id', id)
    setHabits((prev) => prev.filter((h) => h.id !== id))
    setLogs((prev) => prev.filter((l) => l.habit_id !== id))
  }

  const toggleDay = async (habitId: string, date: string) => {
    if (!user) return
    const existing = logs.find((l) => l.habit_id === habitId && l.date === date)
    if (existing) {
      await supabase.from('habit_logs').delete().eq('id', existing.id)
      setLogs((prev) => prev.filter((l) => l.id !== existing.id))
    } else {
      const { data }: any = await supabase.from('habit_logs').insert({
        user_id: user.id, habit_id: habitId, date,
      }).select().single()
      if (data) setLogs((prev) => [...prev, data])
    }
  }

  const currentMonth = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold capitalize">{currentMonth}</h2>
          <p className="text-text-secondary text-xs">{habits.length} hábitos</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-accent hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm transition-colors">
          + Hábito
        </button>
      </div>

      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        {([['month', 'Mes'], ['week', 'Semana'], ['stats', 'Stats']] as [View, string][]).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${view === v ? 'bg-accent text-white' : 'text-text-secondary hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {habits.length === 0 ? (
        <div className="bg-card rounded-xl border border-white/10 p-12 text-center text-text-secondary">
          <span className="text-3xl block mb-2">📋</span>
          <p className="text-sm">Crea tu primer hábito mensual</p>
        </div>
      ) : (
        <>
          {view === 'month' && (
            <MonthCalendar habits={habits} logs={logs} monthKey={monthKey} onToggle={toggleDay} />
          )}
          {view === 'week' && (
            <div className="bg-card rounded-xl border border-white/10 p-4">
              <WeeklyCircles habits={habits} logs={logs} onToggle={toggleDay} />
            </div>
          )}
          {view === 'stats' && (
            <div className="bg-card rounded-xl border border-white/10 p-4">
              <HabitStats habits={habits} logs={logs} monthKey={monthKey} />
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-text-secondary">
            {habits.map((h) => (
              <button key={h.id} onClick={() => deleteHabit(h.id)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-secondary hover:bg-danger/20 hover:text-danger transition-colors">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: h.color }} />
                <span>{h.name}</span>
                <span className="text-[8px]">✕</span>
              </button>
            ))}
          </div>
        </>
      )}

      {showForm && <HabitForm onSave={saveHabit} onClose={() => setShowForm(false)} />}
    </div>
  )
}
