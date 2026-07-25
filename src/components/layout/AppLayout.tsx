import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useUIStore } from '../../store/useUIStore'
import { useState, useEffect } from 'react'

export function AppLayout() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const [clock, setClock] = useState('')

  useEffect(() => {
    const update = () => {
      setClock(new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

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
          <span className="ml-auto text-xs text-text-secondary/60 tabular-nums">{clock}</span>
        </header>

        <main className="p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
