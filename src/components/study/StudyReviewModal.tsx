import { useMemo, useState } from 'react'
import type { StudyItem, StudyTechnique } from '../../supabase/types'
import { Modal } from '../shared/Modal'

interface Props {
  open: boolean
  item: StudyItem | null
  onReview: (id: string, quality: number, technique: StudyTechnique) => void
  onAddRep: (id: string) => void
  onClose: () => void
}

type StepId = 'feynman' | 'recall' | 'deliberate' | 'grade'

const GRADES = [
  { q: 0, label: 'Fallé', sub: 'No lo supe', color: '#f44336' },
  { q: 3, label: 'Difícil', sub: 'Con esfuerzo', color: '#ff9800' },
  { q: 4, label: 'Bien', sub: 'Lo recordé', color: '#00bcd4' },
  { q: 5, label: 'Fácil', sub: 'Al instante', color: '#28c76f' },
]

export function StudyReviewModal({ open, item, onReview, onAddRep, onClose }: Props) {
  // Pasos activos: solo los que el ítem tiene cargados + siempre calificar al final
  const steps = useMemo<StepId[]>(() => {
    if (!item) return []
    const s: StepId[] = []
    if (item.feynman) s.push('feynman')
    if (item.question) s.push('recall')
    if (item.skill) s.push('deliberate')
    s.push('grade')
    return s
  }, [item])

  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [repDone, setRepDone] = useState(false)

  const seedKey = item?.id ?? 'none'
  const [lastSeed, setLastSeed] = useState('')
  if (open && seedKey !== lastSeed) {
    setLastSeed(seedKey)
    setIdx(0)
    setRevealed(false)
    setRepDone(false)
  }

  if (!item) return null

  const step = steps[idx]
  const isLast = idx === steps.length - 1
  const next = () => { setRevealed(false); setIdx((i) => Math.min(i + 1, steps.length - 1)) }

  const grade = (q: number) => {
    onReview(item.id, q, 'spaced')
    onClose()
  }

  const stepLabel: Record<StepId, string> = {
    feynman: '🗣 Explícalo (Feynman)',
    recall: '🧠 Recuerda (Active Recall)',
    deliberate: '🎯 Practica (Deliberada)',
    grade: '🔁 Califica (Espaciada)',
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10" style={{ background: `linear-gradient(90deg, ${item.color}22, transparent)` }}>
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
          {item.title}
          {item.subject && <span className="text-xs text-text-secondary font-normal">· {item.subject}</span>}
        </h3>
        <button type="button" onClick={onClose} className="text-text-secondary hover:text-white text-lg leading-none">✕</button>
      </div>

      <div className="p-5 space-y-4">
        {/* Progreso de pasos */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-1 flex-1 rounded-full transition-colors ${i <= idx ? 'bg-accent' : 'bg-white/10'}`} />
            </div>
          ))}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-text-secondary">
          Paso {idx + 1} de {steps.length} · {stepLabel[step]}
        </div>

        {/* PASO FEYNMAN */}
        {step === 'feynman' && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Primero explícalo en voz alta, simple, como a un niño. Luego revela tu nota y compara.</p>
            {!revealed ? (
              <button onClick={() => setRevealed(true)} className="w-full bg-accent hover:bg-[var(--accent-hover)] text-white py-2.5 rounded-lg text-sm transition-colors">
                Ya lo expliqué, muéstrame mi nota
              </button>
            ) : (
              <>
                <div className="bg-card rounded-xl p-4">
                  <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-1">Tu explicación</div>
                  <div className="text-white whitespace-pre-wrap">{item.feynman}</div>
                </div>
                {item.feynman_gaps && (
                  <div className="bg-card rounded-xl p-4 border border-warning/30">
                    <div className="text-[11px] uppercase tracking-wider text-warning mb-1">Huecos a cerrar</div>
                    <div className="text-white whitespace-pre-wrap">{item.feynman_gaps}</div>
                  </div>
                )}
                <button onClick={next} className="w-full bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-lg text-sm transition-colors">
                  Siguiente →
                </button>
              </>
            )}
          </div>
        )}

        {/* PASO ACTIVE RECALL */}
        {step === 'recall' && (
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-1">Pregunta</div>
              <div className="text-white whitespace-pre-wrap">{item.question}</div>
            </div>
            {!revealed ? (
              <button onClick={() => setRevealed(true)} className="w-full bg-accent hover:bg-[var(--accent-hover)] text-white py-2.5 rounded-lg text-sm transition-colors">
                Responde de memoria, luego revela
              </button>
            ) : (
              <>
                <div className="bg-card rounded-xl p-4 border border-success/30">
                  <div className="text-[11px] uppercase tracking-wider text-success mb-1">Respuesta</div>
                  <div className="text-white whitespace-pre-wrap">{item.answer || 'Sin respuesta'}</div>
                </div>
                <button onClick={next} className="w-full bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-lg text-sm transition-colors">
                  Siguiente →
                </button>
              </>
            )}
          </div>
        )}

        {/* PASO PRÁCTICA DELIBERADA */}
        {step === 'deliberate' && (
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-1">Habilidad a practicar</div>
              <div className="text-white whitespace-pre-wrap">{item.skill}</div>
            </div>
            <div className="flex items-center justify-between bg-card rounded-xl p-4">
              <span className="text-sm text-text-secondary">Repeticiones enfocadas</span>
              <span className="text-2xl font-bold text-accent">{item.reps + (repDone ? 1 : 0)}</span>
            </div>
            {!repDone ? (
              <button onClick={() => { onAddRep(item.id); setRepDone(true) }} className="w-full bg-success/15 text-success hover:bg-success/25 py-2.5 rounded-lg text-sm transition-colors">
                + Hice una repetición
              </button>
            ) : (
              <button onClick={next} className="w-full bg-white/10 hover:bg-white/15 text-white py-2.5 rounded-lg text-sm transition-colors">
                Siguiente →
              </button>
            )}
            <button onClick={next} className="w-full text-text-secondary hover:text-white py-1 text-xs transition-colors">
              Saltar práctica
            </button>
          </div>
        )}

        {/* PASO CALIFICAR (alimenta el repaso espaciado) */}
        {step === 'grade' && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">En conjunto, ¿qué tan bien recordaste esto? Tu respuesta decide cuándo vuelve.</p>
            <div className="grid grid-cols-4 gap-2">
              {GRADES.map((g) => (
                <button key={g.q} onClick={() => grade(g.q)}
                  className="rounded-lg py-3 text-center transition-transform hover:scale-105"
                  style={{ backgroundColor: `${g.color}22`, color: g.color }}>
                  <div className="text-sm font-semibold">{g.label}</div>
                  <div className="text-[9px] opacity-70">{g.sub}</div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-text-secondary/60 text-center">
              Fácil = vuelve más tarde · Fallé = vuelve mañana.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
