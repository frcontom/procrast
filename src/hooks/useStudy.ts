import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { useUser } from '../supabase/auth'
import type { StudyItem, StudyItemInsert, StudyItemUpdate, StudyTechnique } from '../supabase/types'
import { scheduleNext, dueInDays, todayStr } from '../lib/spacedRepetition'

export function useStudy() {
  const user = useUser()
  const [items, setItems] = useState<StudyItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!user) return
    setLoading(true)
    supabase
      .from('study_items')
      .select('*')
      .eq('user_id', user.id)
      .order('due_date', { ascending: true })
      .then(({ data }: any) => {
        if (data) setItems(data)
        setLoading(false)
      })
  }, [user])

  useEffect(() => { load() }, [load])

  const createItem = async (data: Omit<StudyItemInsert, 'user_id'>) => {
    if (!user) return
    const { data: row }: any = await supabase
      .from('study_items')
      .insert({ user_id: user.id, due_date: todayStr(), ...data })
      .select()
      .single()
    if (row) setItems((prev) => [...prev, row].sort((a, b) => a.due_date.localeCompare(b.due_date)))
    return row
  }

  const updateItem = async (id: string, patch: StudyItemUpdate) => {
    const { data: row }: any = await supabase
      .from('study_items')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (row) setItems((prev) => prev.map((i) => (i.id === id ? row : i)).sort((a, b) => a.due_date.localeCompare(b.due_date)))
    return row
  }

  const deleteItem = async (id: string) => {
    await supabase.from('study_items').delete().eq('id', id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  // Califica un repaso: recalcula el SRS, mueve la fecha de repaso y guarda el historial
  const review = async (id: string, quality: number, technique: StudyTechnique = 'spaced') => {
    if (!user) return
    const item = items.find((i) => i.id === id)
    if (!item) return
    const next = scheduleNext(
      { ease: item.ease, interval_days: item.interval_days, repetitions: item.repetitions },
      quality
    )
    await supabase.from('study_reviews').insert({ user_id: user.id, item_id: id, technique, quality })
    return updateItem(id, {
      ease: next.ease,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      due_date: dueInDays(next.interval_days),
      last_reviewed: new Date().toISOString(),
    })
  }

  // Práctica deliberada: suma una rep enfocada
  const addRep = async (id: string) => {
    if (!user) return
    const item = items.find((i) => i.id === id)
    if (!item) return
    await supabase.from('study_reviews').insert({ user_id: user.id, item_id: id, technique: 'deliberate', quality: 0 })
    return updateItem(id, { reps: item.reps + 1 })
  }

  return { items, loading, createItem, updateItem, deleteItem, review, addRep, reload: load }
}
