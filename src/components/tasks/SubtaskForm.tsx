import { useState } from 'react'

interface Props {
  onSave: (data: { name: string; estimated_minutes: number; difficulty: 'easy' | 'normal' | 'hard' }) => void
}

export function SubtaskForm({ onSave }: Props) {
  const [name, setName] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), estimated_minutes: minutes, difficulty })
    setName('')
    setMinutes(30)
    setDifficulty('normal')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Nueva subtarea..."
        className="flex-1 bg-secondary border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent" />
      <input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}
        className="w-14 bg-secondary border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-accent text-center" min={1} />
      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}
        className="bg-secondary border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-accent text-text-secondary">
        <option value="easy">Fácil</option>
        <option value="normal">Normal</option>
        <option value="hard">Difícil</option>
      </select>
      <button type="submit" className="bg-accent hover:bg-[var(--accent-hover)] text-white px-3 py-1.5 rounded-lg text-xs transition-colors">
        + Tarea
      </button>
    </form>
  )
}
