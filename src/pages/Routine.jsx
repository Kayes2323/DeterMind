import { useState, useRef } from 'react'
import { useStore } from '../store'
import { Button, Card, Modal, Input } from '../components/ui'
import { t } from '../utils/helpers'
import { useReactToPrint } from 'react-to-print'
import {
  Printer, Edit3, Plus, Trash2, GripVertical,
  CheckSquare, Circle, CheckCircle, AlertCircle,
  Calendar, ClipboardList
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import { today } from '../utils/helpers'

// ─── Routine Builder ──────────────────────────────────────────────────────────
const EMPTY_ROW = { time: '', task: '', duration: '', category: 'study' }
const CATEGORY_ICONS = { prayer: '🤲', study: '📚', break: '☕', exercise: '💪', sleep: '😴', other: '📌' }
const CATEGORY_COLORS = {
  prayer: 'text-green-400 bg-green-500/10',
  study: 'text-blue-400 bg-blue-500/10',
  break: 'text-yellow-400 bg-yellow-500/10',
  exercise: 'text-orange-400 bg-orange-500/10',
  sleep: 'text-purple-400 bg-purple-500/10',
  other: 'text-gray-400 bg-gray-500/10',
}

function RoutineRow({ row, onUpdate, onDelete, index }) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="flex items-center gap-2 p-3 glass rounded-xl group hover:bg-white/5 transition-all">
      <GripVertical size={14} className="text-gray-700 shrink-0 cursor-grab" />
      <span className="text-[10px] text-gray-600 w-4 shrink-0">{index + 1}</span>

      {/* Category */}
      <select value={row.category} onChange={e => onUpdate({ category: e.target.value })}
        className="bg-transparent text-xs outline-none w-7 shrink-0 cursor-pointer">
        {Object.keys(CATEGORY_ICONS).map(c => (
          <option key={c} value={c} className="bg-dark-800">{CATEGORY_ICONS[c]}</option>
        ))}
      </select>

      {/* Time */}
      <input value={row.time} onChange={e => onUpdate({ time: e.target.value })}
        placeholder="৬:০০"
        className="w-14 bg-transparent text-xs text-orange-400 font-mono outline-none border-b border-transparent focus:border-orange-500/50 shrink-0" />

      {/* Task */}
      <input value={row.task} onChange={e => onUpdate({ task: e.target.value })}
        placeholder="কাজের বিবরণ..."
        className="flex-1 bg-transparent text-sm text-white outline-none border-b border-transparent focus:border-white/20 min-w-0" />

      {/* Duration */}
      <input value={row.duration} onChange={e => onUpdate({ duration: e.target.value })}
        placeholder="৩০ মিনিট"
        className="w-20 bg-transparent text-xs text-gray-500 outline-none border-b border-transparent focus:border-white/20 text-right shrink-0" />

      <button onClick={onDelete} className="text-gray-700 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0">
        <Trash2 size={12} />
      </button>
    </div>
  )
}

