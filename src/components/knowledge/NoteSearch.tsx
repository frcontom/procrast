interface Props {
  value: string
  onChange: (q: string) => void
}

export function NoteSearch({ value, onChange }: Props) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">🔍</span>
      <input
        type="text"
        placeholder="Buscar en notas..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-secondary border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
      />
      {value && (
        <button onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white text-xs">
          ✕
        </button>
      )}
    </div>
  )
}
