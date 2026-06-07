import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store'
import { t } from '../utils/helpers'
import { Send, RotateCcw, Sparkles } from 'lucide-react'
import { format } from 'date-fns'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

const SIGMA_SYSTEM = `তুমি Sigma — DeterMind-এর AI mentor। তুমি একজন student-এর personal coach, philosopher, এবং বিশ্বস্ত বন্ধু। তুমি:
- সংক্ষিপ্ত, কার্যকর পরামর্শ দাও
- উৎসাহ দাও কিন্তু সত্য কথা বলো
- বাংলা বা English যেভাবে জিজ্ঞেস করা হয় সেভাবে উত্তর দাও
- Markdown ব্যবহার করো সুন্দর formatting-এর জন্য
- Student-এর data দেখে personalized পরামর্শ দাও`

const SIGMA_SYSTEM_EN = `You are Sigma — DeterMind's AI mentor. You are a student's personal coach, philosopher, and trusted friend. You:
- Give brief, actionable advice
- Motivate but speak truth
- Respond in the language you're asked in
- Use markdown for beautiful formatting
- Give personalized advice based on student's data`

async function chatWithSigma(messages, lang, contextData) {
  const systemPrompt = (lang === 'bn' ? SIGMA_SYSTEM : SIGMA_SYSTEM_EN) +
    (contextData ? `\n\nStudent-এর আজকের data: ${contextData}` : '')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + GROQ_API_KEY,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}


const FORMULAS = [
  'E=mc²','∫f(x)dx','F=ma','a²+b²=c²',
  'PV=nRT','eⁱᵖ+1=0','λ=h/p','ΔG=ΔH−TΔS',
  '∑n²','√(-1)=i','v=λf','pH=−log[H⁺]',
  'sin²+cos²=1','p=mv','W=Fd','n!=n(n-1)!'
]

const DIRECTIONS = [
  { x: -60, y: -55 }, { x: 55, y: -60 }, { x: -65, y: 10 }, { x: 65, y: 15 },
  { x: -40, y: 60 },  { x: 45, y: 58 },  { x: 0, y: -68 },  { x: 70, y: -30 },
  { x: -70, y: -30 }, { x: 20, y: 70 },  { x: -20, y: 70 }, { x: 72, y: 40 },
  { x: -72, y: 40 },  { x: 50, y: -45 }, { x: -50, y: 45 }, { x: 60, y: 55 }
]

