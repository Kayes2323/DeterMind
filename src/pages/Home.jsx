import { useState, useEffect } from 'react'
import { useStore } from '../store'
import { Card, Button, Badge, ScoreRing, Modal, Input } from '../components/ui'
import { today, calcStreak, calcDailyScore, t } from '../utils/helpers'
import { format, differenceInDays, parseISO, subDays } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Flame, Target, Bell, Plus, Trash2, Calendar, Zap, ChevronRight } from 'lucide-react'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

async function getAIFeedback(todayData, yesterdayData, sections, lang) {
  if (!sections.length) return null
  try {
    const formatData = (data) => sections.map(s => {
      const val = data?.[s.id]
      if (!val) return `${s.name}: কোনো data নেই`
      return `${s.name}: ${val} ${s.unit || ''}`
    }).join(', ')

    const todayStr = formatData(todayData)
    const yesterdayStr = formatData(yesterdayData)

    const prompt = lang === 'bn'
      ? `গতকালের data: ${yesterdayStr}\nআজকের data: ${todayStr}\n\nএই data বিশ্লেষণ করে ২-৩ লাইনের একটি উৎসাহমূলক feedback দাও। কী ভালো হয়েছে, কী উন্নতি করা দরকার সেটা বলো। সহজ বাংলায় লেখো।`
      : `Yesterday: ${yesterdayStr}\nToday: ${todayStr}\n\nAnalyze this data and give 2-3 lines of encouraging feedback. Mention what improved and what needs work. Keep it simple and motivating.`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 200,
        messages: [
          { role: 'system', content: lang === 'bn' ? 'তুমি একজন friendly student coach। সংক্ষিপ্ত, উৎসাহমূলক feedback দাও।' : 'You are a friendly student coach. Give brief, motivating feedback.' },
          { role: 'user', content: prompt }
        ],
      }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? null
  } catch(e) {
    return null
  }
}

function CountdownCard({ exam, onDelete, lang }) {
  const days = differenceInDays(parseISO(exam.date), new Date())
  const urgent = days <= 7
  const soon = days <= 30
  return (
    <div className={`glass rounded-2xl p-4 border ${urgent ? 'border-red-500/40 bg-red-500/5' : soon ? 'border-yellow-500/30' : 'border-white/5'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={14} className={urgent ? 'text-red-400' : soon ? 'text-yellow-400' : 'text-orange-400'} />
            <span className="text-xs text-gray-400 font-body">{t(lang, 'পরীক্ষা', 'Exam')}</span>
          </div>
          <h3 className="font-display font-bold text-white text-sm">{exam.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{format(parseISO(exam.date), 'dd MMM yyyy')}</p>
        </div>
        <div className="text-right">
          <div className={`font-display font-black text-3xl ${urgent ? 'text-red-400' : soon ? 'text-yellow-400' : 'gradient-text'}`}>
            {days < 0 ? '✓' : days}
          </div>
          <div className="text-xs text-gray-500">{days < 0 ? t(lang,'শেষ','done') : t(lang,'দিন বাকি','days left')}</div>
        </div>
      </div>
      {days > 0 && (
        <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${urgent ? 'bg-red-400' : soon ? 'bg-yellow-400' : 'gradient-brand'}`}
            style={{ width: `${Math.max(5, 100 - (days / 180) * 100)}%` }} />
        </div>
      )}
      <button onClick={() => onDelete(exam.id)} className="mt-2 text-[10px] text-gray-600 hover:text-red-400 transition-colors">
        <Trash2 size={10} className="inline mr-1" />{t(lang,'মুছো','Remove')}
      </button>
    </div>
  )
}

function AddExamModal({ open, onClose, lang }) {
  const { addExam } = useStore()
  const [form, setForm] = useState({ name: '', date: '' })
  const save = () => {
    if (!form.name || !form.date) return
    addExam({ ...form, id: Date.now().toString() })
    setForm({ name: '', date: '' })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={t(lang, 'পরীক্ষা যোগ করো', 'Add Exam')}>
      <div className="flex flex-col gap-4">
        <Input label={t(lang,'পরীক্ষার নাম','Exam Name')} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="যেমন: HSC 2026" />
        <Input label={t(lang,'তারিখ','Date')} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
        <Button onClick={save} className="w-full">{t(lang,'যোগ করো','Add')}</Button>
      </div>
    </Modal>
  )
}

