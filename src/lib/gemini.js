const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-2.5-flash'

// messages: [{ role: 'user' | 'assistant', content: string }]
export async function chatWithGemini(messages, systemPrompt = '') {
  if (!GEMINI_API_KEY) throw new Error('VITE_GEMINI_API_KEY সেট করা নেই')

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        ...(systemPrompt ? { systemInstruction: { parts: [{ text: systemPrompt }] } } : {}),
      }),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || `Gemini API error (${res.status})`)

  const candidate = data.candidates?.[0]
  const text = candidate?.content?.parts?.map(p => p.text).join('')
  if (!text) {
    if (candidate?.finishReason === 'SAFETY') throw new Error('Gemini safety filter-এ আটকে গেছে')
    throw new Error('Gemini থেকে কোনো response পাওয়া যায়নি')
  }
  return text
}
