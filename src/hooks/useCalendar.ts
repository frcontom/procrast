import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { CalendarActivity, CalendarActivityInsert, CalendarActivityUpdate } from '../supabase/types'

// Carga las actividades dentro de un rango [start, end] (fechas "YYYY-MM-DD").
export function useCalendar(start: string, end: string) {
  const user = useUser()
  const [activities, setActivities] = useState<CalendarActivity[]>([])

  const load = useCallback(() => {
    if (!user) return
    supabase
      .from('calendar_activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('activity_date', start)
      .lte('activity_date', end)
      .order('activity_date')
      .order('start_time')
      .then(({ data }: any) => {
        if (data) setActivities(data)
      })
  }, [user, start, end])

  useEffect(() => { load() }, [load])

  const addActivity = async (input: Omit<CalendarActivityInsert, 'user_id'>) => {
    if (!user) return
    const { data }: any = await supabase
      .from('calendar_activities')
      .insert({ user_id: user.id, ...input })
      .select()
      .single()
    if (data) setActivities((prev) => [...prev, data])
    return data as CalendarActivity | undefined
  }

  const updateActivity = async (id: string, patch: CalendarActivityUpdate) => {
    await supabase.from('calendar_activities').update(patch).eq('id', id)
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  const deleteActivity = async (id: string) => {
    await supabase.from('calendar_activities').delete().eq('id', id)
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  const toggleDone = async (id: string, done: boolean) => {
    await updateActivity(id, { done })
  }

  return { activities, addActivity, updateActivity, deleteActivity, toggleDone, reload: load }
}
