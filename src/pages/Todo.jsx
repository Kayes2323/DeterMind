import { useState } from 'react'
import { useStore } from '../store'
import { Button, Card, Badge } from '../components/ui'
import { today, t } from '../utils/helpers'
import { format, subDays } from 'date-fns'
import { Plus, Trash2, CheckCircle, Circle, ChevronRight, Moon, Sun, AlertCircle } from 'lucide-react'

const REASONS = [
  'সময় পাইনি', 'ক্লান্ত ছিলাম', 'ভুলে গিয়েছিলাম',
  'অন্য কাজ ছিল', 'মনোযোগ ছিল না', 'অসুস্থ ছিলাম', 'অন্য কারণ'
]

function TodoItem({ todo, onUpdate, onRemove, phase, lang }) {
  const [showReason, setShowReason] = useState(false)
  const [note, setNote] = useState(todo.reason || '')

  return (
    <div className={`glass rounded-xl p-4 transition-all ${todo.done ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onUpdate({ done: !todo.done })} className="mt-0.5 shrink-0">
          {todo.done
            ? <CheckCircle size={18} className="text-green-400" />
            : <Circle size={18} className="text-gray-600" />}
        </button>
        <div className="flex-1">
          <p className={`text-sm font-body ${todo.done ? 'line-through text-gray-500' : 'text-white'}`}>
            {todo.text}
          </p>

          {/* Phase 1: progress + reason */}
          {phase === 1 && (
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{t(lang,'কতটুকু:','Progress:')}</span>
                <div className="flex gap-1">
                  {[0,25,50,75,100].map(p => (
                    <button key={p} onClick={() => onUpdate({ progress: p })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${todo.progress===p?'bg-orange-500/30 text-orange-400 border border-orange-500/40':'glass text-gray-500 hover:text-white'}`}>
                      {p}%
                    </button>
                  ))}
                </div>
              </div>
              {!todo.done && (
                <div>
                  <button onClick={() => setShowReason(!showReason)} className="text-xs text-gray-500 hover:text-yellow-400 flex items-center gap-1">
                    <AlertCircle size={11} /> {t(lang,'কেন হয়নি?','Why not done?')}
                  </button>
                  {showReason && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {REASONS.map(r => (
                        <button key={r} onClick={() => { onUpdate({ reason: r }); setShowReason(false) }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${todo.reason===r?'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30':'glass text-gray-500 hover:text-white'}`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                  {todo.reason && (
                    <span className="text-xs text-yellow-400/70 mt-1 inline-block">⚠️ {todo.reason}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <button onClick={onRemove} className="text-gray-700 hover:text-red-400 transition-colors p-1 shrink-0">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function Todo() {
  const { todos, addTodo, updateTodo, removeTodo, lang } = useStore()
  const [phase, setPhase] = useState(1) // 1 = review yesterday, 2 = plan tomorrow
  const [newTodo, setNewTodo] = useState('')

  const todayKey = today()
  const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const tomorrowKey = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')

  const activeKey = phase === 1 ? yesterdayKey : tomorrowKey
  const activeTodos = todos[activeKey] || []

  const doneCount = activeTodos.filter(t => t.done).length
  const totalCount = activeTodos.length

  const addNew = () => {
    if (!newTodo.trim()) return
    addTodo(activeKey, newTodo.trim())
    setNewTodo('')
  }

  return (
    <div className="pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-white">
          {t(lang,'নাইটপ্যাড ✍️','NightPad ✍️')}
        </h1>
        <Badge color={phase===1?'yellow':'blue'}>
          {phase === 1 ? (lang==='bn'?'রিভিউ':'Review') : (lang==='bn'?'পরিকল্পনা':'Plan')}
        </Badge>
      </div>

      {/* Phase toggle */}
      <div className="glass rounded-2xl p-1 flex mb-5 w-fit gap-1">
        <button onClick={() => setPhase(1)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all font-body ${phase===1?'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30':'text-gray-500 hover:text-white'}`}>
          <Moon size={15}/> {t(lang,'গতকাল রিভিউ','Yesterday Review')}
        </button>
        <button onClick={() => setPhase(2)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all font-body ${phase===2?'bg-blue-500/20 text-blue-400 border border-blue-500/30':'text-gray-500 hover:text-white'}`}>
          <Sun size={15}/> {t(lang,'আগামীকালের প্ল্যান','Tomorrow Plan')}
        </button>
      </div>

      {/* Phase 1 Header */}
      {phase === 1 && (
        <Card className="mb-4 border border-yellow-500/20">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🌙</div>
            <div>
              <h2 className="font-display font-bold text-white">{t(lang,'গতকালের রিভিউ','Yesterday Review')}</h2>
              <p className="text-xs text-gray-500 font-body">{format(subDays(new Date(),1), 'dd MMMM yyyy')}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-display font-black text-2xl text-white">{doneCount}/{totalCount}</p>
              <p className="text-xs text-gray-500">{t(lang,'সম্পন্ন','completed')}</p>
            </div>
          </div>
          {totalCount > 0 && (
            <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (doneCount/totalCount)*100 : 0}%` }} />
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3 font-body italic">
            💡 {t(lang,'"প্রতিটি ব্যর্থতা তোমাকে আরো শক্তিশালী করে"','"Every failure makes you stronger"')}
          </p>
        </Card>
      )}

      {/* Phase 2 Header */}
      {phase === 2 && (
        <Card className="mb-4 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="text-3xl">☀️</div>
            <div>
              <h2 className="font-display font-bold text-white">{t(lang,'আগামীকালের পরিকল্পনা','Tomorrow Plan')}</h2>
              <p className="text-xs text-gray-500 font-body">{format(new Date(Date.now()+86400000), 'dd MMMM yyyy')}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 font-body italic">
            💡 {t(lang,'"ছোট ছোট লক্ষ্য ঠিক করো, সেগুলো পূরণ করো"','"Set small goals, achieve them"')}
          </p>
        </Card>
      )}

      {/* Todo list */}
      <div className="flex flex-col gap-2 mb-4">
        {activeTodos.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">{phase===1?'😴':'📝'}</p>
            <p className="text-gray-500 font-body text-sm">
              {phase===1
                ? t(lang,'গতকাল কোনো to-do ছিল না','No todos from yesterday')
                : t(lang,'আগামীকালের জন্য কিছু লেখো','Write something for tomorrow')}
            </p>
          </div>
        ) : (
          activeTodos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              phase={phase}
              lang={lang}
              onUpdate={(updates) => updateTodo(activeKey, todo.id, updates)}
              onRemove={() => removeTodo(activeKey, todo.id)}
            />
          ))
        )}
      </div>

      {/* Add new */}
      <div className="glass rounded-2xl p-4 sticky bottom-20 md:bottom-6">
        <div className="flex gap-2">
          <input
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            onKeyDown={e => e.key==='Enter' && addNew()}
            placeholder={phase===1
              ? t(lang,'গতকাল কী করেছিলে লেখো...','Add yesterday task...')
              : t(lang,'আগামীকাল কী করবে?','What will you do tomorrow?')}
            className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50"
          />
          <Button onClick={addNew} size="sm"><Plus size={16}/></Button>
        </div>
        <p className="text-[10px] text-gray-600 mt-2 font-body">
          Enter {t(lang,'চাপো বা','or')} + {t(lang,'বাটন','button')} • {activeTodos.length} {t(lang,'টাস্ক','tasks')}
        </p>
      </div>
    </div>
  )
}