function RoutineSection({ lang }) {
  const { savedRoutine, setSavedRoutine } = useStore()
  const [rows, setRows] = useState(savedRoutine?.rows || [])
  const [title, setTitle] = useState(savedRoutine?.title || '')
  const [editingTitle, setEditingTitle] = useState(false)
  const printRef = useRef()

  const handlePrint = useReactToPrint({ content: () => printRef.current })

  const updateRow = (idx, updates) => setRows(r => r.map((row, i) => i === idx ? { ...row, ...updates } : row))
  const deleteRow = (idx) => setRows(r => r.filter((_, i) => i !== idx))
  const addRow = () => setRows(r => [...r, { ...EMPTY_ROW, id: Date.now() }])

  const save = () => {
    setSavedRoutine({ title, rows })
    alert(t(lang, 'রুটিন সংরক্ষিত হয়েছে ✅', 'Routine saved ✅'))
  }

  return (
    <div>
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        {editingTitle ? (
          <input value={title} onChange={e => setTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)} autoFocus
            className="flex-1 bg-transparent text-lg font-display font-bold text-white outline-none border-b border-orange-500/50 mr-3" />
        ) : (
          <h2 className="font-display font-bold text-white text-lg flex items-center gap-2 cursor-pointer" onClick={() => setEditingTitle(true)}>
            {title || t(lang, 'আমার রুটিন', 'My Routine')}
            <Edit3 size={13} className="text-gray-600" />
          </h2>
        )}
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="secondary" size="sm"><Printer size={13} /></Button>
          <Button onClick={save} size="sm">{t(lang, 'সংরক্ষণ', 'Save')}</Button>
        </div>
      </div>

      {/* Sigma hint */}
      <div className="glass rounded-xl p-3 mb-3 border border-orange-500/15 flex items-center gap-3">
        <span className="text-2xl font-display font-bold text-orange-400">Σ</span>
        <div className="flex-1">
          <p className="text-xs text-gray-300 font-body">
            {t(lang, 'Sigma-কে বলো "আমার জন্য একটা routine বানাও" — সে যা দেবে সেটা এখানে paste করো', 'Tell Sigma "create a routine for me" — paste what it gives here')}
          </p>
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-1.5 mb-3">
        {rows.length === 0 ? (
          <div className="text-center py-8 glass rounded-2xl">
            <p className="text-gray-600 text-sm font-body mb-3">
              {t(lang, 'রুটিন খালি। নতুন row যোগ করো।', 'Routine is empty. Add a new row.')}
            </p>
            <Button onClick={addRow} size="sm"><Plus size={13} /> {t(lang, 'Row যোগ করো', 'Add Row')}</Button>
          </div>
        ) : rows.map((row, idx) => (
          <RoutineRow key={row.id || idx} row={row} index={idx}
            onUpdate={u => updateRow(idx, u)} onDelete={() => deleteRow(idx)} />
        ))}
      </div>

      {rows.length > 0 && (
        <button onClick={addRow}
          className="w-full glass rounded-xl py-2.5 text-sm text-gray-500 hover:text-white border border-dashed border-white/10 hover:border-orange-500/30 transition-all flex items-center justify-center gap-2">
          <Plus size={14} /> {t(lang, 'Row যোগ করো', 'Add Row')}
        </button>
      )}

      {/* Print version */}
      <div ref={printRef} className="hidden print:block p-8 bg-white">
        <h1 className="text-2xl font-bold text-black mb-4">{title || 'My Routine'}</h1>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="py-2 text-left text-sm">#</th>
              <th className="py-2 text-left text-sm">সময়</th>
              <th className="py-2 text-left text-sm">কাজ</th>
              <th className="py-2 text-left text-sm">সময়কাল</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-2 text-sm text-gray-500">{i + 1}</td>
                <td className="py-2 text-sm font-mono">{row.time}</td>
                <td className="py-2 text-sm">{CATEGORY_ICONS[row.category]} {row.task}</td>
                <td className="py-2 text-sm text-gray-600">{row.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-4">DeterMind — Determine Your Path. Dominate Your Day.</p>
      </div>
    </div>
  )
}

// ─── Todo Section ─────────────────────────────────────────────────────────────
const REASONS = ['সময় পাইনি', 'ক্লান্ত ছিলাম', 'ভুলে গিয়েছিলাম', 'অন্য কাজ ছিল', 'মনোযোগ ছিল না', 'অন্য কারণ']