export default function Home() {
  const { user, userGoal, setUserGoal, exams, removeExam, entries, sections, lang } = useStore()
  const [showAddExam, setShowAddExam] = useState(false)
  const [editGoal, setEditGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState(userGoal)
  const [aiMessage, setAiMessage] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const navigate = useNavigate()

  const todayKey = today()
  const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd')
  const todayData = entries[todayKey] || {}
  const yesterdayData = entries[yesterdayKey] || {}
  const score = calcDailyScore(todayData, sections)
  const streak = calcStreak(entries, sections)

  // Load AI feedback on mount
  useEffect(() => {
    if (!sections.length || !GROQ_API_KEY) return
    const cached = sessionStorage.getItem('ai-feedback-' + todayKey)
    if (cached) { setAiMessage(cached); return }

    setAiLoading(true)
    getAIFeedback(todayData, yesterdayData, sections, lang).then(msg => {
      if (msg) {
        setAiMessage(msg)
        sessionStorage.setItem('ai-feedback-' + todayKey, msg)
      }
      setAiLoading(false)
    })
  }, [sections.length, todayKey])

  return (
    <div className="pb-20 md:pb-6">
      {/* Welcome */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-500 text-sm font-body">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
          <h1 className="font-display text-2xl font-bold text-white mt-0.5">
            {t(lang,'স্বাগতম','Welcome')}, {user?.name?.split(' ')[0]} 👋
          </h1>
        </div>
        <button onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500/40">
          {user?.avatar
            ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            : <div className="w-full h-full gradient-brand flex items-center justify-center text-white font-bold font-display text-sm">
                {user?.name?.[0]?.toUpperCase() || 'D'}
              </div>
          }
        </button>
      </div>

      {/* BIG GOAL */}
      <div className="glass rounded-2xl p-5 mb-5 border border-orange-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start gap-3 relative z-10">
          <div className="w-10 h-10 bg-orange-500/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <Target size={18} className="text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-orange-400 font-medium font-body uppercase tracking-wide">
                {t(lang,'তোমার লক্ষ্য','Your Goal')}
              </span>
              <button onClick={() => { setEditGoal(true); setGoalDraft(userGoal) }} className="text-xs text-gray-500 hover:text-orange-400 transition-colors">✏️</button>
            </div>
            {editGoal ? (
              <div className="flex gap-2">
                <input value={goalDraft} onChange={e => setGoalDraft(e.target.value)}
                  className="flex-1 bg-transparent border-b border-orange-500/50 text-white text-sm outline-none pb-1"
                  placeholder={t(lang,'তোমার স্বপ্ন লেখো...','Write your dream...')} autoFocus />
                <button onClick={() => { setUserGoal(goalDraft); setEditGoal(false) }} className="text-orange-400 text-sm font-medium">✓</button>
              </div>
            ) : (
              <p className="text-white font-display font-semibold text-lg leading-tight">
                {userGoal || t(lang,'"তোমার স্বপ্নটা লেখো এখানে..."','"Write your dream here..."')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Card className="flex flex-col items-center justify-center text-center py-4 gap-1">
          <ScoreRing score={score} size={64} />
          <span className="text-xs text-gray-500 font-body mt-1">{t(lang,'আজকের স্কোর','Today Score')}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center py-4 gap-1">
          <div className="flex items-center gap-1">
            <Flame size={22} className="text-orange-400" />
            <span className="font-display font-black text-2xl text-white">{streak}</span>
          </div>
          <span className="text-xs text-gray-500 font-body">{t(lang,'দিনের streak','Day Streak')}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center py-4 gap-1">
          <div className="flex items-center gap-1">
            <Zap size={18} className="text-yellow-400" />
            <span className="font-display font-black text-2xl text-white">{sections.length}</span>
          </div>
          <span className="text-xs text-gray-500 font-body">{t(lang,'সেকশন','Sections')}</span>
        </Card>
      </div>

      {/* AI Feedback */}
      {(aiLoading || aiMessage) && (
        <div className="glass rounded-2xl p-4 mb-5 border border-orange-500/15">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🤖</span>
            <span className="text-xs text-orange-400 font-medium">AI Coach</span>
            <Badge color="orange">আজকের বিশ্লেষণ</Badge>
          </div>
          {aiLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-xs text-gray-500">{t(lang,'বিশ্লেষণ করছি...','Analyzing...')}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-200 font-body leading-relaxed">{aiMessage}</p>
          )}
        </div>
      )}

      {/* Exam Countdowns */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-white">{t(lang,'পরীক্ষার কাউন্টডাউন','Exam Countdown')}</h2>
          <button onClick={() => setShowAddExam(true)} className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus size={13} /> {t(lang,'যোগ করো','Add')}
          </button>
        </div>
        {exams.length === 0 ? (
          <button onClick={() => setShowAddExam(true)}
            className="w-full glass rounded-2xl border border-dashed border-white/10 p-6 text-center text-gray-600 hover:border-orange-500/30 hover:text-gray-400 transition-all">
            <Calendar size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-body">{t(lang,'পরীক্ষার তারিখ যোগ করো','Add your exam date')}</p>
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {exams.map(exam => (
              <CountdownCard key={exam.id} exam={exam} onDelete={removeExam} lang={lang} />
            ))}
          </div>
        )}
      </div>

      {/* Quick action */}
      <div className="glass rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="font-display font-semibold text-white text-sm">{t(lang,'আজকের entry দাওনি?','Daily entry missing?')}</p>
          <p className="text-xs text-gray-500 font-body mt-0.5">{t(lang,'এখনই আপডেট করো','Update now')}</p>
        </div>
        <Button onClick={() => navigate('/dashboard')} size="sm">
          {t(lang,'যাও','Go')} <ChevronRight size={14} />
        </Button>
      </div>

      <AddExamModal open={showAddExam} onClose={() => setShowAddExam(false)} lang={lang} />
    </div>
  )
}