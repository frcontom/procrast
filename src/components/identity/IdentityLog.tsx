import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'
import type { IdentityStatement, IdentityRole } from '../../supabase/types'

interface Props {
  statements: IdentityStatement[]
  roles: IdentityRole[]
}

export function IdentityLog({ statements, roles }: Props) {
  const user = useUser()
  const [rating, setRating] = useState(3)
  const [note, setNote] = useState('')
  const [selectedStatement, setSelectedStatement] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [saved, setSaved] = useState(false)
  const [todayLog, setTodayLog] = useState<any>(null)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    if (!user) return
    supabase.from('identity_logs').select('*').eq('user_id', user.id).eq('date', today).single().then(({ data }: any) => {
      if (data) setTodayLog(data)
    })
  }, [user])

  const saveLog = async () => {
    if (!user) return
    if (todayLog) {
      await supabase.from('identity_logs').update({ rating, note }).eq('id', todayLog.id)
    } else {
      await supabase.from('identity_logs').insert({
        user_id: user.id,
        statement_id: selectedStatement || null,
        role_id: selectedRole || null,
        date: today,
        rating,
        note,
      })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const activeStatements = statements.filter((s) => s.active)

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
        Check-in diario {todayLog && '✓'}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-text-secondary mb-2">¿Cómo te sientes hoy?</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(n)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${rating === n ? 'bg-accent text-white scale-110' : 'bg-secondary text-text-secondary hover:bg-white/10'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {activeStatements.length > 0 && (
          <div>
            <label className="block text-xs text-text-secondary mb-1">Afirmación del día</label>
            <select value={selectedStatement} onChange={(e) => setSelectedStatement(e.target.value)}
              className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent text-text-secondary">
              <option value="">Seleccionar...</option>
              {activeStatements.map((s) => (
                <option key={s.id} value={s.id}>{s.statement}</option>
              ))}
            </select>
          </div>
        )}

        {roles.length > 0 && (
          <div>
            <label className="block text-xs text-text-secondary mb-1">Rol del día</label>
            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent text-text-secondary">
              <option value="">Seleccionar...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs text-text-secondary mb-1">Nota</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="¿Qué aprendiste hoy?"
            className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent" />
        </div>

        <button onClick={saveLog}
          className="w-full bg-accent hover:bg-[var(--accent-hover)] text-white py-2 rounded-lg text-xs font-medium transition-colors">
          {saved ? '✓ Guardado' : 'Registrar'}
        </button>
      </div>
    </div>
  )
}
