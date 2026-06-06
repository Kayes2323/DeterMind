import { useState } from 'react'
import { useStore } from '../store/store-index'
import { Card, Badge } from '../components/ui'
import { t } from '../utils/helpers'
import { Trophy, Medal, Star, Users, Globe, Crown } from 'lucide-react'

const MOCK_NATIONAL = [
  { id:1, name:'Rahim Ahmed', score:94, streak:21, avatar:'R', badge:'👑' },
  { id:2, name:'Fatima Khanam', score:91, streak:18, avatar:'F', badge:'🥇' },
  { id:3, name:'Karim Hossain', score:88, streak:15, avatar:'K', badge:'🥈' },
  { id:4, name:'Nadia Islam', score:85, streak:12, avatar:'N', badge:'' },
  { id:5, name:'Arif Billah', score:82, streak:10, avatar:'A', badge:'' },
  { id:6, name:'Sadia Rahman', score:79, streak:9, avatar:'S', badge:'' },
  { id:7, name:'Tanvir Ahmed', score:76, streak:8, avatar:'T', badge:'' },
]

const BADGES_INFO = [
  { icon:'🥇', title:'Student of the Week', desc:'এই সপ্তাহে সর্বোচ্চ স্কোর', color:'yellow' },
  { icon:'🏅', title:'Student of the Month', desc:'এই মাসে সর্বোচ্চ স্কোর', color:'orange' },
  { icon:'👑', title:'Student of the Year', desc:'এই বছরে সর্বোচ্চ স্কোর', color:'purple' },
  { icon:'🔥', title:'7-Day Warrior', desc:'৭ দিন consecutive', color:'red' },
  { icon:'⚡', title:'Most Improved', desc:'সবচেয়ে বেশি উন্নতি', color:'blue' },
  { icon:'📚', title:'Study Master', desc:'সপ্তাহে ৪০+ ঘণ্টা পড়া', color:'green' },
]

export default function Leaderboard() {
  const { user, lang } = useStore()
  const [tab, setTab] = useState('national')

  return (
    <div className="pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <Trophy size={22} className="text-yellow-400"/> {t(lang,'লিডারবোর্ড','Leaderboard')}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 p-1 glass rounded-xl w-fit">
        {[
          {k:'national', icon:<Globe size={14}/>, label:t(lang,'জাতীয়','National')},
          {k:'badges', icon:<Star size={14}/>, label:t(lang,'ব্যাজ','Badges')},
        ].map(({k,icon,label}) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all font-body ${tab===k?'gradient-brand text-white':'text-gray-500 hover:text-white'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'national' && (
        <div>
          {/* Top 3 podium */}
          <div className="flex items-end justify-center gap-3 mb-6 h-40">
            {[MOCK_NATIONAL[1], MOCK_NATIONAL[0], MOCK_NATIONAL[2]].map((u, i) => {
              const heights = ['h-28','h-36','h-24']
              const ranks = [2,1,3]
              const colors = ['bg-gray-400/20','bg-yellow-500/20','bg-orange-400/20']
              const textColors = ['text-gray-300','text-yellow-400','text-orange-400']
              return (
                <div key={u.id} className={`flex flex-col items-center justify-end ${heights[i]} flex-1 ${colors[i]} rounded-t-2xl border-t border-white/10 p-3`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-lg mb-1 ${i===1?'gradient-brand glow-orange':i===0?'bg-gray-500/40':' bg-orange-500/20'}`}>
                    {u.avatar}
                  </div>
                  <p className="text-xs font-bold text-white truncate w-full text-center">{u.name.split(' ')[0]}</p>
                  <p className={`text-lg font-display font-black ${textColors[i]}`}>{ranks[i]}</p>
                  <p className="text-xs text-gray-400 font-mono">{u.score}</p>
                </div>
              )
            })}
          </div>

          {/* Full list */}
          <div className="flex flex-col gap-2">
            {MOCK_NATIONAL.map((u, idx) => {
              const isMe = u.name === user?.name
              const rankColors = ['text-yellow-400','text-gray-300','text-orange-400']
              return (
                <div key={u.id} className={`flex items-center gap-3 p-4 glass rounded-2xl transition-all ${isMe?'border border-orange-500/40 bg-orange-500/5':''}`}>
                  <span className={`font-display font-black text-lg w-6 text-center ${rankColors[idx] || 'text-gray-600'}`}>
                    {idx < 3 ? ['🥇','🥈','🥉'][idx] : idx+1}
                  </span>
                  <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center font-display font-bold text-white shrink-0">
                    {u.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white font-body">{u.name} {u.badge} {isMe && <Badge color="orange">তুমি</Badge>}</p>
                    <p className="text-xs text-gray-500">🔥 {u.streak} {t(lang,'দিনের streak','day streak')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-black text-xl text-white">{u.score}</p>
                    <p className="text-xs text-gray-500">{t(lang,'স্কোর','score')}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-600 text-center mt-4 font-body">
            {t(lang,'* Demo data। Real data Supabase sync-এর পর আসবে','* Demo data. Real data after Supabase sync')}
          </p>
        </div>
      )}

      {tab === 'badges' && (
        <div>
          <p className="text-gray-500 text-sm font-body mb-4">
            {t(lang,'বিভিন্ন achievement অর্জন করো এবং badge জিতে নাও!','Earn achievements and win badges!')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {BADGES_INFO.map(b => (
              <Card key={b.title} className="text-center py-5">
                <div className="text-3xl mb-2">{b.icon}</div>
                <h3 className="font-display font-bold text-white text-xs mb-1">{b.title}</h3>
                <p className="text-[10px] text-gray-500 font-body">{b.desc}</p>
                <div className="mt-3 px-2 py-1 bg-white/5 rounded-lg">
                  <p className="text-[10px] text-gray-600">{t(lang,'এখনো অর্জিত হয়নি','Not yet earned')}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
