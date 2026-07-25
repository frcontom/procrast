import { useState } from 'react'

interface Props {
  onSave: (data: { name: string; icon: string; color: string; is_primary: boolean }) => void
  onClose: () => void
}

const COLORS = ['#A66CFF', '#FF6B6B', '#4CAF50', '#FF9800', '#156390', '#E91E63', '#00BCD4', '#8BC34A']
const ICONS = ['bi-star', 'bi-moon', 'bi-book', 'bi-heart', 'bi-droplet', 'bi-fire', 'bi-sun', 'bi-tree', 'bi-cup', 'bi-person']

export function HabitForm({ onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('bi-star')
  const [color, setColor] = useState('#A66CFF')
  const [isPrimary, setIsPrimary] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), icon, color, is_primary: isPrimary })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--bg-card)] rounded-2xl border border-white/10 p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold mb-4">Nuevo hábito</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1">Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" required />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Ícono</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((ic) => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors ${icon === ic ? 'bg-accent text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
                  {ic === 'bi-star' && '★'}
                  {ic === 'bi-moon' && '🌙'}
                  {ic === 'bi-book' && '📖'}
                  {ic === 'bi-heart' && '♥'}
                  {ic === 'bi-droplet' && '💧'}
                  {ic === 'bi-fire' && '🔥'}
                  {ic === 'bi-sun' && '☀'}
                  {ic === 'bi-tree' && '🌳'}
                  {ic === 'bi-cup' && '☕'}
                  {ic === 'bi-person' && '👤'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'ring-2 ring-white scale-125' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 accent-accent" />
            <span className="text-text-secondary">Hábito principal</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-accent hover:bg-[var(--accent-hover)] text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex-1">
              Crear hábito
            </button>
            <button type="button" onClick={onClose} className="text-text-secondary hover:text-white text-sm px-4 py-2 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
