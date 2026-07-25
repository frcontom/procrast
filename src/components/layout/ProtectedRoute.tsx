import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../../supabase/auth'
import { supabase } from '../../supabase/client'
import { useSettingsStore } from '../../store/useSettingsStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession()
  const location = useLocation()
  const setTimerConfig = useSettingsStore((s) => s.setTimerConfig)
  const setName = useSettingsStore((s) => s.setName)
  const setActivityType = useSettingsStore((s) => s.setActivityType)
  const setLoaded = useSettingsStore((s) => s.setLoaded)

  useEffect(() => {
    if (!session?.user?.id) return
    supabase.from('profiles').select('*').eq('user_id', session.user.id).single().then(({ data }: any) => {
      if (data) {
        setName(data.name)
        setActivityType(data.activity_type)
        if (data.config?.timer) {
          setTimerConfig({ workMinutes: 25, breakMinutes: 5, maxPauseMinutes: 5, ...data.config.timer })
        }
        setLoaded(true)
      }
    })
  }, [session?.user?.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-text-secondary text-sm">Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
