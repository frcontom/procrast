import type { IdentityStatement } from '../../supabase/types'

interface Props {
  statements: IdentityStatement[]
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}

const CATEGORY_ICONS: Record<string, string> = {
  general: '✦',
  growth: '🌱',
  discipline: '⚡',
  confidence: '💪',
}

export function StatementList({ statements, onDelete, onToggle }: Props) {
  if (statements.length === 0) {
    return <p className="text-text-secondary text-xs text-center py-4">Sin afirmaciones aún</p>
  }

  return (
    <div className="space-y-2">
      {statements.map((s) => (
        <div key={s.id}
          className={`bg-secondary rounded-lg p-3 transition-colors ${s.active ? '' : 'opacity-40'}`}>
          <div className="flex items-start gap-3">
            <span className="text-accent mt-0.5">{CATEGORY_ICONS[s.category] || '✦'}</span>
            <div className="flex-1">
              <p className="text-sm">{s.statement}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-text-secondary">{s.category}</span>
                <button onClick={() => onToggle(s.id, !s.active)}
                  className="text-[10px] text-text-secondary hover:text-white transition-colors">
                  {s.active ? 'Activa' : 'Inactiva'}
                </button>
              </div>
            </div>
            <button onClick={() => onDelete(s.id)}
              className="text-danger/30 hover:text-danger text-xs transition-colors">✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}
