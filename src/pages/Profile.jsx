import { useState } from 'react'
import { useStore } from '../store'
import { Card, Badge, Button, Input } from '../components/ui'
import { t, calcStreak, calcDailyScore, getLast30Days, today } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { dbSaveProfile } from '../hooks/useSupabase'
import {
  LogOut, Bell, User, Target, Flame, BarChart2,
  CheckSquare, Edit3, Save, Shield, Info, Star,
  ChevronRight, Award
} from 'lucide-react'
import { format } from 'date-fns'

const BADGES = [
  { icon:'🥇', title:'Student of the Week', desc:'এই সপ্তাহে সর্বোচ্চ score', unlocked: false },
  { icon:'🔥', title:'7-Day Warrior', desc:'৭ দিন consecutive entry', unlocked: false },
  { icon:'⚡', title:'First Step', desc:'প্রথম entry দিয়েছো', unlocked: true },
  { icon:'📚', title:'Study Master', desc:'সপ্তাহে ৪০+ ঘণ্টা পড়া', unlocked: false },
  { icon:'🎯', title:'Goal Setter', desc:'Goal set করেছো', unlocked: false },
  { icon:'👑', title:'Student of the Month', desc:'মাসে সর্বোচ্চ score', unlocked: false },
]

export default function Profile() {
  const { user, logout, lang, setLang, sections, entries, notifications, markAllRead, userGoal, setUserGoal } = useStore()
  const navigate = useNavigate()
  const [editName, setEditName] = useState(false)
  const [nameDraft, setNameDraft] = useState(user?.name || '')
  const [tab, setTab] = useState('profile') // profile | badges | about
  const [saving, setSaving] = useState(false)

  const streak = calcStreak(entries, sections)
  const todayScore = calcDailyScore(entries[today()] || {}, sections)
  const last30 = getLast30Days()
  const activeDays = last30.filter(d => {
    const de = entries[d] || {}
    return sections.some(s => de[s.id] !== undefined && de[s.id] !== '')
  }).length
  const unread = notifications.filter(n => !n.read).length

  // Unlock badges dynamically
  const dynamicBadges = BADGES.map(b => {
    if (b.title === 'First Step' && activeDays > 0) return { ...b, unlocked: true }
    if (b.title === '7-Day Warrior' && streak >= 7) return { ...b, unlocked: true }
    if (b.title === 'Goal Setter' && userGoal) return { ...b, unlocked: true }
    return b
  })

  const saveName = async () => {
    if (!nameDraft.trim()) return
    setSaving(true)
    try {
      if (user?.id) await dbSaveProfile(user.id, { name: nameDraft })
    } catch(e) { console.error(e) }
    setEditName(false)
    setSaving(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    logout()
    navigate('/auth')
  }

  const stats = [
    { icon: '🔥', label: t(lang,'Streak','Streak'), value: streak + t(lang,' দিন',' days') },
    { icon: '📊', label: t(lang,'আজকের স্কোর','Today Score'), value: todayScore },
    { icon: '📅', label: t(lang,'সক্রিয় দিন','Active Days'), value: activeDays },
    { icon: '📋', label: t(lang,'সেকশন','Sections'), value: sections.length },
  ]

  return (
    <div className="pb-20 md:pb-6">
      <h1 className="font-display text-2xl font-bold text-white mb-5">{t(lang,'প্রোফাইল','Profile')}</h1>

      {/* Avatar + info */}
      <div className="glass rounded-2xl p-5 mb-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none"/>
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border-2 border-orange-500/40">
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover"/>
              : <div className="w-full h-full gradient-brand flex items-center justify-center text-white font-bold font-display text-3xl">
                  {user?.name?.[0]?.toUpperCase() || 'D'}
                </div>
            }
          </div>
          {editName ? (
            <div className="flex items-center gap-2 justify-center mb-1">
              <input value={nameDraft} onChange={e=>setNameDraft(e.target.value)}
                className="bg-transparent border-b border-orange-500/50 text-white text-lg font-display font-bold outline-none text-center w-40"
                autoFocus/>
              <button onClick={saveName} className="text-orange-400 hover:text-orange-300">
                <Save size={16}/>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center mb-1">
              <h2 className="font-display font-bold text-white text-xl">{user?.name}</h2>
              <button onClick={() => setEditName(true)} className="text-gray-500 hover:text-orange-400 transition-colors">
                <Edit3 size={14}/>
              </button>
            </div>
          )}
          <p className="text-gray-500 text-sm font-body">{user?.email}</p>
          {userGoal && (
            <div className="mt-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl inline-block">
              <p className="text-xs text-orange-300 font-body">🎯 {userGoal}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 p-1 glass rounded-xl w-fit">
        {[
          {k:'profile', label: t(lang,'প্রোফাইল','Profile')},
          {k:'badges', label: t(lang,'ব্যাজ','Badges')},
          {k:'about', label: t(lang,'অ্যাপ সম্পর্কে','About')},
        ].map(({k,label}) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all font-body ${tab===k?'gradient-brand text-white':'text-gray-500 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {stats.map(s => (
              <Card key={s.label} className="text-center py-4">
                <div className="text-2xl mb-1">{s.icon}</div>
                <p className="font-display font-black text-xl text-white">{s.value}</p>
                <p className="text-xs text-gray-500 font-body">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Notifications */}
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-white flex items-center gap-2">
                <Bell size={15} className="text-orange-400"/>
                {t(lang,'নোটিফিকেশন','Notifications')}
                {unread > 0 && <Badge color="orange">{unread}</Badge>}
              </h3>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-gray-500 hover:text-white transition-colors">
                  {t(lang,'সব পড়া','Mark all read')}
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4 font-body">
                {t(lang,'কোনো নোটিফিকেশন নেই','No notifications yet')}
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {notifications.slice(0,8).map(n => (
                  <div key={n.id} className={`p-3 rounded-xl text-xs font-body flex gap-2 ${n.read?'opacity-50':''}`}>
                    <span>{n.icon||'🤖'}</span>
                    <div className="flex-1">
                      <p className="text-white">{n.message}</p>
                      <p className="text-gray-600 mt-0.5">{n.time}</p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 bg-orange-400 rounded-full shrink-0 mt-1"/>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Settings */}
          <Card className="mb-4">
            <h3 className="font-display font-bold text-white mb-3">{t(lang,'সেটিংস','Settings')}</h3>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <span className="text-sm text-gray-300 font-body">{t(lang,'ভাষা','Language')}</span>
              <button onClick={() => setLang(lang==='bn'?'en':'bn')}
                className="glass px-4 py-1.5 rounded-xl text-sm text-white font-mono hover:border-orange-500/30 transition-all">
                {lang==='bn'?'🇧🇩 বাংলা':'🇬🇧 English'}
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-300 font-body">{t(lang,'অ্যাকাউন্ট','Account')}</span>
              <span className="text-xs text-gray-500 font-body">{user?.email}</span>
            </div>
          </Card>

          <Button variant="danger" className="w-full" onClick={handleLogout}>
            <LogOut size={16}/> {t(lang,'লগআউট','Logout')}
          </Button>
        </>
      )}

      {/* Badges Tab */}
      {tab === 'badges' && (
        <div>
          <p className="text-gray-500 text-sm font-body mb-4">
            {t(lang,`${dynamicBadges.filter(b=>b.unlocked).length} / ${dynamicBadges.length} ব্যাজ অর্জিত`,
              `${dynamicBadges.filter(b=>b.unlocked).length} / ${dynamicBadges.length} badges earned`)}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {dynamicBadges.map(b => (
              <div key={b.title} className={`glass rounded-2xl p-4 text-center border transition-all ${b.unlocked?'border-orange-500/30':'border-white/5 opacity-50'}`}>
                <div className={`text-3xl mb-2 ${!b.unlocked?'grayscale':''}`}>{b.icon}</div>
                <h3 className="font-display font-bold text-white text-xs mb-1">{b.title}</h3>
                <p className="text-[10px] text-gray-500 font-body">{b.desc}</p>
                {b.unlocked && <div className="mt-2 text-[10px] text-orange-400">✅ অর্জিত</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About Tab */}
      {tab === 'about' && (
        <div>
          <Card className="mb-4 text-center">
            <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-3 glow-orange">
              <span className="text-white text-3xl font-display font-bold">⚡</span>
            </div>
            <h2 className="font-display font-bold text-white text-xl mb-1">DeterMind</h2>
            <p className="text-gray-500 text-sm font-body mb-2">Determine Your Path. Dominate Your Day.</p>
            <Badge color="orange">Version 1.0.0</Badge>
          </Card>

          <Card className="mb-4">
            <h3 className="font-display font-bold text-white mb-3">Features</h3>
            {[
              { icon:'📊', text: t(lang,'Daily Tracking & Analytics','Daily Tracking & Analytics') },
              { icon:'🤖', text: t(lang,'Sigma AI Mentor','Sigma AI Mentor') },
              { icon:'📅', text: t(lang,'AI Routine Builder','AI Routine Builder') },
              { icon:'⏱', text: t(lang,'Pomodoro Focus Timer','Pomodoro Focus Timer') },
              { icon:'✅', text: t(lang,'Smart To-Do NightPad','Smart To-Do NightPad') },
              { icon:'🏆', text: t(lang,'Achievement Badges','Achievement Badges') },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm text-gray-300 font-body">{f.text}</span>
              </div>
            ))}
          </Card>

          <Card>
            <h3 className="font-display font-bold text-white mb-3">Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {['React','Supabase','Groq AI','Tailwind CSS','Vercel'].map(t => (
                <span key={t} className="glass px-3 py-1 rounded-lg text-xs text-gray-400">{t}</span>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}