function TodoItem({ todo, onUpdate, onRemove, phase, lang }) {
  const [showReason, setShowReason] = useState(false)
  return (
    <div className={`glass rounded-xl p-3.5 transition-all ${todo.done ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onUpdate({ done: !todo.done })} className="mt-0.5 shrink-0">
          {todo.done
            ? <CheckCircle size={17} className="text-green-400" />
            : <Circle size={17} className="text-gray-600" />}
        </button>
        <div className="flex-1">
          <p className={`text-sm font-body ${todo.done ? 'line-through text-gray-500' : 'text-white'}`}>
            {todo.text}
          </p>
          {phase === 1 && (
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">{t(lang, 'কতটুকু:', 'Progress:')}</span>
                {[0, 25, 50, 75, 100].map(p => (
                  <button key={p} onClick={() => onUpdate({ progress: p })}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${todo.progress === p ? 'bg-orange-500/30 text-orange-400 border border-orange-500/40' : 'glass text-gray-500 hover:text-white'}`}>
                    {p}%
                  </button>
                ))}
              </div>
              {!todo.done && (
                <div>
                  <button onClick={() => setShowReason(!showReason)} className="text-xs text-gray-500 hover:text-yellow-400 flex items-center gap-1">
                    <AlertCircle size={10} /> {t(lang, 'কেন হয়নি?', 'Why not done?')}
                  </button>
                  {showReason && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {REASONS.map(r => (
                        <button key={r} onClick={() => { onUpdate({ reason: r }); setShowReason(false) }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${todo.reason === r ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'glass text-gray-500 hover:text-white'}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                  {todo.reason && <span className="text-xs text-yellow-400/70 mt-1 inline-block">⚠️ {todo.reason}</span>}
                </div>
              )}
            </div>
          )}
        </div>
        <button onClick={onRemove} className="text-gray-700 hover:text-red-400 transition-colors p-1 shrink-0">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

function TodoSection({ lang }) {
  const { todos, addTodo, updateTodo, removeTodo } = useStore()
  const [phase, setPhase] = useState(1)
  const [newTodo, setNewTodo] = useState('')

  const todayKey = today()
  const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const tomorrowKey = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')
  const activeKey = phase === 1 ? yesterdayKey : tomorrowKey
  const activeTodos = todos[activeKey] || []
  const doneCount = activeTodos.filter(t => t.done).length

  const addNew = () => {
    if (!newTodo.trim()) return
    addTodo(activeKey, { id: Date.now(), text: newTodo.trim(), done: false, progress: 0, reason: '' })
    setNewTodo('')
  }

  return (
    <div>
      {/* Phase toggle */}
      <div className="flex gap-2 mb-4 p-1 glass rounded-xl w-fit">
        <button onClick={() => setPhase(1)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all font-body ${phase === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-gray-500 hover:text-white'}`}>
          🌙 {t(lang, 'গতকাল রিভিউ', 'Yesterday Review')}
        </button>
        <button onClick={() => setPhase(2)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all font-body ${phase === 2 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-500 hover:text-white'}`}>
          ☀️ {t(lang, 'আগামীকালের প্ল্যান', "Tomorrow's Plan")}
        </button>
      </div>

      {/* Header card */}
      <Card className={`mb-4 border ${phase === 1 ? 'border-yellow-500/20' : 'border-blue-500/20'}`}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">{phase === 1 ? '🌙' : '☀️'}</div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-white text-sm">
              {phase === 1 ? t(lang, 'গতকালের রিভিউ', "Yesterday's Review") : t(lang, 'আগামীকালের পরিকল্পনা', "Tomorrow's Plan")}
            </h3>
            <p className="text-xs text-gray-500">
              {phase === 1 ? format(subDays(new Date(), 1), 'dd MMM yyyy') : format(new Date(Date.now() + 86400000), 'dd MMM yyyy')}
            </p>
          </div>
          {phase === 1 && activeTodos.length > 0 && (
            <div className="text-right">
              <p className="font-display font-black text-xl text-white">{doneCount}/{activeTodos.length}</p>
              <p className="text-xs text-gray-500">{t(lang, 'সম্পন্ন', 'done')}</p>
            </div>
          )}
        </div>
        {phase === 1 && activeTodos.length > 0 && (
          <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${(doneCount / activeTodos.length) * 100}%` }} />
          </div>
        )}
      </Card>

      {/* Todo list */}
      <div className="flex flex-col gap-2 mb-3">
        {activeTodos.length === 0 ? (
          <div className="text-center py-8 glass rounded-2xl">
            <p className="text-gray-600 text-sm font-body">
              {phase === 1 ? t(lang, 'গতকাল কোনো to-do ছিল না', 'No todos from yesterday') : t(lang, 'আগামীকালের জন্য কিছু লেখো', 'Write something for tomorrow')}
            </p>
          </div>
        ) : (
          activeTodos.map(todo => (
            <TodoItem key={todo.id} todo={todo} phase={phase} lang={lang}
              onUpdate={updates => updateTodo(activeKey, todo.id, updates)}
              onRemove={() => removeTodo(activeKey, todo.id)} />
          ))
        )}
      </div>

      {/* Add input */}
      <div className="flex gap-2">
        <input value={newTodo} onChange={e => setNewTodo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addNew()}
          placeholder={phase === 1 ? t(lang, 'গতকাল কী করেছিলে?', 'Add yesterday task...') : t(lang, 'আগামীকাল কী করবে?', 'What will you do tomorrow?')}
          className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50" />
        <Button onClick={addNew} size="sm"><Plus size={16} /></Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Routine() {
  const { lang } = useStore()
  const [tab, setTab] = useState('routine')

  return (
    <div className="pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-bold text-white">
          {t(lang, 'পরিকল্পনা', 'Planning')}
        </h1>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 mb-5 p-1 glass rounded-xl w-fit">
        <button onClick={() => setTab('routine')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all font-body ${tab === 'routine' ? 'gradient-brand text-white' : 'text-gray-500 hover:text-white'}`}>
          <Calendar size={15} /> {t(lang, 'রুটিন', 'Routine')}
        </button>
        <button onClick={() => setTab('todo')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all font-body ${tab === 'todo' ? 'gradient-brand text-white' : 'text-gray-500 hover:text-white'}`}>
          <ClipboardList size={15} /> {t(lang, 'টু-ডু', 'To-Do')}
        </button>
      </div>

      {tab === 'routine' && <RoutineSection lang={lang} />}
      {tab === 'todo' && <TodoSection lang={lang} />}
    </div>
  )
}