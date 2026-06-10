import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { t } from '../utils/helpers'
import { format, subDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { Plus, Check, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const PRIORITIES = [
  { value: 'high', color: '#ef4444', label: '🔴' },
  { value: 'mid', color: '#eab308', label: '🟡' },
  { value: 'low', color: '#22c55e', label: '🟢' },
]
const TIME_SLOTS = [
  { key: 'morning', label: '🌅 সকাল', labelEn: '🌅 Morning', range: '6AM–12PM' },
  { key: 'afternoon', label: '☀️ দুপুর', labelEn: '☀️ Afternoon', range: '12PM–5PM' },
  { key: 'evening', label: '🌆 বিকাল', labelEn: '🌆 Evening', range: '5PM–8PM' },
  { key: 'night', label: '🌙 রাত', labelEn: '🌙 Night', range: '8PM–12AM' },
]

// ─── Supabase sync ────────────────────────────────────────────────────────────
async function dbLoadTodos(userId) {
  const { data } = await supabase.from('todos').select('*').eq('user_id', userId).order('created_at')
  return data || []
}
async function dbAddTodo(userId, todo) {
  const { data } = await supabase.from('todos').insert({
    user_id: userId, date: todo.date, text: todo.text,
    done: todo.done, progress: todo.progress || 0,
    reason: todo.reason || '', time: todo.time || '',
    priority: todo.priority || 'mid', slot: todo.slot || 'morning'
  }).select().single()
  return data
}
async function dbUpdateTodo(id, updates) {
  await supabase.from('todos').update(updates).eq('id', id)
}
async function dbDeleteTodo(id) {
  await supabase.from('todos').delete().eq('id', id)
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────
async function getSigmaAnalysis(todosForDay, trackerData, sections, lang, date) {
  if (!GROQ_API_KEY) return null
  try {
    const done = todosForDay.filter(t => t.done)
    const undone = todosForDay.filter(t => !t.done)
    const trackerStr = sections.map(s => `${s.name}: ${trackerData?.[s.id] || 'নেই'} ${s.unit||''}`).join(', ')

    const prompt = `
Date: ${date}
To-do done (${done.length}): ${done.map(t=>t.text).join(', ') || 'none'}
To-do undone (${undone.length}): ${undone.map(t=>t.text).join(', ') || 'none'}
Tracker data: ${trackerStr || 'none'}

Give a brief 2-3 line analysis. Be direct, honest, motivating. Respond in ${lang === 'bn' ? 'Bengali' : 'English'}.`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_API_KEY },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', max_tokens: 200,
        messages: [
          { role: 'system', content: 'You are Sigma, a student AI mentor. Give short, honest analysis of daily performance.' },
          { role: 'user', content: prompt }
        ]
      })
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch(e) { return null }
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────
function AddTaskModal({ open, onClose, onAdd, lang, selectedDate }) {
  const [text, setText] = useState('')
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState('mid')
  const [slot, setSlot] = useState('morning')
  const inputRef = useRef()

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100) }, [open])

  const handleAdd = () => {
    if (!text.trim()) return
    onAdd({ text: text.trim(), time, priority, slot, done: false, date: selectedDate })
    setText(''); setTime(''); setPriority('mid'); setSlot('morning')
    onClose()
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative w-full md:max-w-md glass rounded-t-3xl md:rounded-2xl p-6 z-10 border border-white/10">
        <h3 className="font-display font-bold text-white text-lg mb-4">
          {t(lang, 'নতুন Task', 'New Task')}
        </h3>

        {/* Task input */}
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd() } }}
          placeholder={t(lang, 'কী করবে লেখো...', 'What will you do...')}
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-orange-500/50 resize-none font-body text-sm mb-3"
        />

        {/* Time + Priority row */}
        <div className="flex gap-2 mb-3">
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500/50 text-sm font-mono"
          />
          <div className="flex gap-1">
            {PRIORITIES.map(p => (
              <button key={p.value} onClick={() => setPriority(p.value)}
                className={`w-10 h-10 rounded-xl text-lg transition-all ${priority===p.value?'bg-white/20 scale-110':'bg-white/5'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time slot */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {TIME_SLOTS.map(s => (
            <button key={s.key} onClick={() => setSlot(s.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${slot===s.key?'gradient-brand text-white':'glass text-gray-500 hover:text-white'}`}>
              {lang==='bn' ? s.label : s.labelEn}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 glass rounded-xl py-3 text-sm text-gray-400 hover:text-white transition-all">
            {t(lang, 'বাতিল', 'Cancel')}
          </button>
          <button onClick={handleAdd} disabled={!text.trim()}
            className="flex-1 gradient-brand rounded-xl py-3 text-sm text-white font-medium disabled:opacity-40 glow-orange">
            {t(lang, 'যোগ করো', 'Add Task')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Task Item ────────────────────────────────────────────────────────────────
function TaskItem({ todo, onToggle, onDelete, lang }) {
  const priority = PRIORITIES.find(p => p.value === (todo.priority || 'mid'))
  return (
    <div className={`flex items-start gap-3 py-2.5 px-1 group transition-all ${todo.done ? 'opacity-60' : ''}`}>
      {/* Check button */}
      <button onClick={() => onToggle(todo.id, !todo.done)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
          todo.done ? 'bg-orange-500 border-orange-500' : 'border-gray-600 hover:border-orange-400'
        }`}>
        {todo.done && <Check size={12} className="text-white" strokeWidth={3}/>}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {todo.time && (
            <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-md">
              {todo.time}
            </span>
          )}
          <span className="text-xs">{priority?.label}</span>
        </div>
        <p className={`text-sm font-body leading-snug transition-all ${
          todo.done ? 'line-through text-gray-500 decoration-gray-500' : 'text-white'
        }`} style={todo.done ? {textDecorationThickness: '2px'} : {}}>
          {todo.text}
        </p>
      </div>

      {/* Delete */}
      <button onClick={() => onDelete(todo.id)}
        className="text-gray-700 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0 mt-0.5">
        <Trash2 size={13}/>
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
  const [sigmaMsg, setSigmaMsg] = useState('')
  const [sigmaLoading, setSigmaLoading] = useState(false)
  const [sigmaShown, setSigmaShown] = useState({})
  const [view, setView] = useState('day') // day | month

  // Load from Supabase
  useEffect(() => {
    if (!user?.id) return
    dbLoadTodos(user.id).then(data => {
      setTodos(data.map(t => ({
        id: t.id, date: t.date, text: t.text,
        done: t.done, time: t.time || '',
        priority: t.priority || 'mid', slot: t.slot || 'morning',
        progress: t.progress || 0, reason: t.reason || ''
      })))
    })
  }, [user?.id])

  const todosForDay = todos.filter(t => t.date === selectedDate)
  const trackerData = entries[selectedDate] || {}
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd')
  const isPast = selectedDate < format(new Date(), 'yyyy-MM-dd')

  // Auto Sigma analysis
  useEffect(() => {
    if (!isPast && !isToday) return
    if (todosForDay.length === 0) return
    if (sigmaShown[selectedDate]) return

    const cacheKey = 'sigma-todo-' + selectedDate
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) { setSigmaMsg(cached); return }

    setSigmaLoading(true)
    getSigmaAnalysis(todosForDay, trackerData, sections, lang, selectedDate).then(msg => {
      if (msg) {
        setSigmaMsg(msg)
        sessionStorage.setItem(cacheKey, msg)
        setSigmaShown(s => ({...s, [selectedDate]: true}))
      }
      setSigmaLoading(false)
    })
  }, [selectedDate, todosForDay.length])

  const handleAdd = async (taskData) => {
    if (user?.id) {
      const saved = await dbAddTodo(user.id, taskData)
      if (saved) setTodos(prev => [...prev, { ...taskData, id: saved.id }])
    } else {
      setTodos(prev => [...prev, { ...taskData, id: Date.now() }])
    }
    setSigmaMsg('')
  }

  const handleToggle = async (id, done) => {
    setTodos(prev => prev.map(t => t.id === id ? {...t, done} : t))
    if (user?.id) await dbUpdateTodo(id, { done })
    setSigmaMsg('')
    sessionStorage.removeItem('sigma-todo-' + selectedDate)
  }

  const handleDelete = async (id) => {
    setTodos(prev => prev.filter(t => t.id !== id))
    if (user?.id) await dbDeleteTodo(id)
  }

  // Navigate days
  const prevDay = () => setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))
  const nextDay = () => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))

  // Week strip (7 days centered on today)
  const weekDays = Array.from({length: 7}, (_, i) => {
    const d = addDays(subDays(new Date(), 3), i)
    return format(d, 'yyyy-MM-dd')
  })

  // Month view
  const monthDays = eachDayOfInterval({
    start: startOfMonth(new Date(selectedDate)),
    end: endOfMonth(new Date(selectedDate))
  })

  const doneCount = todosForDay.filter(t => t.done).length
  const totalCount = todosForDay.length

  return (
    <div className="pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold text-white">
          {t(lang, 'টু-ডু', 'To-Do')}
        </h1>
        <div className="flex gap-2">
          <button onClick={() => setView(view==='day'?'month':'day')}
            className="glass px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white transition-all">
            {view==='day' ? '📅' : '📋'} {view==='day' ? t(lang,'মাস','Month') : t(lang,'দিন','Day')}
          </button>
        </div>
      </div>

      {view === 'day' && (
        <>
          {/* Week strip */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
            {weekDays.map(d => {
              const isSelected = d === selectedDate
              const isToday2 = d === format(new Date(), 'yyyy-MM-dd')
              const dayTodos = todos.filter(t => t.date === d)
              const hasDone = dayTodos.some(t => t.done)
              const hasUndone = dayTodos.some(t => !t.done)
              return (
                <button key={d} onClick={() => setSelectedDate(d)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all shrink-0 min-w-[52px] ${
                    isSelected ? 'gradient-brand text-white glow-orange' : 'glass text-gray-500 hover:text-white'
                  }`}>
                  <span className="text-[10px] font-medium">{format(new Date(d+'T00:00:00'), 'EEE')}</span>
                  <span className={`font-display font-bold text-base ${isToday2 && !isSelected ? 'text-orange-400' : ''}`}>
                    {format(new Date(d+'T00:00:00'), 'dd')}
                  </span>
                  <div className="flex gap-0.5">
                    {hasDone && <div className="w-1 h-1 rounded-full bg-green-400"/>}
                    {hasUndone && <div className="w-1 h-1 rounded-full bg-orange-400"/>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Date header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevDay} className="p-2 glass rounded-xl text-gray-500 hover:text-white transition-all">
              <ChevronLeft size={16}/>
            </button>
            <div className="text-center">
              <p className="font-display font-bold text-white">
                {format(new Date(selectedDate+'T00:00:00'), 'dd MMMM yyyy')}
              </p>
              <p className="text-xs text-gray-500">
                {format(new Date(selectedDate+'T00:00:00'), 'EEEE')}
                {totalCount > 0 && ` · ${doneCount}/${totalCount} ${t(lang,'সম্পন্ন','done')}`}
              </p>
            </div>
            <button onClick={nextDay} className="p-2 glass rounded-xl text-gray-500 hover:text-white transition-all">
              <ChevronRight size={16}/>
            </button>
          </div>

          {/* Sigma analysis */}
          {(sigmaLoading || sigmaMsg) && (
            <div className="glass rounded-2xl p-4 mb-4 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold font-display">Σ</span>
                </div>
                <span className="text-xs text-orange-400 font-medium">Sigma</span>
                <Sparkles size={10} className="text-orange-400"/>
              </div>
              {sigmaLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"/>
                  <span className="text-xs text-gray-500">{t(lang,'বিশ্লেষণ করছি...','Analyzing...')}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-200 font-body leading-relaxed">{sigmaMsg}</p>
              )}
            </div>
          )}

          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{doneCount}/{totalCount} {t(lang,'সম্পন্ন','completed')}</span>
                <span>{Math.round((doneCount/totalCount)*100)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full gradient-brand rounded-full transition-all duration-500"
                  style={{width:`${(doneCount/totalCount)*100}%`}}/>
              </div>
            </div>
          )}

          {/* Tasks by time slot */}
          {todosForDay.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📝</p>
              <p className="text-gray-500 text-sm font-body mb-4">
                {t(lang,'এই দিনের কোনো task নেই','No tasks for this day')}
              </p>
              <button onClick={() => setShowAdd(true)}
                className="gradient-brand px-5 py-2.5 rounded-xl text-sm text-white font-medium flex items-center gap-2 mx-auto">
                <Plus size={14}/> {t(lang,'Task যোগ করো','Add Task')}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {TIME_SLOTS.map(slot => {
                const slotTasks = todosForDay.filter(t => (t.slot || 'morning') === slot.key)
                if (slotTasks.length === 0) return null
                return (
                  <div key={slot.key}>
                    <p className="text-xs font-medium text-gray-500 mb-2 px-1">
                      {lang==='bn' ? slot.label : slot.labelEn}
                    </p>
                    <div className="glass rounded-2xl px-3 py-1 divide-y divide-white/5">
                      {slotTasks
                        .sort((a,b) => (a.time||'').localeCompare(b.time||''))
                        .map(todo => (
                          <TaskItem key={todo.id} todo={todo} lang={lang}
                            onToggle={handleToggle} onDelete={handleDelete}/>
                        ))}
                    </div>
                  </div>
                )
              })}

              {/* Tasks without slot */}
              {(() => {
                const noSlot = todosForDay.filter(t => !t.slot)
                if (!noSlot.length) return null
                return (
                  <div className="glass rounded-2xl px-3 py-1 divide-y divide-white/5">
                    {noSlot.map(todo => (
                      <TaskItem key={todo.id} todo={todo} lang={lang}
                        onToggle={handleToggle} onDelete={handleDelete}/>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}
        </>
      )}

      {/* Month view */}
      {view === 'month' && (
        <div>
          <p className="font-display font-bold text-white text-center mb-4">
            {format(new Date(selectedDate), 'MMMM yyyy')}
          </p>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S','M','T','W','T','F','S'].map((d,i) => (
              <div key={i} className="text-center text-[10px] text-gray-600 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first day */}
            {Array.from({length: monthDays[0].getDay()}, (_, i) => (
              <div key={'e'+i}/>
            ))}
            {monthDays.map(day => {
              const dKey = format(day, 'yyyy-MM-dd')
              const dayTodos = todos.filter(t => t.date === dKey)
              const done = dayTodos.filter(t => t.done).length
              const total = dayTodos.length
              const isSelected = dKey === selectedDate
              const isToday2 = dKey === format(new Date(), 'yyyy-MM-dd')
              return (
                <button key={dKey} onClick={() => { setSelectedDate(dKey); setView('day') }}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all text-xs font-medium ${
                    isSelected ? 'gradient-brand text-white' :
                    isToday2 ? 'border border-orange-500/40 text-orange-400' :
                    'glass text-gray-400 hover:text-white'
                  }`}>
                  <span>{format(day, 'd')}</span>
                  {total > 0 && (
                    <div className="flex gap-0.5">
                      {done > 0 && <div className="w-1 h-1 rounded-full bg-green-400"/>}
                      {done < total && <div className="w-1 h-1 rounded-full bg-orange-400"/>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Add button */}
      {view === 'day' && (
        <button onClick={() => setShowAdd(true)}
          className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 gradient-brand rounded-full flex items-center justify-center shadow-lg glow-orange z-40 active:scale-95 transition-all">
          <Plus size={24} className="text-white"/>
        </button>
      )}

      <AddTaskModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAdd}
        lang={lang}
        selectedDate={selectedDate}
      />
    </div>
  )
}