export async function callClaude(messages, systemPrompt = '') {
  const res = await fetch(
    'https://naysbubzaxdtblbctdwj.supabase.co/functions/v1/claude-proxy',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5heXNidWJ6YXhkdGJsYmN0ZHdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MjczNTAsImV4cCI6MjA5NjMwMzM1MH0.3zqXpaVYjpgB4Xe0tJWip1f7Yund3TYfKbO-EdwY1IA',
      },
      body: JSON.stringify({ messages, systemPrompt }),
    }
  )
  const data = await res.json()
  return data.content?.[0]?.text || ''
}
 