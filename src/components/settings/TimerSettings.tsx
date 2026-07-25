interface Props {
  workMinutes: number
  breakMinutes: number
  onChange: (config: { workMinutes: number; breakMinutes: number }) => void
}

export function TimerSettings({ workMinutes, breakMinutes, onChange }: Props) {
  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Temporizador</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Focus (min)</label>
          <input type="number" value={workMinutes} min={1} max={120}
            onChange={(e) => onChange({ workMinutes: Number(e.target.value), breakMinutes })}
            className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-center" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Descanso (min)</label>
          <input type="number" value={breakMinutes} min={1} max={30}
            onChange={(e) => onChange({ workMinutes, breakMinutes: Number(e.target.value) })}
            className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-center" />
        </div>
      </div>
      <p className="text-[10px] text-text-secondary mt-2">
        El descanso se aplica entre ciclos. Usa este tiempo para meditar, no para pantallas.
      </p>
    </div>
  )
}
