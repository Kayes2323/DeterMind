import { supabase } from './supabase'

export async function callClaude(messages, systemPrompt = '') {
  const { data, error } = await supabase.functions.invoke('claude-proxy', {
    body: { messages, systemPrompt }
  })
  if (error) throw error
  return data.content?.[0]?.text || ''
}