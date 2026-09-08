import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useUIStore } from '../../store/useUIStore'
import { useState, useEffect } from 'react'

export function AppLayout() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const [clock, setClock] = useState('')
  const [dayIcon, setDayIcon] = useState('')
  const [isMobile, setIsMobile] = useState(false)

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

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const on = () => setIsMobile(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // En móvil, si el sidebar está abierto al montar, lo cerramos (overlay)
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      toggleSidebar()
    }
  }, [isMobile])

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />

      {/* Backdrop en móvil cuando el sidebar está abierto */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={toggleSidebar} />
      )}

      <div className={`transition-all duration-300 ${!isMobile && sidebarOpen ? 'lg:ml-56' : 'ml-0'}`}>
        <header className="h-14 border-b border-white/10 flex items-center px-3 md:px-4 gap-3 sticky top-0 bg-[var(--bg-primary)] z-20">
          <button
            onClick={toggleSidebar}
            className="text-text-secondary hover:text-white transition-colors text-xl"
            aria-label="Alternar menú"
          >
            ☰
          </button>
          <span className="text-xs md:text-sm text-text-secondary truncate">Férreo — Focus Mode</span>
          <span className="ml-auto text-xs text-text-secondary/60 tabular-nums whitespace-nowrap hidden sm:inline">{clock} {dayIcon}</span>
          <span className="ml-auto text-xs text-text-secondary/60 tabular-nums sm:hidden">{dayIcon}</span>
        </header>

        <main className="p-3 md:p-6 w-full max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}