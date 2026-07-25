import { useState, useEffect } from 'react'
import type { TaskSubtask } from '../../supabase/types'

interface Props {
  onSave: (data: { name: string; estimated_minutes: number; difficulty: string; depends_on?: string | null }) => void
  onImport?: (tasks: { name: string; estimated_minutes: number; difficulty: string }[]) => void
  editSubtask?: TaskSubtask | null
  onCloseEdit?: () => void
  subtaskList?: TaskSubtask[]
}

export function SubtaskForm({ onSave, onImport, editSubtask, onCloseEdit, subtaskList }: Props) {
  const [open, setOpen] = useState<'add' | 'import' | null>(null)
  const [name, setName] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [difficulty, setDifficulty] = useState('normal')
  const [dependsOn, setDependsOn] = useState<string>('')
  const [importText, setImportText] = useState('')

  useEffect(() => {
    if (editSubtask) {
      setName(editSubtask.name)
      setMinutes(editSubtask.estimated_minutes)
      setDifficulty(editSubtask.difficulty)
      setDependsOn(editSubtask.depends_on || '')
    }
  }, [editSubtask])

  const openAdd = () => {
    setName('')
    setMinutes(30)
    setDifficulty('normal')
    setDependsOn('')
    setOpen('add')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), estimated_minutes: minutes, difficulty, depends_on: dependsOn || null })
    setName('')
    setMinutes(30)
    setDependsOn('')
    if (editSubtask) { onCloseEdit?.(); return }
    setOpen(null)
  }

  const handleImport = () => {
    const lines = importText.trim().split('\n').filter(Boolean)
    const tasks = lines.map((line) => {
      const [n, m] = line.split('|').map((s) => s.trim())
      return { name: n || 'tarea', estimated_minutes: parseInt(m) || 30, difficulty: 'normal' }
    })
    if (tasks.length > 0 && onImport) onImport(tasks)
    setImportText('')
    setOpen(null)
  }

  const modalOpen = open || editSubtask
  const modalTitle = editSubtask ? 'Editar tarea' : open === 'add' ? 'Nueva tarea' : 'Importar tareas'
  const isEdit = !!editSubtask

  const close = () => {
    if (editSubtask) { onCloseEdit?.(); return }
    setName('')
    setMinutes(30)
    setDifficulty('normal')
    setDependsOn('')
    setOpen(null)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button onClick={openAdd}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all">+ Tarea</button>
        <button onClick={() => setOpen('import')}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-secondary hover:bg-white/10 text-text-secondary transition-all">📄 Masivo</button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={close}>
          <div className="bg-card rounded-xl border border-white/10 p-5 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">{modalTitle}</span>
              <button onClick={close} className="text-text-secondary hover:text-white text-lg leading-none">&times;</button>
            </div>

            {isEdit || open === 'add' ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">Nombre</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value.slice(0, 80))}
                    placeholder="Ej: Verbos TO BE"
                    className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" autoFocus />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">Minutos</label>
                    <input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}
                      className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" min={0} />
                    <span className="text-[9px] text-text-secondary/60 mt-0.5 block">0 = tarea checklist</span>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">Dificultad</label>
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-text-secondary">
                      <option value="easy">🟢 Fácil</option>
                      <option value="normal">🟡 Normal</option>
                      <option value="hard">🔴 Difícil</option>
                    </select>
                  </div>
                </div>
                {subtaskList && subtaskList.length > 0 && (
                  <div>
                    <label className="text-[10px] text-text-secondary uppercase tracking-wider mb-1 block">Depende de</label>
                    <select value={dependsOn} onChange={(e) => setDependsOn(e.target.value)}
                      className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-text-secondary">
                      <option value="">— Sin dependencia —</option>
                      {subtaskList.filter((s) => s.id !== editSubtask?.id).map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button type="submit" className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2 rounded-lg text-sm font-medium transition-all">{isEdit ? 'Guardar cambios' : 'Crear tarea'}</button>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="text-[11px] text-text-secondary">Cada línea: <code className="text-accent">Nombre|Minutos</code></div>
                <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
                  placeholder="Verbos TO BE|20&#10;Vocabulario básico|30&#10;Listening A1|40"
                  className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" rows={5} autoFocus />
                <div className="flex gap-2">
                  <button onClick={handleImport}
                    className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2 rounded-lg text-sm font-medium transition-all">
                    ✅ Importar {importText.trim().split('\n').filter(Boolean).length} tarea(s)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
