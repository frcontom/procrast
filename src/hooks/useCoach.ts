import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { CoachingMessage } from '../supabase/types'

export function useCoach() {
  const user = useUser()
  const [messages, setMessages] = useState<CoachingMessage[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('coaching_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }: any) => {
      if (data) setMessages(data)
    })
  }, [user])

  const markShown = async (id: string) => {
    await supabase.from('coaching_messages').update({ shown: true }).eq('id', id)
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, shown: true } : m)))
  }

  return { messages, markShown }
}
