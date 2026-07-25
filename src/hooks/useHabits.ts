import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { Habit, HabitLog } from '../supabase/types'

export function useHabits(monthKey: string) {
  const user = useUser()
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('habits').select('*').eq('user_id', user.id).eq('month_key', monthKey).then(({ data }: any) => {
      if (data) setHabits(data)
    })
    supabase.from('habit_logs').select('*').eq('user_id', user.id).then(({ data }: any) => {
      if (data) setLogs(data)
    })
  }, [user, monthKey])

  const toggleLog = async (habitId: string, date: string) => {
    if (!user) return
    const existing = logs.find((l) => l.habit_id === habitId && l.date === date)
    if (existing) {
      await supabase.from('habit_logs').delete().eq('id', existing.id)
      setLogs((prev) => prev.filter((l) => l.id !== existing.id))
    } else {
      const { data }: any = await supabase.from('habit_logs').insert({ user_id: user.id, habit_id: habitId, date }).select().single()
      if (data) setLogs((prev) => [...prev, data])
    }
  }

  return { habits, logs, toggleLog }
}
