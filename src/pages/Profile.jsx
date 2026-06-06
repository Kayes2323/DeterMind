import { useStore } from '../store/store-index'
import { Card, Badge, Button } from '../components/ui'
import { t, calcStreak, calcDailyScore, getLast30Days, today } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'
import { LogOut, Bell, BellOff, User, Target, Flame, BarChart2, CheckSquare } from 'lucide-react'

export default function Profile() {
  const { user, logout, lang, setLang, sections, entries, notifications, markAllRead, userGoal } = useStore()
  const navigate = useNavigate()

  const streak = calcStreak(entries, sections)
  const todayScore = calcDailyScore(entries[today()] || {}, sections)
  const last30 = getLast30Days()
  const activeDays = last30.filter(d => {
    const de = entries[d] || {}
    return sections.some(s => de[s.id] !== undefined && de[s.id] !== '')
  }).length
  const unread = notifications.filter(n => !n.read).length

  const stats = [
    { icon:'🔥', label:t(lang,'Streak','Streak'), value:streak + t(lang,' দিন',' days') },
    { icon:'📊', label:t(lang,'আজকের স্কোর','Today Score'), value:todayScore },
    { icon:'📅', label:t(lang,'সক্রিয় দিন (৩০)','Active Days (30)'), value:activeDays },
    { icon:'📋', label:t(lang,'সেকশন','Sections'), value:sections.length },
  ]

  return (
    <div className="pb-20 md:pb-6">
      <h1 className="font-display text-2xl font-bold text-white mb-6">{t(lang,'প্রোফাইল','Profile')}</h1>

      {/* Avatar + info */}
      <Card className="mb-4 text-center py-7">
        <div className="w-20 h-20 gradient-brand rounded-full flex items-center justify-center text-white font-display font-black text-3xl mx-auto mb-3 glow-orange">
          {user?.name?.[0]?.toUpperCase() || 'R'}
        </div>
        <h2 className="font-display font-bold text-white text-xl">{user?.name}</h2>
        <p className="text-gray-500 text-sm font-body">{user?.email}</p>
        {userGoal && (
          <div className="mt-3 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl mx-auto inline-block">
            <p className="text-xs text-orange-300 font-body">🎯 {userGoal}</p>
          </div>
        )}
      </Card>

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
            <Bell size={16} className="text-orange-400"/>
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
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
            {notifications.slice(0,10).map(n => (
              <div key={n.id} className={`p-3 rounded-xl text-xs font-body flex gap-2 ${n.read?'opacity-50':''}`}>
                <span>{n.icon||'🤖'}</span>
                <div>
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
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300 font-body">{t(lang,'ভাষা','Language')}</span>
            <button onClick={() => setLang(lang==='bn'?'en':'bn')}
              className="glass px-4 py-1.5 rounded-xl text-sm text-white font-mono hover:border-orange-500/30 transition-all">
              {lang==='bn'?'🇧🇩 বাংলা':'🇬🇧 English'}
            </button>
          </div>
        </div>
      </Card>

      {/* Logout */}
      <Button variant="danger" className="w-full" onClick={() => { logout(); navigate('/auth') }}>
        <LogOut size={16}/> {t(lang,'লগআউট','Logout')}
      </Button>
    </div>
  )
}
