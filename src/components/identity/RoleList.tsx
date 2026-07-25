import type { IdentityRole } from '../../supabase/types'

interface Props {
  roles: IdentityRole[]
  onDelete: (id: string) => void
}

export function RoleList({ roles, onDelete }: Props) {
  if (roles.length === 0) {
    return <p className="text-text-secondary text-xs text-center py-4">Sin roles aún</p>
  }

  return (
    <div className="space-y-2">
      {roles.map((r) => (
        <div key={r.id} className="bg-secondary rounded-lg p-3 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{r.icon}</span>
              <div>
                <div className="text-sm font-medium">{r.name}</div>
                {r.description && (
                  <div className="text-xs text-text-secondary">{r.description}</div>
                )}
              </div>
            </div>
            <button onClick={() => onDelete(r.id)}
              className="text-danger/30 hover:text-danger text-xs opacity-0 group-hover:opacity-100 transition-all">✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}
