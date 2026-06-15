import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { t } from '../utils/helpers'
import { format, subDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const PRIORITIES = [
  { value: 'high', emoji: '🔴', label: 'জরুরি' },
  { value: 'mid', emoji: '🟡', label: 'মাঝারি' },
  { value: 'low', emoji: '🟢', label: 'সাধারণ' },
]

const TIME_SLOTS = [
  { key: 'morning', emoji: '🌅', label: 'সকাল', labelEn: 'Morning' },
  { key: 'afternoon', emoji: '☀️', label: 'দুপুর', labelEn: 'Afternoon' },
  { key: 'evening', emoji: '🌆', label: 'বিকাল', labelEn: 'Evening' },
  { key: 'night', emoji: '🌙', label: 'রাত', labelEn: 'Night' },
]

// ─── Supabase ─────────────────────────────────────────────────────────────────
async function dbLoadTodos(userId) {
  const { data } = await supabase.from('todos').select('*').eq('user_id', userId).order('created_at')
  return data || []
}
async function dbSaveTodo(userId, todo) {
  const { data } = await supabase.from('todos').insert({
    user_id: userId, date: todo.date, text: todo.text,
    done: false, progress: 0, reason: '',
    time: todo.time || '', priority: todo.priority || 'mid', slot: todo.slot || 'morning'
  }).select().single()
  return data
}
async function dbToggleTodo(id, done) {
  await supabase.from('todos').update({ done }).eq('id', id)
}
async function dbDeleteTodo(id) {
  await supabase.from('todos').delete().eq('id', id)
}
async function dbSaveReason(id, reason, progress) {
  await supabase.from('todos').update({ reason, progress }).eq('id', id)
}

// ─── Sigma Analysis ───────────────────────────────────────────────────────────
async function getSigmaAnalysis(todos, trackerEntries, sections, lang, date) {
  if (!GROQ_API_KEY || todos.length === 0) return null
  try {
    const done = todos.filter(t => t.done)
    const undone = todos.filter(t => !t.done)
    const trackerStr = sections.length
      ? sections.map(s => `${s.name}: ${trackerEntries?.[s.id] || 'নেই'} ${s.unit || ''}`).join(', ')
      : 'tracker data নেই'

    const now = new Date()
    const taskDate = new Date(date + 'T00:00:00')
    const isToday = date === format(now, 'yyyy-MM-dd')
    const isPast = taskDate < now && !isToday

    const timeContext = isToday
      ? `এটা আজকের (${format(now, 'HH:mm')}) — কিছু task এখনো সময় আছে`
      : isPast ? 'এটা অতীতের দিন' : 'এটা ভবিষ্যতের দিন'

    const prompt = `তারিখ: ${date} (${timeContext})
Done (${done.length}টা): ${done.map(t => t.text).join(', ') || 'কিছু না'}
Undone (${undone.length}টা): ${undone.map(t => `${t.text}${t.reason ? ` [কারণ: ${t.reason}]` : ''}`).join(', ') || 'কিছু না'}
Tracker: ${trackerStr}

২-৩ লাইনে সরাসরি, honest বিশ্লেষণ দাও। ${lang === 'bn' ? 'বাংলায় লেখো।' : 'Write in English.'}`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', max_tokens: 250,
        messages: [
          { role: 'system', content: 'তুমি Sigma — student-দের AI mentor। সরাসরি, honest, motivating বিশ্লেষণ দাও।' },
          { role: 'user', content: prompt }
        ]
      })
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch { return null }
}

