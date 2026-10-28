import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, children, maxWidth = 'max-w-md' }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeSlideDown_0.15s_ease-out]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={`w-full ${maxWidth} bg-secondary rounded-2xl shadow-2xl border border-white/10 overflow-hidden`}>
        {children}
      </div>
    </div>
  )
}
