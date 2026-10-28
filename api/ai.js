/* global process */
// Server-side proxy for Gemini. The key lives only in Vercel's environment
// (GEMINI_API_KEY, no VITE_ prefix), so it is never shipped to the browser.
// Only a real (non-anonymous) signed-in Firebase user can call this — the
// same requirement RequireAuth enforces client-side, enforced again here so
// it can't be bypassed by calling this route directly.

const GEMINI_MODEL = 'gemini-2.5-flash'
const MAX_TOKENS = 1000
const MAX_MESSAGES = 40
const MAX_CHARS = 8000

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY

async function isRealSignedInUser(idToken) {
  if (!idToken || !FIREBASE_API_KEY) return false
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })
  if (!r.ok) return false
  const data = await r.json()
  const user = data.users?.[0]
  // Anonymous Firebase users have no linked identity provider; real accounts do.
  return !!user && Array.isArray(user.providerUserInfo) && user.providerUserInfo.length > 0
}

function cleanMessages(system, messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return null
  const out = []
  for (const m of messages) {
    if (!m || !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string') return null
    out.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content.slice(0, MAX_CHARS) }] })
  }
  return { system: typeof system === 'string' ? system.slice(0, MAX_CHARS) : '', contents: out }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'AI is not configured' })

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!(await isRealSignedInUser(token))) return res.status(401).json({ error: 'Sign in required' })

  const { system, messages, maxTokens } = req.body || {}
  const clean = cleanMessages(system, messages)
  if (!clean) return res.status(400).json({ error: 'Invalid request' })

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: clean.contents,
          ...(clean.system ? { systemInstruction: { parts: [{ text: clean.system }] } } : {}),
          generationConfig: { maxOutputTokens: Math.min(Math.max(Number(maxTokens) || 300, 1), MAX_TOKENS) },
        }),
      }
    )
    if (!r.ok) return res.status(502).json({ error: 'AI service error' })
    const data = await r.json()
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? ''
    return res.status(200).json({ text })
  } catch {
    return res.status(502).json({ error: 'AI service unreachable' })
  }
}
