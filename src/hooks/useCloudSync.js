import {
  collection, doc, addDoc, deleteDoc, updateDoc, setDoc, getDocs,
  query, where, orderBy,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

// All writes are a best-effort cloud backup keyed by the device's anonymous
// Firebase user id (see src/lib/firebase.js). Local storage (zustand persist)
// stays the source of truth the app reads from; nothing here is read back
// into the UI automatically.

// ─── Sections ────────────────────────────────────────────────────────────────
export async function dbAddSection(userId, section) {
  if (!db) return null
  const ref = await addDoc(collection(db, 'sections'), {
    user_id: userId,
    name: section.name,
    type: section.type,
    unit: section.unit || null,
    target: section.target || null,
    max: section.max || null,
    color: section.color,
    order_index: section.order_index || 0,
  })
  return { id: ref.id, ...section }
}

export async function dbDeleteSection(sectionId) {
  if (!db) return
  await deleteDoc(doc(db, 'sections', sectionId))
}

export async function dbLoadSections(userId) {
  if (!db) return []
  const snap = await getDocs(query(collection(db, 'sections'), where('user_id', '==', userId), orderBy('order_index')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Entries ─────────────────────────────────────────────────────────────────
function entryDocId(userId, date, sectionId) {
  return `${userId}_${date}_${sectionId}`
}

export async function dbSetEntry(userId, date, sectionId, value) {
  if (!db) return
  const ref = doc(db, 'entries', entryDocId(userId, date, sectionId))
  if (value === '' || value === null || value === undefined) {
    await deleteDoc(ref)
    return
  }
  await setDoc(ref, { user_id: userId, date, section_id: sectionId, value: String(value) })
}

export async function dbLoadEntries(userId) {
  if (!db) return {}
  const snap = await getDocs(query(collection(db, 'entries'), where('user_id', '==', userId)))
  const formatted = {}
  for (const d of snap.docs) {
    const row = d.data()
    if (!formatted[row.date]) formatted[row.date] = {}
    formatted[row.date][row.section_id] = row.value
  }
  return formatted
}

// ─── Exams ────────────────────────────────────────────────────────────────────
export async function dbAddExam(userId, exam) {
  if (!db) return null
  const ref = await addDoc(collection(db, 'exams'), { user_id: userId, name: exam.name, date: exam.date })
  return { id: ref.id, ...exam }
}

export async function dbDeleteExam(examId) {
  if (!db) return
  await deleteDoc(doc(db, 'exams', examId))
}

export async function dbLoadExams(userId) {
  if (!db) return []
  const snap = await getDocs(query(collection(db, 'exams'), where('user_id', '==', userId), orderBy('date')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Todos ────────────────────────────────────────────────────────────────────
export async function dbSaveTodo(userId, todo) {
  if (!db) return null
  const ref = await addDoc(collection(db, 'todos'), {
    user_id: userId, date: todo.date, text: todo.text,
    done: false, progress: 0, reason: '',
    time: todo.time || '', priority: todo.priority || 'mid', slot: todo.slot || 'morning',
    created_at: Date.now(),
  })
  return { id: ref.id }
}

export async function dbToggleTodo(id, done) {
  if (!db) return
  await updateDoc(doc(db, 'todos', id), { done })
}

export async function dbDeleteTodo(id) {
  if (!db) return
  await deleteDoc(doc(db, 'todos', id))
}

export async function dbSaveReason(id, reason, progress) {
  if (!db) return
  await updateDoc(doc(db, 'todos', id), { reason, progress })
}

export async function dbLoadTodos(userId) {
  if (!db) return []
  const snap = await getDocs(query(collection(db, 'todos'), where('user_id', '==', userId), orderBy('created_at')))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export async function dbSaveProfile(userId, updates) {
  if (!db) return
  await setDoc(doc(db, 'profiles', userId), updates, { merge: true })
}
