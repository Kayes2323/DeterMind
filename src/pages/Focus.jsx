import { useState, useEffect, useRef } from 'react'
import { useStore } from '../store'
import { t } from '../utils/helpers'
import { Plus, Trash2, RotateCcw } from 'lucide-react'

const MODES = [
  { key: 'pomodoro', label: 'Pomodoro', labelBn: 'পমোডরো', mins: 25, color: '#f97316' },
  { key: 'deep', label: 'Deep Work', labelBn: 'ডিপ ওয়ার্ক', mins: 45, color: '#7c3aed' },
  { key: 'short', label: 'Short', labelBn: 'শর্ট', mins: 15, color: '#0891b2' },
]

const BREAK_OPTS = [5, 10, 15]

const DEFAULT_BLOCKERS = [
  { id: 1, name: 'Facebook', icon: '📘', url: 'facebook.com', blocked: true },
  { id: 2, name: 'Instagram', icon: '📸', url: 'instagram.com', blocked: true },
  { id: 3, name: 'TikTok', icon: '🎵', url: 'tiktok.com', blocked: false },
  { id: 4, name: 'YouTube', icon: '▶️', url: 'youtube.com', blocked: false },
]

function CircleTimer({ seconds, total, color, isBreak }) {
  const r = 100
  const circ = 2 * Math.PI * r
  const pct = seconds / total
  const offset = circ * (1 - pct)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return (
    <div style={{ position: 'relative', width: 240, height: 240, margin: '0 auto' }}>
      <svg width="240" height="240" viewBox="0 0 240 240">
        {/* Track */}
        <circle cx="120" cy="120" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        {/* Progress */}
        <circle
          cx="120" cy="120" r={r}
          fill="none"
          stroke={isBreak ? '#22c55e' : color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 120 120)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
        />
        {/* Glow effect */}
        <circle
          cx="120" cy="120" r={r}
          fill="none"
          stroke={isBreak ? '#22c55e' : color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 120 120)"
          style={{ filter: 'blur(4px)', opacity: 0.4, transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      {/* Time display */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', textAlign: 'center'
      }}>
        <div style={{
          fontSize: 52, fontWeight: 700, fontFamily: 'Syne, sans-serif',
          color: 'white', letterSpacing: -2, lineHeight: 1
        }}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>
        <div style={{ fontSize: 13, color: isBreak ? '#22c55e' : color, marginTop: 6, fontWeight: 500 }}>
          {isBreak ? '☕ বিরতি' : '🎯 Focus'}
        </div>
      </div>
    </div>
  )
}

export default function Focus() {
  const { lang } = useStore()
  const [modeIdx, setModeIdx] = useState(0)
  const [breakMins, setBreakMins] = useState(5)
  const [tab, setTab] = useState('timer') // timer | blocker
  const [running, setRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [seconds, setSeconds] = useState(MODES[0].mins * 60)
  const [total, setTotal] = useState(MODES[0].mins * 60)
  const [sessions, setSessions] = useState([false, false, false, false])
  const [sessionCount, setSessionCount] = useState(0)
  const [blockers, setBlockers] = useState(DEFAULT_BLOCKERS)
  const [newApp, setNewApp] = useState('')
  const [showWarning, setShowWarning] = useState(false)
  const [warningApp, setWarningApp] = useState('')
  const intervalRef = useRef(null)

  const mode = MODES[modeIdx]

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (!isBreak) {
              // Session complete
              setSessionCount(c => {
                const newC = c + 1
                setSessions(prev => prev.map((v, i) => i < newC ? true : v))
                return newC
              })
              // Start break
              const breakSecs = breakMins * 60
              setTotal(breakSecs)
              setIsBreak(true)
              setTimeout(() => {
                setSeconds(breakSecs)
                setRunning(true)
              }, 500)
            } else {
              // Break complete
              const focusSecs = mode.mins * 60
              setTotal(focusSecs)
              setIsBreak(false)
              setSeconds(focusSecs)
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, isBreak, breakMins, mode.mins])

  const toggleTimer = () => setRunning(r => !r)

  const reset = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setIsBreak(false)
    const secs = mode.mins * 60
    setSeconds(secs)
    setTotal(secs)
  }

  const selectMode = (idx) => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setIsBreak(false)
    setModeIdx(idx)
    const secs = MODES[idx].mins * 60
    setSeconds(secs)
    setTotal(secs)
    setSessions([false, false, false, false])
    setSessionCount(0)
  }

  const resetAll = () => {
    selectMode(modeIdx)
  }

  const toggleBlocker = (id) => {
    setBlockers(b => b.map(app => app.id === id ? { ...app, blocked: !app.blocked } : app))
  }

  const addApp = () => {
    if (!newApp.trim()) return
    setBlockers(b => [...b, { id: Date.now(), name: newApp, icon: '🔗', url: newApp.toLowerCase(), blocked: true }])
    setNewApp('')
  }

  const handleBlockedClick = (app) => {
    if (running && !isBreak && app.blocked) {
      setWarningApp(app.name)
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 3000)
    }
  }

  const pct = Math.round((1 - seconds / total) * 100)

  return (
    <div className="pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {t(lang, 'ফোকাস টাইমার', 'Focus Timer')}
          </h1>
          <p className="text-xs text-gray-500 font-body mt-0.5">
            {t(lang, 'আজ', 'Today')}: {sessionCount} {t(lang, 'টি session শেষ', 'sessions done')}
            {sessionCount > 0 && ' 🔥'}
          </p>
        </div>
        <button onClick={resetAll} className="glass p-2 rounded-xl text-gray-500 hover:text-white transition-all">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 p-1 glass rounded-xl w-fit">
        <button onClick={() => setTab('timer')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all font-body ${tab === 'timer' ? 'gradient-brand text-white' : 'text-gray-500 hover:text-white'}`}>
          ⏱ {t(lang, 'টাইমার', 'Timer')}
        </button>
        <button onClick={() => setTab('blocker')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all font-body ${tab === 'blocker' ? 'gradient-brand text-white' : 'text-gray-500 hover:text-white'}`}>
          🚫 {t(lang, 'ব্লকার', 'Blocker')}
        </button>
      </div>

      {tab === 'timer' && (
        <div>
          {/* Mode selector */}
          <div className="flex gap-2 mb-6">
            {MODES.map((m, i) => (
              <button key={m.key} onClick={() => selectMode(i)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all border ${modeIdx === i ? 'text-white border-opacity-50' : 'glass text-gray-500 hover:text-white border-white/10'}`}
                style={modeIdx === i ? { background: `${m.color}25`, borderColor: `${m.color}60`, color: m.color } : {}}>
                {lang === 'bn' ? m.labelBn : m.label}
                <br />
                <span className="font-mono text-sm font-bold">{m.mins}m</span>
              </button>
            ))}
          </div>

          {/* Timer circle */}
          <div className="glass rounded-3xl p-8 mb-5 text-center">
            <CircleTimer seconds={seconds} total={total} color={mode.color} isBreak={isBreak} />

            {/* Session dots */}
            <div className="flex gap-2 justify-center mt-6 mb-5">
              {sessions.map((done, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full transition-all duration-500"
                  style={{ background: done ? mode.color : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>

            {/* Controls */}
            <div className="flex gap-3 justify-center">
              <button onClick={reset}
                className="glass px-5 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-all">
                ↺ {t(lang, 'রিসেট', 'Reset')}
              </button>
              <button onClick={toggleTimer}
                className="px-8 py-2.5 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
                style={{ background: isBreak ? '#22c55e' : mode.color, minWidth: 120 }}>
                {running
                  ? `⏸ ${t(lang, 'পজ', 'Pause')}`
                  : `▶ ${t(lang, 'শুরু', 'Start')}`}
              </button>
            </div>
          </div>

          {/* Break selector */}
          <div className="glass rounded-2xl p-4">
            <p className="text-xs text-gray-400 mb-3 font-body">{t(lang, 'বিরতির সময়', 'Break duration')}</p>
            <div className="flex gap-2">
              {BREAK_OPTS.map(b => (
                <button key={b} onClick={() => setBreakMins(b)}
                  className={`flex-1 py-2 rounded-xl text-sm font-mono font-medium transition-all ${breakMins === b ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'glass text-gray-500 hover:text-white'}`}>
                  {b}m
                </button>
              ))}
            </div>
          </div>

          {/* Running status */}
          {running && !isBreak && (
            <div className="mt-4 glass rounded-2xl p-4 border border-orange-500/20 text-center">
              <p className="text-sm text-orange-300 font-body">
                🔥 {t(lang, 'মনোযোগ দাও! বাইরে যেও না।', 'Stay focused! Don\'t leave.')}
              </p>
              <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%`, background: mode.color }} />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'blocker' && (
        <div>
          {/* Warning */}
          {showWarning && (
            <div className="glass rounded-2xl p-4 mb-4 border border-red-500/40 bg-red-500/10 text-center">
              <p className="text-red-400 font-medium text-sm">
                ⚠️ {warningApp} {t(lang, 'এখন ব্লক! Focus session চলছে।', 'is blocked! Focus session running.')}
              </p>
            </div>
          )}

          <div className="glass rounded-2xl p-4 mb-4 border border-orange-500/15">
            <p className="text-xs text-gray-400 font-body">
              💡 {t(lang, 'Timer চললে blocked app-এ click করলে warning দেখাবে', 'Clicking blocked apps during timer shows warning')}
            </p>
          </div>

          <div className="glass rounded-2xl overflow-hidden mb-4">
            {blockers.map((app, i) => (
              <div key={app.id}
                className={`flex items-center gap-3 px-4 py-3.5 transition-all ${i < blockers.length - 1 ? 'border-b border-white/5' : ''}`}
                onClick={() => handleBlockedClick(app)}
                style={{ cursor: running && !isBreak && app.blocked ? 'not-allowed' : 'default' }}>
                <span className="text-xl shrink-0">{app.icon}</span>
                <div className="flex-1">
                  <p className="text-sm text-white font-body">{app.name}</p>
                  <p className="text-xs text-gray-600">{app.url}</p>
                </div>
                {/* Toggle */}
                <button onClick={(e) => { e.stopPropagation(); toggleBlocker(app.id) }}
                  className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${app.blocked ? 'bg-orange-500' : 'bg-white/10'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${app.blocked ? 'left-6' : 'left-1'}`} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setBlockers(b => b.filter(a => a.id !== app.id)) }}
                  className="text-gray-700 hover:text-red-400 transition-colors ml-1 p-1">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Add new */}
          <div className="flex gap-2">
            <input value={newApp} onChange={e => setNewApp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addApp()}
              placeholder={t(lang, 'নতুন app যোগ করো...', 'Add new app...')}
              className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none" />
            <button onClick={addApp}
              className="gradient-brand px-4 py-2.5 rounded-xl text-white text-sm font-medium">
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}