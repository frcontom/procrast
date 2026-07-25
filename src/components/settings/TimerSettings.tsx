interface Props {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  onChange: (config: { workMinutes: number; shortBreakMinutes: number; longBreakMinutes: number }) => void
}

export function TimerSettings({ workMinutes, shortBreakMinutes, longBreakMinutes, onChange }: Props) {
  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Temporizador</h2>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-text-secondary mb-1">Focus (min)</label>
          <input type="number" value={workMinutes} min={1} max={120}
            onChange={(e) => onChange({ workMinutes: Number(e.target.value), shortBreakMinutes, longBreakMinutes })}
            className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-center" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Descanso corto</label>
          <input type="number" value={shortBreakMinutes} min={1} max={30}
            onChange={(e) => onChange({ workMinutes, shortBreakMinutes: Number(e.target.value), longBreakMinutes })}
            className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-center" />
        </div>
        <div>
          <label className="block text-xs text-text-secondary mb-1">Descanso largo</label>
          <input type="number" value={longBreakMinutes} min={1} max={60}
            onChange={(e) => onChange({ workMinutes, shortBreakMinutes, longBreakMinutes: Number(e.target.value) })}
            className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent text-center" />
        </div>
      </div>
      <p className="text-[10px] text-text-secondary mt-2">
        Descanso largo aparece cada 4 sesiones completadas
      </p>
    </div>
  )
}
