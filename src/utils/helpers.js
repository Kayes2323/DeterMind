import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export const today = () => format(new Date(), 'yyyy-MM-dd')

export const getLast7Days = () => {
  const end = new Date()
  const start = subDays(end, 6)
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'))
}

export const getLast30Days = () => {
  const end = new Date()
  const start = subDays(end, 29)
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'))
}

export const getWeekDays = () => {
  const now = new Date()
  return eachDayOfInterval({ start: startOfWeek(now, { weekStartsOn: 6 }), end: endOfWeek(now, { weekStartsOn: 6 }) })
    .map((d) => format(d, 'yyyy-MM-dd'))
}

export const getMonthDays = () => {
  const now = new Date()
  return eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) })
    .map((d) => format(d, 'yyyy-MM-dd'))
}

export const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return format(d, 'dd MMM')
}

export const calcStreak = (entries, sections) => {
  if (!sections.length) return 0
  let streak = 0
  let d = new Date()
  while (true) {
    const key = format(d, 'yyyy-MM-dd')
    const dayEntries = entries[key] || {}
    const hasAny = sections.some((s) => dayEntries[s.id] !== undefined && dayEntries[s.id] !== '')
    if (!hasAny) break
    streak++
    d = subDays(d, 1)
  }
  return streak
}

export const calcDailyScore = (dayData, sections) => {
  if (!sections.length || !dayData) return 0
  let total = 0
  let count = 0
  sections.forEach((sec) => {
    const val = dayData[sec.id]
    if (val === undefined || val === '') return
    count++
    if (sec.type === 'yes_no') total += val === 'yes' ? 100 : 0
    else if (sec.type === 'rating') total += (parseFloat(val) / (sec.max || 5)) * 100
    else if (sec.type === 'percentage') total += parseFloat(val) || 0
    else if (sec.type === 'number') {
      const target = sec.target || 1
      total += Math.min(100, ((parseFloat(val) || 0) / target) * 100)
    } else total += 50
  })
  return count > 0 ? Math.round(total / count) : 0
}

export const t = (lang, bn, en) => (lang === 'bn' ? bn : en)
