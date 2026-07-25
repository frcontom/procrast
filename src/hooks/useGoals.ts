import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { TaskGoal } from '../supabase/types'

export function useGoals() {
  const user = useUser()
  const [goals, setGoals] = useState<TaskGoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('task_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }: any) => {
      if (data) setGoals(data)
      setLoading(false)
    })
  }, [user])

  const createGoal = async (goal: { name: string; deadline: string; estimated_minutes: number }) => {
    if (!user) return
    const { data }: any = await supabase.from('task_goals').insert({ user_id: user.id, ...goal }).select().single()
    if (data) setGoals((prev) => [data, ...prev])
    return data
  }

  return { goals, loading, createGoal }
}
