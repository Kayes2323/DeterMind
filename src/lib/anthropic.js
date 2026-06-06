export async function callClaude(messages, systemPrompt = '') {
  const key = import.meta.env.VITE_GROQ_API_KEY
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + key,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: systemPrompt
        ? [{ role: 'system', content: systemPrompt }, ...messages]
        : messages,
      max_tokens: 1000,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}