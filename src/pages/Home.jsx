import { useState } from 'react'
import { useStore } from '../store'
import { Card, Button, Badge, ScoreRing, Modal, Input } from '../components/ui'
import { today, calcStreak, calcDailyScore, t } from '../utils/helpers'
import { format, differenceInDays, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  Flame, Target, Bell, Plus, Trash2, Calendar,
  TrendingUp, TrendingDown, Minus, Zap, Star, ChevronRight
} from 'lucide-react'

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
          <div className={`font-display font-black text-3xl ${urgent ? 'text-red-400 glow-text' : soon ? 'text-yellow-400' : 'gradient-text'}`}>
            {days < 0 ? '✓' : days}
          </div>
          <div className="text-xs text-gray-500">{days < 0 ? t(lang,'শেষ','done') : t(lang,'দিন বাকি','days left')}</div>
        </div>
      </div>
      {days > 0 && (
        <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${urgent ? 'bg-red-400' : soon ? 'bg-yellow-400' : 'gradient-brand'}`}
            style={{ width: `${Math.max(5, 100 - (days / 180) * 100)}%` }}
          />
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
    addExam(form)
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
  const { user, userGoal, setUserGoal, exams, removeExam, entries, sections, notifications, lang } = useStore()
  const [showAddExam, setShowAddExam] = useState(false)
  const [editGoal, setEditGoal] = useState(false)
  const [goalDraft, setGoalDraft] = useState(userGoal)
  const navigate = useNavigate()

  const todayKey = today()
  const todayData = entries[todayKey] || {}
  const score = calcDailyScore(todayData, sections)
  const streak = calcStreak(entries, sections)
  const unread = notifications.filter(n => !n.read)

  const scoreColor = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-orange-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
  const scoreLabel = score >= 80 ? '🔥 দারুণ!' : score >= 60 ? '👍 ভালো' : score >= 40 ? '⚠️ মাঝামাঝি' : '😔 কম'

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
        <button onClick={() => navigate('/profile')} className="w-10 h-10 gradient-brand rounded-full flex items-center justify-center text-white font-bold font-display text-sm glow-orange">
          {user?.name?.[0]?.toUpperCase() || 'R'}
        </button>
      </div>

      {/* BIG GOAL */}
      <div className="glass rounded-2xl p-5 mb-5 border border-orange-500/20 relative overflow-hidden noise">
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
              <button onClick={() => { setEditGoal(true); setGoalDraft(userGoal) }} className="text-xs text-gray-500 hover:text-orange-400 transition-colors">
                ✏️
              </button>
            </div>
            {editGoal ? (
              <div className="flex gap-2">
                <input
                  value={goalDraft}
                  onChange={e => setGoalDraft(e.target.value)}
                  className="flex-1 bg-transparent border-b border-orange-500/50 text-white text-sm outline-none pb-1"
                  placeholder={t(lang,'তোমার স্বপ্ন লেখো...','Write your dream...')}
                  autoFocus
                />
                <button onClick={() => { setUserGoal(goalDraft); setEditGoal(false) }}
                  className="text-orange-400 text-sm font-medium">✓</button>
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

      {/* Exam Countdowns */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-white">{t(lang,'পরীক্ষার কাউন্টডাউন','Exam Countdown')}</h2>
          <button onClick={() => setShowAddExam(true)} className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors">
            <Plus size={13} /> {t(lang,'যোগ করো','Add')}
          </button>
        </div>
        {exams.length === 0 ? (
          <button
            onClick={() => setShowAddExam(true)}
            className="w-full glass rounded-2xl border border-dashed border-white/10 p-6 text-center text-gray-600 hover:border-orange-500/30 hover:text-gray-400 transition-all"
          >
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

      {/* AI Notifications */}
      {unread.length > 0 && (
        <div className="mb-5">
          <h2 className="font-display font-bold text-white mb-3 flex items-center gap-2">
            <Bell size={16} className="text-orange-400" />
            {t(lang,'AI Coach এর বার্তা','AI Coach Messages')}
            <Badge color="orange">{unread.length}</Badge>
          </h2>
          <div className="flex flex-col gap-2">
            {unread.slice(0, 3).map(n => (
              <div key={n.id} className="glass rounded-xl p-4 border border-orange-500/15">
                <div className="flex items-start gap-3">
                  <div className="text-lg shrink-0">{n.icon || '🤖'}</div>
                  <div>
                    <p className="text-sm text-white font-body">{n.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Sigma floating button — bottom right */}
      <button
        onClick={() => navigate('/sigma')}
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '16px',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="active:scale-95 transition-all md:hidden"
      >
        <div style={{ position: 'relative', width: 52, height: 52 }}>
          {/* Pulse ring animation */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)',
            animation: 'sigmaFloat 2s ease-in-out infinite',
          }} />
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ position: 'relative', zIndex: 2 }}>
            <defs>
              <linearGradient id="sigHomeGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f97316"/>
                <stop offset="100%" stopColor="#7c3aed"/>
              </linearGradient>
            </defs>
            <circle cx="26" cy="26" r="24" fill="none" stroke="url(#sigHomeGrad)" strokeWidth="2.5"/>
            <circle cx="26" cy="26" r="20" fill="#111"/>
            <text x="26" y="33" textAnchor="middle" fontSize="20" fontWeight="700" fill="white" fontFamily="serif">Σ</text>
          </svg>
          {/* Green dot */}
          <div style={{
            position: 'absolute', bottom: 2, right: 2,
            width: 10, height: 10, borderRadius: '50%',
            background: '#22c55e',
            border: '2px solid #0a0a0f',
            zIndex: 3,
          }} />
        </div>
        <style>{`
          @keyframes sigmaFloat {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.4); opacity: 0.3; }
          }
        `}</style>
      </button>
    </div>
  )
}