function SigmaLogo({ isTyping }) {
  const [burst, setBurst] = useState(false)
  const [formulas, setFormulas] = useState([])

  useEffect(() => {
    if (isTyping) {
      triggerBurst()
      const interval = setInterval(triggerBurst, 2200)
      return () => clearInterval(interval)
    }
  }, [isTyping])

  const triggerBurst = () => {
    const picked = [...FORMULAS].sort(() => Math.random() - 0.5).slice(0, 10)
    setFormulas(picked)
    setBurst(true)
    setTimeout(() => setBurst(false), 1800)
  }

  return (
    <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Pulse rings */}
      {burst && [0,1,2,3].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 40, height: 40,
          borderRadius: '50%',
          border: '1.5px solid #f97316',
          animation: `sigPulse 1.8s ease-out ${i * 0.3}s forwards`,
          opacity: 0,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Flying formulas */}
      {burst && formulas.map((f, i) => {
        const dir = DIRECTIONS[i % DIRECTIONS.length]
        return (
          <span key={i} style={{
            position: 'absolute',
            fontSize: 8,
            fontWeight: 600,
            fontFamily: 'serif',
            color: i % 2 === 0 ? '#f97316' : '#a855f7',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            animation: `sigFly 1.6s ease-out ${i * 0.05}s forwards`,
            opacity: 0,
            '--dx': dir.x + 'px',
            '--dy': dir.y + 'px',
          }}>
            {f}
          </span>
        )
      })}

      {/* Logo */}
      <svg width="40" height="40" viewBox="0 0 40 40" style={{ position: 'relative', zIndex: 5 }}>
        <defs>
          <linearGradient id="sigGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97316"/>
            <stop offset="100%" stopColor="#7c3aed"/>
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill="none" stroke="url(#sigGrad)" strokeWidth="2.5"/>
        <circle cx="20" cy="20" r="14" fill="#111"/>
        <text x="20" y="26" textAnchor="middle" fontSize="16" fontWeight="700" fill="white" fontFamily="serif">Σ</text>
      </svg>

      <style>{`
        @keyframes sigPulse {
          0%   { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes sigFly {
          0%   { opacity: 0; transform: translate(0,0) scale(0.5); }
          20%  { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1); }
        }
      `}</style>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <SigmaLogo isTyping={true} />
      <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0,1,2].map(i => (
            <div key={i} className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex items-end gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && <SigmaLogo isTyping={false} />}
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-body leading-relaxed ${
        isUser
          ? 'gradient-brand text-white rounded-br-sm'
          : 'glass text-gray-100 rounded-bl-sm border border-white/8'
      }`}>
        {msg.content.split('\n').map((line, i) => {
          const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          return line ? (
            <p key={i} className="mb-1 last:mb-0" dangerouslySetInnerHTML={{ __html: formatted }} />
          ) : <br key={i} />
        })}
      </div>
    </div>
  )
}

const QUICK_PROMPTS_BN = [
  'আজকের performance কেমন?',
  'আমার সবচেয়ে দুর্বল দিক কোনটা?',
  'এই সপ্তাহের জন্য একটা plan দাও',
  'আমাকে motivate করো',
]

const QUICK_PROMPTS_EN = [
  'How is my performance today?',
  'What is my weakest area?',
  'Give me a plan for this week',
  'Motivate me',
]

export default function Sigma() {
  const { lang, sections, entries, user } = useStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const todayData = entries[todayKey]
  const contextData = sections.length
    ? sections.map(s => `${s.name}: ${todayData?.[s.id] || 'কোনো data নেই'} ${s.unit || ''}`).join(', ')
    : null

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (messages.length === 0) {
      const hour = new Date().getHours()
      const greeting = hour < 12 ? (lang === 'bn' ? 'সুপ্রভাত' : 'Good morning') :
        hour < 17 ? (lang === 'bn' ? 'শুভ অপরাহ্ন' : 'Good afternoon') :
        (lang === 'bn' ? 'শুভ সন্ধ্যা' : 'Good evening')
      const name = user?.name?.split(' ')[0] || ''
      const welcome = lang === 'bn'
        ? `${greeting}, ${name}! আমি **Sigma** — তোমার AI mentor। আমাকে যেকোনো কিছু জিজ্ঞেস করো — পড়াশোনা, রুটিন, motivation, বা জীবনের যেকোনো বিষয়ে। আমি সবসময় এখানে আছি। 🔥`
        : `${greeting}, ${name}! I'm **Sigma** — your AI mentor. Ask me anything — studies, routine, motivation, or anything in life. I'm always here. 🔥`
      setMessages([{ role: 'assistant', content: welcome }])
    }
  }, [])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const newMessages = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }))
      const reply = await chatWithSigma(apiMessages, lang, contextData)
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch(e) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: lang === 'bn' ? 'দুঃখিত, সমস্যা হয়েছে। আবার চেষ্টা করো।' : 'Sorry, something went wrong. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setMessages([])
    setTimeout(() => {
      const hour = new Date().getHours()
      const greeting = hour < 12 ? (lang === 'bn' ? 'সুপ্রভাত' : 'Good morning') :
        hour < 17 ? (lang === 'bn' ? 'শুভ অপরাহ্ন' : 'Good afternoon') :
        (lang === 'bn' ? 'শুভ সন্ধ্যা' : 'Good evening')
      const welcome = lang === 'bn'
        ? `${greeting}! নতুন conversation শুরু হলো। কী জানতে চাও? 🔥`
        : `${greeting}! New conversation started. What would you like to know? 🔥`
      setMessages([{ role: 'assistant', content: welcome }])
    }, 100)
  }

  const quickPrompts = lang === 'bn' ? QUICK_PROMPTS_BN : QUICK_PROMPTS_EN

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-48px)] pb-0">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div style={{ position: 'relative' }}>
            <SigmaLogo isTyping={false} />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-900" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">Sigma</h1>
            <p className="text-xs text-green-400 font-body">● {t(lang, 'সর্বদা সক্রিয়', 'Always active')}</p>
          </div>
        </div>
        <button onClick={reset}
          className="glass p-2 rounded-xl text-gray-500 hover:text-white transition-all hover:bg-white/10">
          <RotateCcw size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 mb-3">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 1 && !loading && (
        <div className="flex gap-2 mb-3 flex-wrap shrink-0">
          {quickPrompts.map((p, i) => (
            <button key={i} onClick={() => send(p)}
              className="glass px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-white hover:border-orange-500/30 border border-white/8 transition-all flex items-center gap-1.5">
              <Sparkles size={10} className="text-orange-400" />
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="glass rounded-2xl p-2 flex items-end gap-2 border border-white/8 shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
          }}
          placeholder={t(lang, 'Sigma-কে কিছু জিজ্ঞেস করো...', 'Ask Sigma anything...')}
          rows={1}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none resize-none py-2 px-2 font-body max-h-24"
          style={{ scrollbarWidth: 'none' }}
        />
        <button onClick={() => send()}
          disabled={!input.trim() || loading}
          className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center shrink-0 transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 glow-orange">
          <Send size={15} className="text-white" />
        </button>
      </div>
      <p className="text-[10px] text-gray-700 text-center mt-1.5 font-body shrink-0">
        Enter {t(lang, 'চাপো বা', 'or')} ↵ • Shift+Enter {t(lang, 'নতুন লাইন', 'new line')}
      </p>
    </div>
  )
}