import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { IdentityStatement, IdentityRole } from '../supabase/types'

export function useIdentity() {
  const user = useUser()
  const [statements, setStatements] = useState<IdentityStatement[]>([])
  const [roles, setRoles] = useState<IdentityRole[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('identity_statements').select('*').eq('user_id', user.id).then(({ data }: any) => {
      if (data) setStatements(data)
    })
    supabase.from('identity_roles').select('*').eq('user_id', user.id).then(({ data }: any) => {
      if (data) setRoles(data)
    })
  }, [user])

  const addStatement = async (statement: string) => {
    if (!user) return
    const { data }: any = await supabase.from('identity_statements').insert({ user_id: user.id, statement }).select().single()
    if (data) setStatements((prev) => [data, ...prev])
  }

  return { statements, roles, addStatement }
}
