import { askAI } from './ai'

// Kept for older imports; the AI now runs through our server route (/api/ai).
export async function callClaude(messages, systemPrompt = '') {
  return askAI({ system: systemPrompt, messages, maxTokens: 1000 })
}
