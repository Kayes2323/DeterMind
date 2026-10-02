/* global process */
// Server-side proxy for Groq. The Groq key lives only in Vercel's environment
// (GROQ_API_KEY, no VITE_ prefix), so it is never shipped to the browser.
// Only signed-in DeterMind users (valid Supabase session) can call it.

const MODEL = 'llama-3.3-70b-versatile'
const MAX_TOKENS = 1000
const MAX_MESSAGES = 40
const MAX_CHARS = 8000

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

async function isSignedIn(token) {
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return false
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  })
  return r.ok
}

function cleanMessages(system, messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null
  const out = []
  if (typeof system === 'string' && system.trim()) out.push({ role: 'system', content: system.slice(0, MAX_CHARS) })
  for (const m of messages) {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string') return null
    out.push({ role: m.role, content: m.content.slice(0, MAX_CHARS) })
  }
  return out
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'AI is not configured' })

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!(await isSignedIn(token))) return res.status(401).json({ error: 'Sign in required' })

  const { system, messages, maxTokens } = req.body || {}
  const clean = cleanMessages(system, messages)
  if (!clean) return res.status(400).json({ error: 'Invalid request' })

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: Math.min(Math.max(Number(maxTokens) || 300, 1), MAX_TOKENS),
        messages: clean,
      }),
    })
    if (!r.ok) return res.status(502).json({ error: 'AI service error' })
    const data = await r.json()
    return res.status(200).json({ text: data.choices?.[0]?.message?.content ?? '' })
  } catch {
    return res.status(502).json({ error: 'AI service unreachable' })
  }
}
