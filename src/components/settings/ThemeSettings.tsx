import { useUIStore } from '../../store/useUIStore'

export function ThemeSettings() {
  const { theme, setTheme } = useUIStore()

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Apariencia</h2>
      <div className="flex gap-3">
        {[
          { id: 'dark', label: 'Oscuro', icon: '🌙' },
          { id: 'light', label: 'Claro', icon: '☀' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTheme(t.id as 'dark' | 'light')}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition-colors flex-1 ${theme === t.id ? 'bg-accent text-white' : 'bg-secondary text-text-secondary hover:text-white'}`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
