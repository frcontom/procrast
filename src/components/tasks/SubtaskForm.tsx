import { useState } from 'react'

interface Props {
  onSave: (data: { name: string; estimated_minutes: number; difficulty: string }) => void
}

export function SubtaskForm({ onSave }: Props) {
  const [name, setName] = useState('')
  const [minutes, setMinutes] = useState(30)
  const [difficulty, setDifficulty] = useState('normal')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), estimated_minutes: minutes, difficulty })
    setName('')
    setMinutes(30)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
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
    </form>
  )
}
