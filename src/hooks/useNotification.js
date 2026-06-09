import { useEffect } from 'react'
import { useStore } from '../store'
import { today, calcDailyScore } from '../utils/helpers'
import { format, subDays } from 'date-fns'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

async function generateSmartNotification(todayData, yesterdayData, sections, lang) {
  if (!sections.length || !GROQ_API_KEY) return null
  try {
    const todayStr = sections.map(s => `${s.name}: ${todayData?.[s.id] || 'নেই'} ${s.unit||''}`).join(', ')
    const yesterdayStr = sections.map(s => `${s.name}: ${yesterdayData?.[s.id] || 'নেই'} ${s.unit||''}`).join(', ')
    const todayScore = calcDailyScore(todayData, sections)
    const yesterdayScore = calcDailyScore(yesterdayData, sections)

    const prompt = lang === 'bn'
      ? `গতকাল: ${yesterdayStr} (score: ${yesterdayScore})\nআজ: ${todayStr} (score: ${todayScore})\n\nএকটি ছোট notification message লেখো (১ লাইন, ৮০ character-এর মধ্যে)। শুধু message, আর কিছু না।`
      : `Yesterday: ${yesterdayStr} (score: ${yesterdayScore})\nToday: ${todayStr} (score: ${todayScore})\n\nWrite one short notification message (1 line, under 80 chars). Just the message, nothing else.`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_API_KEY,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 100,
        messages: [
          { role: 'system', content: 'You are a student coach. Write very short, motivating notification messages.' },
          { role: 'user', content: prompt }
        ],
      }),
    })
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() ?? null
  } catch(e) {
    return null
  }
}

function getDefaultMessage(todayData, yesterdayData, sections, lang) {
  if (!sections.length) return null

  const todayScore = calcDailyScore(todayData, sections)
  const yesterdayScore = calcDailyScore(yesterdayData, sections)
  const hasDataToday = sections.some(s => todayData?.[s.id])
  const hour = new Date().getHours()

  if (!hasDataToday) {
    if (lang === 'bn') return `⚡ আজকের data এখনো দাওনি! এখনই update করো।`
    return `⚡ You haven't logged today's data yet!`
  }

  if (todayScore > yesterdayScore) {
    if (lang === 'bn') return `🔥 দারুণ! আজ গতকালের চেয়ে ভালো করেছো (${todayScore} vs ${yesterdayScore})`
    return `🔥 Great! Today's score (${todayScore}) beats yesterday (${yesterdayScore})`
  }

  if (todayScore < yesterdayScore) {
    if (lang === 'bn') return `💪 আজ একটু কম হয়েছে। আরো ভালো করা যাবে!`
    return `💪 Score dropped today. You can do better!`
  }

  if (hour >= 21) {
    if (lang === 'bn') return `🌙 রাত হয়েছে। আগামীকালের plan করো!`
    return `🌙 Evening check-in. Plan for tomorrow!`
  }

  return null
}

export function useSmartNotification() {
  const { entries, sections, lang, addNotification, notifications } = useStore()

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }

    // Check if already notified today
    const todayKey = today()
    const alreadyNotified = sessionStorage.getItem('notified-' + todayKey)
    if (alreadyNotified) return

    // Wait 2 seconds after app load
    const timer = setTimeout(async () => {
      const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd')
      const todayData = entries[todayKey] || {}
      const yesterdayData = entries[yesterdayKey] || {}

      // Try AI message first, fallback to default
      let message = await generateSmartNotification(todayData, yesterdayData, sections, lang)
      if (!message) message = getDefaultMessage(todayData, yesterdayData, sections, lang)
      if (!message) return

      // Add to in-app notifications
      addNotification({
        message,
        icon: '🤖',
        time: format(new Date(), 'HH:mm'),
        type: 'daily'
      })

      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification('DeterMind', {
          body: message,
          icon: '/icon-192.png',
          badge: '/favicon-32.png',
        })
      }

      sessionStorage.setItem('notified-' + todayKey, '1')
    }, 2000)

    return () => clearTimeout(timer)
  }, [sections.length])

  // Request permission once
  useEffect(() => {
    if (Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission()
      }, 5000)
    }
  }, [])
}