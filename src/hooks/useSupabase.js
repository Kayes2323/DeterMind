import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/store-index'

// ─── Sections ────────────────────────────────────────────────────────────────
export async function dbAddSection(userId, section) {
  const { data, error } = await supabase
    .from('sections')
    .insert({
      user_id: userId,
      name: section.name,
      type: section.type,
      unit: section.unit || null,
      target: section.target || null,
      max: section.max || null,
      color: section.color,
      order_index: section.order_index || 0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function dbDeleteSection(sectionId) {
  const { error } = await supabase
    .from('sections')
    .delete()
    .eq('id', sectionId)
  if (error) throw error
}

export async function dbLoadSections(userId) {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('user_id', userId)
    .order('order_index')
  if (error) throw error
  return data || []
}

// ─── Entries ─────────────────────────────────────────────────────────────────
export async function dbSetEntry(userId, date, sectionId, value) {
  if (value === '' || value === null || value === undefined) {
    // Delete entry if empty
    await supabase
      .from('entries')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
      .eq('section_id', sectionId)
    return
  }

  const { error } = await supabase
    .from('entries')
    .upsert({
      user_id: userId,
      date,
      section_id: sectionId,
      value: String(value),
    }, {
      onConflict: 'user_id,date,section_id'
    })
  if (error) throw error
}

export async function dbLoadEntries(userId) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error

  // Convert to store format: { 'YYYY-MM-DD': { sectionId: value } }
  const formatted = {}
  for (const row of data || []) {
    if (!formatted[row.date]) formatted[row.date] = {}
    formatted[row.date][row.section_id] = row.value
  }
  return formatted
}

// ─── Exams ────────────────────────────────────────────────────────────────────
export async function dbAddExam(userId, exam) {
  const { data, error } = await supabase
    .from('exams')
    .insert({ user_id: userId, name: exam.name, date: exam.date })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function dbDeleteExam(examId) {
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId)
  if (error) throw error
}

export async function dbLoadExams(userId) {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('user_id', userId)
    .order('date')
  if (error) throw error
  return data || []
}

// ─── Todos ────────────────────────────────────────────────────────────────────
export async function dbAddTodo(userId, date, text) {
  const { data, error } = await supabase
    .from('todos')
    .insert({ user_id: userId, date, text })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function dbUpdateTodo(todoId, updates) {
  const { error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', todoId)
  if (error) throw error
}

export async function dbDeleteTodo(todoId) {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', todoId)
  if (error) throw error
}

export async function dbLoadTodos(userId) {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw error

  // Convert to store format: { 'YYYY-MM-DD': [todos] }
  const formatted = {}
  for (const row of data || []) {
    if (!formatted[row.date]) formatted[row.date] = []
    formatted[row.date].push({
      id: row.id,
      text: row.text,
      done: row.done,
      progress: row.progress,
      reason: row.reason || '',
    })
  }
  return formatted
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export async function dbSaveProfile(userId, updates) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates })
  if (error) throw error
}

export async function dbLoadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

// ─── Main Hook — loads all data on login ─────────────────────────────────────
export function useSupabaseSync() {
  const { user, setSections, setEntries, setExams, setTodos, setUserGoal, setLang } = useStore()

  useEffect(() => {
    if (!user?.id) return

    const loadAll = async () => {
      try {
        const [sections, entries, exams, todos, profile] = await Promise.all([
          dbLoadSections(user.id),
          dbLoadEntries(user.id),
          dbLoadExams(user.id),
          dbLoadTodos(user.id),
          dbLoadProfile(user.id),
        ])

        setSections(sections)
        setEntries(entries)
        setExams(exams)
        setTodos(todos)
        if (profile?.goal) setUserGoal(profile.goal)
        if (profile?.lang) setLang(profile.lang)
      } catch (e) {
        console.error('Supabase load error:', e)
      }
    }

    loadAll()
  }, [user?.id])
}