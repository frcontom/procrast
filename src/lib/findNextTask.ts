import type { TaskSubtask } from '../supabase/types'

function getDepth(subtasks: TaskSubtask[], id: string): number {
  let depth = 0
  const visited = new Set<string>()
  let current = subtasks.find((s) => s.id === id)
  while (current?.depends_on) {
    if (visited.has(current.depends_on)) break
    visited.add(current.depends_on)
    const parent = subtasks.find((s) => s.id === current!.depends_on)
    if (!parent) break
    depth++
    current = parent
  }
  return depth
}

export function findNextTask(subtasks: TaskSubtask[]): TaskSubtask | null {
  const pending = subtasks.filter((s) => s.status !== 'completed')
  if (pending.length === 0) return null

  const available = pending.filter((s) => {
    if (!s.depends_on) return true
    const parent = subtasks.find((p) => p.id === s.depends_on)
    return parent?.status === 'completed'
  })

  if (available.length === 0) {
    return [...pending].sort((a, b) => a.sort_order - b.sort_order)[0] || null
  }

  return available
    .map((s) => ({ s, depth: getDepth(subtasks, s.id) }))
    .sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth
      const ap = a.s.estimated_minutes > 0 ? a.s.completed_minutes / a.s.estimated_minutes : 0
      const bp = b.s.estimated_minutes > 0 ? b.s.completed_minutes / b.s.estimated_minutes : 0
      if (ap !== bp) return ap - bp
      return a.s.sort_order - b.s.sort_order
    })[0].s
}
