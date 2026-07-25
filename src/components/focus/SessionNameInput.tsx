interface Props {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export function SessionNameInput({ value, onChange, disabled }: Props) {
  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 60))}
        placeholder="¿Qué vas a lograr hoy?"
        disabled={disabled}
        className="w-full bg-transparent border-b border-dashed border-white/10 px-3 py-2 text-sm text-center text-white placeholder-text-secondary/30 focus:outline-none focus:border-accent/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      />
    </div>
  )
}
