import { supabase } from './client'
import { useState, useEffect } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/login` },
  })
  if (error) throw error

  if (data.user) {
    await supabase.from('profiles').insert({
      user_id: data.user.id,
      name: 'Focus',
      config: {
        timer: { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 },
        ui: { theme: 'dark', language: 'es' },
        notifications: { enabled: true, soundEnabled: true },
      },
    })
    await supabase.from('gamification').insert({
      user_id: data.user.id,
      total_xp: 0,
      level: 1,
    })
  }
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function useSession(): { session: Session | null; loading: boolean } {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  return { session, loading }
}

export function useUser(): User | null {
  const { session } = useSession()
  return session?.user ?? null
}
