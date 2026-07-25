import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { Session } from '../supabase/types'

export function useAnalytics() {
  const user = useUser()
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(100).then(({ data }: any) => {
      if (data) setSessions(data)
    })
  }, [user])

  const completed = sessions.filter((s) => s.state === 'completed').length
  const cancelled = sessions.filter((s) => s.state === 'cancelled').length
  const totalMinutes = Math.round(sessions.reduce((acc, s) => acc + (s.elapsed_seconds || 0) / 60, 0))

  return { sessions, completed, cancelled, totalMinutes }
}
