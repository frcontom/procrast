interface Props {
  current: number
  total: number
}

export function CycleIndicator({ current, total }: Props) {
  if (total === 0) return null

  return (
    <div className="flex items-center gap-2 text-xs text-text-secondary">
      <span>🔄 {current}/{total}</span>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < current ? 'bg-accent' : 'bg-secondary'}`} />
        ))}
      </div>
      <span>{current}/{total}</span>
    </div>
  )
}
