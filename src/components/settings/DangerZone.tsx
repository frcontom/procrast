import { useState } from 'react'
import { supabase } from '../../supabase/client'
import { useUser } from '../../supabase/auth'

const TABLES = ['sessions', 'task_goals', 'habits', 'knowledge_notes', 'identity_statements', 'coaching_messages']

export function DangerZone() {
  const user = useUser()
  const [confirmDelete, setConfirmDelete] = useState('')
  const [status, setStatus] = useState('')

  const resetAllData = async () => {
    if (confirmDelete !== 'RESET') return
    if (!user) return

    for (const table of TABLES) {
      await supabase.from(table).delete().eq('user_id', user.id)
    }
    await supabase.from('gamification').update({ total_xp: 0, level: 1 }).eq('user_id', user.id)
    setStatus('Datos eliminados correctamente')
    setConfirmDelete('')
    setTimeout(() => setStatus(''), 3000)
  }

  return (
    <div className="bg-card rounded-xl border border-danger/20 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-danger mb-4">Zona de Peligro</h2>

      <div className="space-y-3">
        <p className="text-xs text-text-secondary">
          Esta acción eliminará todos tus datos: sesiones, metas, hábitos, notas, afirmaciones y mensajes del coach.
          Esta operación no se puede deshacer.
        </p>

        <div className="flex gap-2">
          <input type="text" value={confirmDelete} onChange={(e) => setConfirmDelete(e.target.value)}
            placeholder="Escribe RESET para confirmar"
            className="flex-1 bg-secondary border border-danger/30 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-danger" />
          <button onClick={resetAllData} disabled={confirmDelete !== 'RESET'}
            className="bg-danger hover:bg-[#d32f2f] text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            Resetear datos
          </button>
        </div>

        {status && (
          <div className="text-success text-xs">{status}</div>
        )}
      </div>
    </div>
  )
}
