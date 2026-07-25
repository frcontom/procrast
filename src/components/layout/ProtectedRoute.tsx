import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../../supabase/auth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession()
  const location = useLocation()

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
