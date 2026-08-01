import { useState, useRef, useEffect, useMemo } from 'react'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (v: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
}

export function SearchableSelect({ options, value, onChange, placeholder = 'Seleccionar…', searchPlaceholder = 'Buscar…', emptyMessage = 'Sin resultados' }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (open) {
      setQuery('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={wrapRef} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:border-accent transition-all">
        <span className={`truncate ${selected ? 'text-white' : 'text-text-secondary'}`}>{selected ? selected.label : placeholder}</span>
        <span className={`text-[10px] text-text-secondary transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-card border border-white/10 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 bg-secondary rounded-md px-2.5 py-1.5">
              <span className="text-text-secondary text-xs">🔍</span>
              <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filtered.length > 0) {
                    onChange(filtered[0].value)
                    setOpen(false)
                  }
                  if (e.key === 'Escape') setOpen(false)
                }}
                className="w-full bg-transparent text-sm text-white placeholder:text-text-secondary/50 focus:outline-none" />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-text-secondary/60">{emptyMessage}</li>
            )}
            {filtered.map((o) => (
              <li key={o.value}>
                <button type="button"
                  onClick={() => { onChange(o.value); setOpen(false) }}
                  className={`w-full text-left px-3 py-1.5 text-sm transition-all ${o.value === value ? 'bg-accent/15 text-accent' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}>
                  <span className="truncate block">{o.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
