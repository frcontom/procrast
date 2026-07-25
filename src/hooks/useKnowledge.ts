import { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { KnowledgeNote } from '../supabase/types'

export function useKnowledge() {
  const user = useUser()
  const [notes, setNotes] = useState<KnowledgeNote[]>([])

  useEffect(() => {
    if (!user) return
    supabase.from('knowledge_notes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }: any) => {
      if (data) setNotes(data)
    })
  }, [user])

  const createNote = async (note: { title: string; content: string }) => {
    if (!user) return
    const { data }: any = await supabase.from('knowledge_notes').insert({ user_id: user.id, ...note }).select().single()
    if (data) setNotes((prev) => [data, ...prev])
    return data
  }

  const deleteNote = async (id: string) => {
    await supabase.from('knowledge_notes').delete().eq('id', id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return { notes, createNote, deleteNote }
}
