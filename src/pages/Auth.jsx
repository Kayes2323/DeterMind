import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Button, Input } from '../components/ui'
import { Zap, ArrowRight, Sparkles } from 'lucide-react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser, setOnboardingDone } = useStore()
  const navigate = useNavigate()

  const handle = async () => {
    setError('')
    if (!form.email || !form.password) return setError('সব field পূরণ করো')
    setLoading(true)
    try {
      // Simulate auth — replace with real Supabase auth
      await new Promise((r) => setTimeout(r, 800))
      const user = { id: Date.now().toString(), name: form.name || form.email.split('@')[0], email: form.email }
      setUser(user)
      navigate('/')
    } catch {
      setError('কিছু সমস্যা হয়েছে, আবার চেষ্টা করো')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-brand rounded-2xl mb-4 glow-orange">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text mb-1">DeterMind</h1>
          <p className="text-gray-500 text-sm font-body">Determine Your Path. Dominate Your Day.</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-7 noise">
          <h2 className="font-display text-xl font-bold text-white mb-1">
            {isLogin ? 'স্বাগতম 👋' : 'যাত্রা শুরু করো'}
          </h2>
          <p className="text-gray-500 text-sm mb-6 font-body">
            {isLogin ? 'তোমার account-এ login করো' : 'নতুন account তৈরি করো'}
          </p>

          <div className="flex flex-col gap-4">
            {!isLogin && (
              <Input
                label="তোমার নাম"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="যেমন: রাহিম"
              />
            )}
            <Input
              label="ইমেইল"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
            <Input
              label="পাসওয়ার্ড"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="কমপক্ষে ৬ অক্ষর"
            />

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <Button onClick={handle} disabled={loading} size="lg" className="w-full mt-1">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Login' : 'Account তৈরি করো'}
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>

          <div className="mt-5 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-gray-500 hover:text-orange-400 transition-colors font-body"
            >
              {isLogin ? 'নতুন account? ' : 'আগেই account আছে? '}
              <span className="text-orange-400 font-medium">
                {isLogin ? 'Sign Up করো' : 'Login করো'}
              </span>
            </button>
          </div>
        </div>

        {/* Feature hints */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: '📊', text: 'Daily Tracking' },
            { icon: '🏆', text: 'Leaderboard' },
            { icon: '🤖', text: 'AI Coach' },
          ].map((f) => (
            <div key={f.text} className="glass rounded-xl p-3 text-center">
              <div className="text-lg mb-1">{f.icon}</div>
              <div className="text-[10px] text-gray-500 font-body">{f.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
