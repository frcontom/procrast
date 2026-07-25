import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { IdentityStatement, IdentityRole } from '../supabase/types'
import { StatementList } from '../components/identity/StatementList'
import { RoleList } from '../components/identity/RoleList'
import { IdentityLog } from '../components/identity/IdentityLog'

export function IdentityPage() {
  const user = useUser()
  const [statements, setStatements] = useState<IdentityStatement[]>([])
  const [roles, setRoles] = useState<IdentityRole[]>([])
  const [newStatement, setNewStatement] = useState('')
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDesc, setNewRoleDesc] = useState('')

  const loadData = useCallback(() => {
    if (!user) return
    supabase.from('identity_statements').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }: any) => {
      if (data) setStatements(data)
    })
    supabase.from('identity_roles').select('*').eq('user_id', user.id).then(({ data }: any) => {
      if (data) setRoles(data)
    })
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  const addStatement = async () => {
    if (!user || !newStatement.trim()) return
    const { data }: any = await supabase.from('identity_statements').insert({
      user_id: user.id, statement: newStatement.trim(),
    }).select().single()
    if (data) setStatements((prev) => [data, ...prev])
    setNewStatement('')
  }

  const deleteStatement = async (id: string) => {
    await supabase.from('identity_statements').delete().eq('id', id)
    setStatements((prev) => prev.filter((s) => s.id !== id))
  }

  const toggleStatement = async (id: string, active: boolean) => {
    await supabase.from('identity_statements').update({ active }).eq('id', id)
    setStatements((prev) => prev.map((s) => (s.id === id ? { ...s, active } : s)))
  }

  const addRole = async () => {
    if (!user || !newRoleName.trim()) return
    const { data }: any = await supabase.from('identity_roles').insert({
      user_id: user.id, name: newRoleName.trim(), description: newRoleDesc.trim(),
    }).select().single()
    if (data) setRoles((prev) => [...prev, data])
    setNewRoleName('')
    setNewRoleDesc('')
  }

  const deleteRole = async (id: string) => {
    await supabase.from('identity_roles').delete().eq('id', id)
    setRoles((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-card rounded-xl border border-white/10 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Afirmaciones</h2>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Nueva afirmación..." value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addStatement()}
              className="flex-1 bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            <button onClick={addStatement}
              className="bg-accent hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm transition-colors">+</button>
          </div>
          <StatementList statements={statements} onDelete={deleteStatement} onToggle={toggleStatement} />
        </div>

        <div className="bg-card rounded-xl border border-white/10 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Roles</h2>
          <div className="space-y-2 mb-4">
            <input type="text" placeholder="Nombre del rol..." value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="w-full bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
            <div className="flex gap-2">
              <input type="text" placeholder="Descripción..." value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                className="flex-1 bg-secondary border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent" />
              <button onClick={addRole}
                className="bg-accent hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg text-sm transition-colors">+</button>
            </div>
          </div>
          <RoleList roles={roles} onDelete={deleteRole} />
        </div>
      </div>

      <div>
        <IdentityLog statements={statements} roles={roles} />
      </div>
    </div>
  )
}
