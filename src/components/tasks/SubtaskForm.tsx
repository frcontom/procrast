import { useState } from 'react'

interface Props {
  onSave: (data: { name: string; estimated_minutes: number; difficulty: string }) => void
  onImport?: (tasks: { name: string; estimated_minutes: number; difficulty: string }[]) => void
}

export function SubtaskForm({ onSave, onImport }: Props) {
  const [name, setName] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [difficulty, setDifficulty] = useState('normal')
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), estimated_minutes: minutes, difficulty })
    setName('')
    setMinutes(30)
  }

  const handleImport = () => {
    const lines = importText.trim().split('\n').filter(Boolean)
    const tasks = lines.map((line) => {
      const [n, m] = line.split('|').map((s) => s.trim())
      return { name: n || 'tarea', estimated_minutes: parseInt(m) || 30, difficulty: 'normal' }
    })
    if (tasks.length > 0 && onImport) onImport(tasks)
    setImportText('')
    setShowImport(false)
  }

  return (
    <div className="mt-2 space-y-2">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value.slice(0, 80))}
          placeholder="Nueva tarea..."
          className="flex-1 bg-secondary border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-accent" />
        <input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}
          className="w-14 bg-secondary border border-white/10 rounded-lg px-2 py-1.5 text-[11px] text-center focus:outline-none focus:border-accent" min={1} />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
          className="bg-secondary border border-white/10 rounded-lg px-1.5 py-1.5 text-[11px] focus:outline-none focus:border-accent text-text-secondary">
          <option value="easy">🟢</option>
          <option value="normal">🟡</option>
          <option value="hard">🔴</option>
        </select>
        <button type="submit" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-2.5 py-1.5 rounded-lg text-[11px] transition-all">+</button>
        <button type="button" onClick={() => setShowImport(!showImport)} className="text-text-secondary hover:text-white text-[11px] transition-colors" title="Importar tareas">📄</button>
      </form>

      {showImport && (
        <div className="bg-secondary/50 rounded-lg p-3 border border-white/10">
          <div className="text-[10px] text-text-secondary mb-2">📄 Importar tareas — Cada línea: Nombre|Minutos</div>
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
            placeholder="Verbos TO BE|20&#10;Vocabulario básico|30&#10;Listening A1|40"
            className="w-full bg-[var(--bg-primary)] border border-white/10 rounded-lg px-2.5 py-2 text-[11px] focus:outline-none focus:border-accent resize-none" rows={4} />
          <div className="flex gap-2 mt-2">
            <button onClick={handleImport}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-3 py-1.5 rounded-lg text-[10px] transition-all">
              ✅ Importar {importText.trim().split('\n').filter(Boolean).length} tarea(s)
            </button>
            <button onClick={() => setShowImport(false)} className="text-text-secondary hover:text-white text-[10px] px-3 py-1.5 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
