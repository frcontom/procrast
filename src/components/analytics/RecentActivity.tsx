import { formatDate, formatTime } from '../../lib/formatters'

interface Props {
  sessions: any[]
}

export function RecentActivity({ sessions }: Props) {
  const recent = sessions.slice(0, 15)

  if (recent.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-white/10 p-6 text-center text-text-secondary text-sm">
        Sin actividad reciente
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-white/10 p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Actividad Reciente</h3>
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {recent.map((s: any, i: number) => (
          <div key={s.id || i}
            className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${s.state === 'completed' ? 'bg-success' : 'bg-danger'}`} />
              <span className="text-xs text-text-secondary">
                {formatDate(s.started_at)}
              </span>
              <span className="text-xs text-text-secondary">{s.activity_type || 'focus'}</span>
            </div>
            <span className="text-xs text-text-secondary">
              {formatTime(s.elapsed_seconds || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
