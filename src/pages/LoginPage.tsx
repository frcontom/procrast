import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../supabase/auth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await signIn(email, password)
      navigate('/focus')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="bg-card p-8 rounded-2xl w-full max-w-sm border border-white/10">
        <div className="text-center mb-8">
          <span className="text-accent text-4xl">⬡</span>
          <h1 className="text-xl font-semibold mt-2">Férreo</h1>
          <p className="text-text-secondary text-sm">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-danger/10 text-danger text-sm p-3 rounded-lg">{error}</div>
          )}

          <div>
            <label className="block text-sm text-text-secondary mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-accent hover:bg-[var(--accent-hover)] text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
          >
            Iniciar sesión
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-text-secondary space-y-2">
          <p>
            <Link to="/register" className="text-accent hover:underline">Crear cuenta</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
