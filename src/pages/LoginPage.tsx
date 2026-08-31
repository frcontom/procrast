import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../supabase/auth'

const FIXED_EMAIL = 'feconto@gmail.com'
const FIXED_PASSWORD = 'h4x0r'
const USERNAME = 'h4x0r'
const PASSWORD = 'toor'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (username.trim() !== USERNAME || password !== PASSWORD) {
      setError('Usuario o contraseña incorrectos')
      return
    }
    setLoading(true)
    try {
      await signIn(FIXED_EMAIL, FIXED_PASSWORD)
      navigate('/focus')
    } catch (err) {
      setError('No se pudo conectar. Verifica tu cuenta de Supabase.')
      setLoading(false)
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
            <label className="block text-sm text-text-secondary mb-1">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
              required
              autoFocus
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
            disabled={loading}
            className="w-full bg-accent hover:bg-[var(--accent-hover)] text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Conectando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}