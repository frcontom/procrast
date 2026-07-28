import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useUIStore } from '../../store/useUIStore'
import { useState, useEffect } from 'react'

export function AppLayout() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const [clock, setClock] = useState('')
  const [dayIcon, setDayIcon] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setClock(now.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      const h = now.getHours()
      if (h >= 6 && h < 12) setDayIcon('☀️')
      else if (h >= 12 && h < 18) setDayIcon('🌤️')
      else if (h >= 18 && h < 22) setDayIcon('🌆')
      else setDayIcon('🌙')
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-56 ml-0' : 'ml-0'}`}>
        <header className="h-14 border-b border-white/10 flex items-center px-3 md:px-4 gap-3">
          <button
            onClick={toggleSidebar}
            className="text-text-secondary hover:text-white transition-colors text-xl"
          >
            ☰
          </button>
          <span className="text-xs md:text-sm text-text-secondary truncate">Férreo — Focus Mode</span>
          <span className="ml-auto text-xs text-text-secondary/60 tabular-nums whitespace-nowrap">{clock} {dayIcon}</span>
        </header>

        <main className="p-3 md:p-6 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
