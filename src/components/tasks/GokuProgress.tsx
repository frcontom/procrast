import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface Props {
  pct: number
}

const rawImages = import.meta.glob('../../assets/power/*/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const LABELS = [
  'Despertar', 'Primer paso', 'Entrenamiento', 'Disciplina', 'Superación',
  'Voluntad', 'Furia controlada', 'Dominio', 'Maestría', 'Perfecto',
]

interface ImageSet {
  folder: string
  urls: string[]
}

function collectSets(): ImageSet[] {
  const byFolder = new Map<string, string[]>()
  const entries = Object.entries(rawImages).sort(
    ([a], [b]) => a.localeCompare(b, undefined, { numeric: true }),
  )
  for (const [path, url] of entries) {
    const parts = path.split('/')
    const folder = parts[parts.length - 2]
    if (!folder) continue
    if (!byFolder.has(folder)) byFolder.set(folder, [])
    byFolder.get(folder)!.push(url)
  }
  const sets = [...byFolder.entries()].map(([folder, urls]) => ({ folder, urls }))
  if (sets.length === 0) {
    sets.push({
      folder: 'goku',
      urls: Array.from({ length: 10 }, (_, i) => `/goku/goku_${i + 1}.png`),
    })
  }
  return sets
}

const SETS = collectSets()

function pickSetIndex(current: number): number {
  if (SETS.length <= 1) return 0
  let next = Math.floor(Math.random() * SETS.length)
  if (next === current) next = (next + 1) % SETS.length
  return next
}

function buildStages(urls: string[]) {
  const n = urls.length
  return urls.map((img, i) => ({
    img,
    label: LABELS.length ? LABELS[i % LABELS.length] : `Etapa ${i + 1}`,
    threshold: Math.round((i * 100) / n),
  }))
}

export function GokuProgress({ pct }: Props) {
  const location = useLocation()
  const [setIndex, setSetIndex] = useState(() => pickSetIndex(-1))

  useEffect(() => {
    setSetIndex((prev) => pickSetIndex(prev))
  }, [location.pathname, location.search])

  const activeSet = SETS[setIndex] ?? SETS[0]
  const STAGES = buildStages(activeSet.urls)
  const folderName = activeSet.folder.charAt(0).toUpperCase() + activeSet.folder.slice(1)

  // Cada foto representa 100/n% del avance; se activa la foto más cercana al progreso actual
  const currentIndex = Math.min(
    STAGES.length - 1,
    Math.max(0, Math.round((pct / 100) * STAGES.length)),
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">🐉 Camino de {folderName}</span>
        <span className="text-[10px] text-accent font-bold tabular-nums">{pct}%</span>
      </div>
      <div className="flex items-start justify-between gap-0.5">
        {STAGES.map((stage, i) => {
          const unlocked = i <= currentIndex
          const isCurrent = i === currentIndex
          return (
            <div key={`${activeSet.folder}-${i}`} className="flex flex-col items-center gap-1 flex-1">
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