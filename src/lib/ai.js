import { auth } from './firebase'

// Asks the AI through our own server route (/api/ai), which holds the Gemini
// key — it never ships to the browser. The server also requires a real
// (non-anonymous) Firebase sign-in, so this doubles as the server-side
// enforcement of the same login-gated features RequireAuth gates in the UI.
export async function askAI({ system = '', messages, maxTokens = 300 }) {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null
  if (!token) throw new Error('Login করা নেই')

  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    // The server accepts at most 40 messages; keep the most recent ones.
    body: JSON.stringify({ system, messages: messages.slice(-30), maxTokens }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `AI request failed (${res.status})`)
  if (!data.text) throw new Error('AI থেকে কোনো response পাওয়া যায়নি')
  return data.text
}
