interface Props {
  pct: number
}

const STAGES = [
  { img: '/goku/goku_1.png', label: 'Despertar', threshold: 0 },
  { img: '/goku/goku_2.png', label: 'Primer paso', threshold: 10 },
  { img: '/goku/goku_3.png', label: 'Entrenamiento', threshold: 20 },
  { img: '/goku/goku_4.png', label: 'Disciplina', threshold: 30 },
  { img: '/goku/goku_5.png', label: 'Superación', threshold: 40 },
  { img: '/goku/goku_6.png', label: 'Voluntad', threshold: 50 },
  { img: '/goku/goku_7.png', label: 'Furia controlada', threshold: 60 },
  { img: '/goku/goku_8.png', label: 'Dominio', threshold: 70 },
  { img: '/goku/goku_9.png', label: 'Maestría', threshold: 80 },
  { img: '/goku/goku_10.png', label: 'Perfecto', threshold: 90 },
]

export function GokuProgress({ pct }: Props) {
  const currentIndex = pct >= STAGES[STAGES.length - 1].threshold
    ? STAGES.length - 1
    : STAGES.reduce((acc, s, i) => (pct > s.threshold ? i : acc), 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">🐉 Camino de Goku</span>
        <span className="text-[10px] text-accent font-bold tabular-nums">{pct}%</span>
      </div>
      <div className="flex items-start justify-between gap-0.5">
        {STAGES.map((stage, i) => {
          const unlocked = pct > stage.threshold || i === currentIndex
          const isCurrent = i === currentIndex
          return (
            <div key={stage.img} className="flex flex-col items-center gap-1 flex-1">
              <div className={`relative w-full max-w-[140px] aspect-square rounded-xl overflow-hidden border transition-all duration-500 ${isCurrent ? 'border-accent/20 ring-1 ring-accent/10 shadow-lg shadow-accent/10' : unlocked ? 'border-white/[0.04]' : 'border-white/[0.02]'}`}
                title={`${stage.label} — ${stage.threshold}%`}>
                <img src={stage.img} alt={stage.label}
                  className="w-full h-full object-contain transition-all duration-500"
                  style={{ filter: unlocked ? 'none' : 'grayscale(1) brightness(0.45)', opacity: unlocked ? 1 : 0.4 }} />
                {unlocked && <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-[#b388ff]" />}
                {isCurrent && <div className="absolute inset-0 bg-accent/10 animate-pulse" />}
              </div>
              <span className={`text-[9px] text-center leading-tight ${isCurrent ? 'text-accent font-semibold' : unlocked ? 'text-text-secondary/70' : 'text-text-secondary/30'}`}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
