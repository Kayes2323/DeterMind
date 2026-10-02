import { supabase } from './supabase'

// Asks the AI through our own server route (/api/ai), which holds the Groq key.
// Returns the reply text, or '' if the user is signed out or the call fails.
export async function askAI({ system = '', messages, maxTokens = 300 }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return ''
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    // The server accepts at most 40 messages; keep the most recent ones.
    body: JSON.stringify({ system, messages: messages.slice(-30), maxTokens }),
  })
  if (!res.ok) return ''
  const data = await res.json()
  return data.text ?? ''
}
