import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/useUIStore'
import { signOut } from '../../supabase/auth'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/focus', label: 'Focus', icon: '◆' },
  { path: '/tasks', label: 'Metas', icon: '◎' },
  { path: '/habits', label: 'Hábitos', icon: '✓' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/knowledge', label: 'Notas', icon: '📝' },
  { path: '/identity', label: 'Identidad', icon: '👤' },
  { path: '/coach', label: 'Coach', icon: '' },
]

export function Sidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-secondary z-40 transition-all duration-300 flex flex-col
        ${sidebarOpen ? 'w-56' : 'w-0 -translate-x-full'}`}
    >
      <div className="flex items-center gap-2 px-4 h-14 border-b border-white/10 shrink-0">
        <span className="text-accent text-xl">⬡</span>
        <span className="font-semibold text-sm tracking-wider">FÉRREO</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
        {NAV_ITEMS.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors
              ${isActive ? 'text-white bg-accent/20' : 'text-text-secondary hover:text-white hover:bg-white/5'}`
            }
          >
            <span className="w-5 text-center text-base">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-white/10 shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-text-secondary mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span>Conectado</span>
          <span className="ml-auto">⌨ Space</span>
        </div>
        <div className="flex gap-2">
          <NavLink to="/settings" className="flex-1 text-center text-xs text-text-secondary hover:text-white py-1.5 rounded bg-white/5 transition-colors">⚙️</NavLink>
          <button onClick={() => signOut()} className="flex-1 text-center text-xs text-text-secondary hover:text-danger py-1.5 rounded bg-white/5 transition-colors">⏻</button>
        </div>
      </div>
    </aside>
  )
}
