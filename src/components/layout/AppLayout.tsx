import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useUIStore } from '../../store/useUIStore'

export function AppLayout() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-56' : 'ml-0'}`}>
        <header className="h-14 border-b border-white/10 flex items-center px-4 gap-4">
          <button
            onClick={toggleSidebar}
            className="text-text-secondary hover:text-white transition-colors text-xl"
          >
            ☰
          </button>
          <span className="text-sm text-text-secondary">Férreo — Focus Mode</span>
        </header>

        <main className="p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