// ─── Add Task Sheet ───────────────────────────────────────────────────────────
function AddTaskSheet({ open, onClose, onAdd, lang, selectedDate }) {
  const [text, setText] = useState('')
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState('mid')
  const [slot, setSlot] = useState('morning')
  const ref = useRef()

  useEffect(() => { if (open) setTimeout(() => ref.current?.focus(), 150) }, [open])

  const handleAdd = () => {
    if (!text.trim()) return
    onAdd({ text: text.trim(), time, priority, slot, date: selectedDate })
    setText(''); setTime(''); setPriority('mid'); setSlot('morning')
    onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full z-10 rounded-t-3xl border-t border-white/10 p-5"
        style={{ background: 'rgba(12,12,18,0.98)' }}>

        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-white text-lg">
            ✏️ {t(lang, 'নতুন Task', 'New Task')}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Notebook-style input */}
        <div className="relative mb-4">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500/30 ml-6" />
          <textarea
            ref={ref}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
            placeholder={t(lang, 'কী করবে লেখো... (বাংলা বা English)', 'Write your task...')}
            rows={3}
            className="w-full pl-10 pr-4 py-3 bg-transparent text-white placeholder-gray-600 outline-none resize-none font-body text-base leading-8"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, rgba(255,255,255,0.05) 31px, rgba(255,255,255,0.05) 32px)',
              lineHeight: '32px',
            }}
          />
        </div>

        {/* Time */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-gray-500 w-12">⏰ সময়</span>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none text-sm font-mono" />
        </div>

        {/* Slot */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {TIME_SLOTS.map(s => (
            <button key={s.key} onClick={() => setSlot(s.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${slot === s.key ? 'gradient-brand text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}>
              {s.emoji} {lang === 'bn' ? s.label : s.labelEn}
            </button>
          ))}
        </div>

        {/* Priority */}
        <div className="flex items-center gap-2 mb-5">
          {PRIORITIES.map(p => (
            <button key={p.value} onClick={() => setPriority(p.value)}
              className={`flex-1 py-2 rounded-xl text-sm transition-all ${priority === p.value ? 'bg-white/20 border border-white/30' : 'bg-white/5'}`}>
              {p.emoji} <span className="text-xs text-gray-400 ml-1">{p.label}</span>
            </button>
          ))}
        </div>

        <button onClick={handleAdd} disabled={!text.trim()}
          className="w-full gradient-brand rounded-2xl py-3.5 text-white font-medium disabled:opacity-40 glow-orange text-base">
          ✅ {t(lang, 'যোগ করো', 'Add Task')}
        </button>
      </div>
    </div>
  )
}

// ─── Reason Sheet ─────────────────────────────────────────────────────────────
const REASONS = [
  'সময় পাইনি', 'ক্লান্ত ছিলাম', 'ভুলে গিয়েছিলাম',
  'অন্য কাজ ছিল', 'মনোযোগ ছিল না', 'কঠিন মনে হয়েছে', 'অন্য কারণ'
]

function ReasonSheet({ todo, onClose, onSave, lang }) {
  const [reason, setReason] = useState(todo.reason || '')
  const [progress, setProgress] = useState(todo.progress || 0)
  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full z-10 rounded-t-3xl border-t border-white/10 p-5"
        style={{ background: 'rgba(12,12,18,0.98)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-white">
            ❓ {t(lang, 'কেন হয়নি?', 'Why not done?')}
          </h3>
          <button onClick={onClose}><X size={18} className="text-gray-500" /></button>
        </div>
        <p className="text-sm text-gray-400 mb-3 font-body">"{todo.text}"</p>

        {/* Progress */}
        <p className="text-xs text-gray-500 mb-2">{t(lang, 'কতটুকু হয়েছে?', 'How much done?')}</p>
        <div className="flex gap-2 mb-4">
          {[0, 25, 50, 75, 100].map(p => (
            <button key={p} onClick={() => setProgress(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all ${progress === p ? 'gradient-brand text-white' : 'bg-white/5 text-gray-500'}`}>
              {p}%
            </button>
          ))}
        </div>

        {/* Reason */}
        <p className="text-xs text-gray-500 mb-2">{t(lang, 'কারণ:', 'Reason:')}</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {REASONS.map(r => (
            <button key={r} onClick={() => setReason(r)}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all ${reason === r ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
              {r}
            </button>
          ))}
        </div>

        <button onClick={() => { onSave(reason, progress); onClose() }}
          className="w-full gradient-brand rounded-2xl py-3 text-white font-medium">
          {t(lang, 'সংরক্ষণ করো', 'Save')}
        </button>
      </div>
    </div>
  )
}

// ─── Task Item ────────────────────────────────────────────────────────────────
function TaskItem({ todo, onToggle, onDelete, onReason, lang, isPast }) {
  const priority = PRIORITIES.find(p => p.value === (todo.priority || 'mid'))
  return (
    <div className={`flex items-start gap-3 py-3 px-1 group border-b border-white/5 last:border-0 transition-all`}>
      {/* Checkbox */}
      <button onClick={() => onToggle(todo.id, !todo.done)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all active:scale-90 ${
          todo.done ? 'bg-orange-500 border-orange-500' : 'border-gray-600 hover:border-orange-400'
        }`}>
        {todo.done && <Check size={13} className="text-white" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Time + Priority badges */}
        {(todo.time || todo.priority) && (
          <div className="flex items-center gap-1.5 mb-1">
            {todo.time && (
              <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-md">
                {todo.time}
              </span>
            )}
            <span className="text-xs">{priority?.emoji}</span>
          </div>
        )}
        {/* Task text */}
        <p className={`text-sm font-body leading-relaxed transition-all ${
          todo.done ? 'line-through text-gray-600' : 'text-white'
        }`} style={todo.done ? { textDecorationThickness: '2px' } : {}}>
          {todo.text}
        </p>
        {/* Reason if exists */}
        {todo.reason && (
          <p className="text-[10px] text-yellow-400/70 mt-1">⚠️ {todo.reason} {todo.progress > 0 ? `· ${todo.progress}%` : ''}</p>
        )}
        {/* Why not done button */}
        {!todo.done && isPast && (
          <button onClick={() => onReason(todo)}
            className="text-[10px] text-gray-600 hover:text-yellow-400 mt-1 transition-colors">
            {todo.reason ? '✏️ কারণ edit করো' : '❓ কেন হয়নি?'}
          </button>
        )}
      </div>

      {/* Delete */}
      <button onClick={() => onDelete(todo.id)}
        className="text-gray-700 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0 mt-0.5">
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Todo() {
  const { lang, sections, entries, user } = useStore()
  const [todos, setTodos] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showAdd, setShowAdd] = useState(false)
  const [reasonTodo, setReasonTodo] = useState(null)
  const [sigmaMsg, setSigmaMsg] = useState('')
  const [sigmaLoading, setSigmaLoading] = useState(false)
  const [view, setView] = useState('day')

  // Load from Supabase on mount
  useEffect(() => {
    if (!user?.id) return
    dbLoadTodos(user.id).then(data => setTodos(data.map(t => ({
      id: t.id, date: t.date, text: t.text, done: t.done,
      time: t.time || '', priority: t.priority || 'mid',
      slot: t.slot || 'morning', progress: t.progress || 0, reason: t.reason || ''
    }))))
  }, [user?.id])

  const today = format(new Date(), 'yyyy-MM-dd')
  const isToday = selectedDate === today
  const isPast = selectedDate < today
  const todosForDay = todos.filter(t => t.date === selectedDate)
  const trackerData = entries[selectedDate] || {}
  const doneCount = todosForDay.filter(t => t.done).length

  // Sigma auto-analysis
  useEffect(() => {
    if (todosForDay.length === 0) { setSigmaMsg(''); return }
    if (!isPast && !isToday) return
    setSigmaMsg('')
    setSigmaLoading(true)
    getSigmaAnalysis(todosForDay, trackerData, sections, lang, selectedDate)
      .then(msg => { setSigmaMsg(msg || ''); setSigmaLoading(false) })
  }, [selectedDate, todos.length, doneCount])

  const handleAdd = async (taskData) => {
    if (user?.id) {
      const saved = await dbSaveTodo(user.id, taskData)
      if (saved) setTodos(prev => [...prev, { ...taskData, id: saved.id, done: false, progress: 0, reason: '' }])
    } else {
      setTodos(prev => [...prev, { ...taskData, id: Date.now(), done: false, progress: 0, reason: '' }])
    }
  }

  const handleToggle = async (id, done) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done } : t))
    if (user?.id) await dbToggleTodo(id, done)
  }

  const handleDelete = async (id) => {
    setTodos(prev => prev.filter(t => t.id !== id))
    if (user?.id) await dbDeleteTodo(id)
  }

  const handleSaveReason = async (id, reason, progress) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, reason, progress } : t))
    if (user?.id) await dbSaveReason(id, reason, progress)
  }

  // Week strip
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    return format(addDays(subDays(new Date(), 3), i), 'yyyy-MM-dd')
  })

  // Month days
  const monthDays = eachDayOfInterval({
    start: startOfMonth(new Date(selectedDate + 'T00:00:00')),
    end: endOfMonth(new Date(selectedDate + 'T00:00:00'))
  })

  return (
    <div className="pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {t(lang, 'টু-ডু', 'To-Do')}
          </h1>
          <p className="text-xs text-gray-600 font-body">
            {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, dd MMMM yyyy')}
          </p>
        </div>
        <button onClick={() => setView(view === 'day' ? 'month' : 'day')}
          className="glass px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white transition-all">
          {view === 'day' ? '📅 মাস' : '📋 দিন'}
        </button>
      </div>

      {view === 'day' && (
        <>
          {/* Week strip */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
            {weekDays.map(d => {
              const isSelected = d === selectedDate
              const isTodayD = d === today
              const dayTodos = todos.filter(t => t.date === d)
              const hasDone = dayTodos.some(t => t.done)
              const hasUndone = dayTodos.some(t => !t.done)
              return (
                <button key={d} onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all shrink-0 min-w-[48px] ${
                    isSelected ? 'gradient-brand text-white glow-orange' : 'glass text-gray-500 hover:text-white'
                  }`}>
                  <span className="text-[9px] font-medium uppercase">{format(new Date(d + 'T00:00:00'), 'EEE')}</span>
                  <span className={`font-display font-bold text-lg leading-none ${isTodayD && !isSelected ? 'text-orange-400' : ''}`}>
                    {format(new Date(d + 'T00:00:00'), 'dd')}
                  </span>
                  <div className="flex gap-0.5 h-1.5">
                    {hasDone && <div className="w-1 h-1 rounded-full bg-green-400" />}
                    {hasUndone && <div className="w-1 h-1 rounded-full bg-orange-400" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Day nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setSelectedDate(format(subDays(new Date(selectedDate + 'T00:00:00'), 1), 'yyyy-MM-dd'))}
              className="p-2 glass rounded-xl text-gray-500 hover:text-white transition-all">
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              {todosForDay.length > 0 && (
                <p className="text-xs text-gray-500">
                  {doneCount}/{todosForDay.length} {t(lang, 'সম্পন্ন', 'done')}
                  {todosForDay.length > 0 && ` · ${Math.round((doneCount / todosForDay.length) * 100)}%`}
                </p>
              )}
            </div>
            <button onClick={() => setSelectedDate(format(addDays(new Date(selectedDate + 'T00:00:00'), 1), 'yyyy-MM-dd'))}
              className="p-2 glass rounded-xl text-gray-500 hover:text-white transition-all">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Progress bar */}
          {todosForDay.length > 0 && (
            <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-4">
              <div className="h-full gradient-brand rounded-full transition-all duration-700"
                style={{ width: `${(doneCount / todosForDay.length) * 100}%` }} />
            </div>
          )}

          {/* Sigma Analysis */}
          {(sigmaLoading || sigmaMsg) && (
            <div className="glass rounded-2xl p-4 mb-4 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center shrink-0">
                  <span className="text-white text-xs font-bold font-display">Σ</span>
                </div>
                <span className="text-xs text-orange-400 font-medium">Sigma</span>
                <Sparkles size={10} className="text-orange-400" />
              </div>
              {sigmaLoading
                ? <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    <span className="text-xs text-gray-500">{t(lang, 'বিশ্লেষণ করছি...', 'Analyzing...')}</span>
                  </div>
                : <p className="text-sm text-gray-200 font-body leading-relaxed">{sigmaMsg}</p>
              }
            </div>
          )}

          {/* Tasks by slot */}
          {todosForDay.length === 0 ? (
            <div className="text-center py-16 glass rounded-3xl">
              <p className="text-5xl mb-3">📝</p>
              <p className="text-gray-500 text-sm font-body mb-5">
                {isToday
                  ? t(lang, 'আজকের কোনো plan নেই। এখনই লেখো!', 'No plans for today. Start now!')
                  : t(lang, 'এই দিনের কোনো task নেই', 'No tasks for this day')}
              </p>
              <button onClick={() => setShowAdd(true)}
                className="gradient-brand px-6 py-3 rounded-2xl text-sm text-white font-medium glow-orange">
                <Plus size={14} className="inline mr-1" />
                {t(lang, 'Task যোগ করো', 'Add Task')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {TIME_SLOTS.map(slot => {
                const slotTasks = todosForDay
                  .filter(t => (t.slot || 'morning') === slot.key)
                  .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
                if (slotTasks.length === 0) return null
                return (
                  <div key={slot.key}>
                    <p className="text-xs font-medium text-gray-500 mb-1.5 px-1 flex items-center gap-1.5">
                      {slot.emoji} {lang === 'bn' ? slot.label : slot.labelEn}
                    </p>
                    <div className="glass rounded-2xl px-3 divide-y divide-white/5"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(transparent, transparent 47px, rgba(255,255,255,0.03) 47px, rgba(255,255,255,0.03) 48px)',
                      }}>
                      {slotTasks.map(todo => (
                        <TaskItem key={todo.id} todo={todo} lang={lang}
                          isPast={isPast || isToday}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                          onReason={setReasonTodo} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Month view */}
      {view === 'month' && (
        <div>
          <p className="font-display font-bold text-white text-center mb-4">
            {format(new Date(selectedDate + 'T00:00:00'), 'MMMM yyyy')}
          </p>
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {['রবি', 'সোম', 'মঙ্গ', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'].map((d, i) => (
              <div key={i} className="text-[9px] text-gray-600">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: monthDays[0].getDay() }, (_, i) => <div key={'e' + i} />)}
            {monthDays.map(day => {
              const dKey = format(day, 'yyyy-MM-dd')
              const dayTodos = todos.filter(t => t.date === dKey)
              const done = dayTodos.filter(t => t.done).length
              const total = dayTodos.length
              const isSelected = dKey === selectedDate
              const isTodayD = dKey === today
              return (
                <button key={dKey} onClick={() => { setSelectedDate(dKey); setView('day') }}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-xs ${
                    isSelected ? 'gradient-brand text-white' :
                    isTodayD ? 'border border-orange-500/50 text-orange-400' :
                    'glass text-gray-400 hover:text-white'
                  }`}>
                  <span className="font-medium">{format(day, 'd')}</span>
                  {total > 0 && (
                    <div className="flex gap-0.5">
                      {done > 0 && <div className="w-1 h-1 rounded-full bg-green-400" />}
                      {done < total && <div className="w-1 h-1 rounded-full bg-orange-400" />}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-600 justify-center">
            <span><span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />সম্পন্ন</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-orange-400 mr-1" />বাকি</span>
          </div>
        </div>
      )}

      {/* FAB */}
      {view === 'day' && (
        <button onClick={() => setShowAdd(true)}
          className="fixed bottom-24 right-4 w-14 h-14 gradient-brand rounded-full flex items-center justify-center shadow-2xl glow-orange z-40 active:scale-95 transition-all">
          <Plus size={26} className="text-white" />
        </button>
      )}

      <AddTaskSheet open={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} lang={lang} selectedDate={selectedDate} />
      {reasonTodo && (
        <ReasonSheet
          todo={reasonTodo}
          lang={lang}
          onClose={() => setReasonTodo(null)}
          onSave={(reason, progress) => handleSaveReason(reasonTodo.id, reason, progress)}
        />
      )}
    </div>
  )
}