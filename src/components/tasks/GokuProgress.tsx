interface Props {
  pct: number
}

const STAGES = [
  { img: '/goku/goku_1.png', label: 'Goku bebé', threshold: 0 },
  { img: '/goku/goku_2.png', label: 'Goku niño', threshold: 10 },
  { img: '/goku/goku_3.png', label: 'Goku joven', threshold: 20 },
  { img: '/goku/goku_4.png', label: 'Goku adulto', threshold: 30 },
  { img: '/goku/goku_5.png', label: 'Super Saiyan', threshold: 40 },
  { img: '/goku/goku_6.png', label: 'SSJ2', threshold: 50 },
  { img: '/goku/goku_7.png', label: 'SSJ3', threshold: 60 },
  { img: '/goku/goku_8.png', label: 'SSJ God', threshold: 70 },
  { img: '/goku/goku_9.png', label: 'SSJ Blue', threshold: 85 },
  { img: '/goku/goku_10.png', label: 'Ultra Instinto', threshold: 100 },
]

export function GokuProgress({ pct }: Props) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">🐉 Camino de Goku</span>
        <span className="text-[10px] text-text-secondary/60 tabular-nums">{pct}%</span>
      </div>
      <div className="flex items-center justify-between gap-1 px-1">
        {STAGES.map((stage, i) => {
          const unlocked = pct >= stage.threshold
          const isCurrent = i > 0 && pct >= STAGES[i - 1].threshold && pct < stage.threshold
          return (
            <div key={stage.img} className="flex flex-col items-center gap-1 flex-1">
              <div className={`relative w-10 h-10 rounded-lg overflow-hidden border transition-all duration-500 ${isCurrent ? 'border-accent/60 ring-1 ring-accent/30' : unlocked ? 'border-white/20' : 'border-white/5'}`}
                title={`${stage.label} — ${stage.threshold}%`}>
                <img src={stage.img} alt={stage.label}
                  className="w-full h-full object-cover transition-all duration-500"
                  style={{ filter: unlocked ? 'none' : 'grayscale(1) brightness(0.45)', opacity: unlocked ? 1 : 0.4 }} />
                {unlocked && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
              </div>
              <span className={`text-[7px] text-center leading-tight ${isCurrent ? 'text-accent font-medium' : unlocked ? 'text-text-secondary/70' : 'text-text-secondary/30'}`}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
