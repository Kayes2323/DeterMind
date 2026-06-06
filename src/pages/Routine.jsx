import { useState, useRef } from 'react'
import { useStore } from '../store/store-index'
import { Button, Card } from '../components/ui'
import { t } from '../utils/helpers'
import { useReactToPrint } from 'react-to-print'
import { Wand2, Printer, Edit3, Plus, Trash2, GripVertical, Sparkles } from 'lucide-react'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

async function generateWithGroq(prompt, systemPrompt) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + GROQ_API_KEY,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  })
  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

function RoutineRow({ row, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="flex items-center gap-3 p-3 glass rounded-xl group">
      <GripVertical size={14} className="text-gray-700 shrink-0 cursor-grab" />
      <div className="w-20 shrink-0">
        {editing ? (
          <input value={row.time} onChange={e => onUpdate({ time: e.target.value })}
            className="w-full bg-transparent text-xs text-orange-400 font-mono outline-none border-b border-orange-500/50" />
        ) : (
          <span className="text-xs font-mono text-orange-400">{row.time}</span>
        )}
      </div>
      <div className="flex-1">
        {editing ? (
          <input value={row.task} onChange={e => onUpdate({ task: e.target.value })}
            className="w-full bg-transparent text-sm text-white outline-none border-b border-white/20"
            onBlur={() => setEditing(false)} autoFocus />
        ) : (
          <span className="text-sm text-white font-body">{row.task}</span>
        )}
      </div>
      {row.duration && <span className="text-xs text-gray-500 shrink-0">{row.duration}</span>}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="text-gray-500 hover:text-white p-1"><Edit3 size={12} /></button>
        <button onClick={onDelete} className="text-gray-500 hover:text-red-400 p-1"><Trash2 size={12} /></button>
      </div>
    </div>
  )
}

const categoryIcons = { prayer: '🤲', study: '📚', break: '☕', exercise: '💪', sleep: '😴' }

export default function Routine() {
  const { lang } = useStore()
  const [prompt, setPrompt] = useState('')
  const [routine, setRoutine] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const printRef = useRef()

  const handlePrint = useReactToPrint({ content: () => printRef.current })

  const generateRoutine = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    try {
      const systemPrompt = lang === 'bn'
        ? 'তুমি একজন বিশেষজ্ঞ শিক্ষার্থী কোচ। একটি বিজ্ঞানসম্মত দৈনিক রুটিন তৈরি করো। শুধু JSON দাও, আর কিছু না। Format: {"title": "রুটিনের নাম", "goal": "লক্ষ্য", "rows": [{"time": "৬:০০ AM", "task": "কাজ", "duration": "৩০ মিনিট", "category": "prayer"}]}'
        : 'You are an expert student coach. Create a science-based daily routine. Return only JSON, nothing else. Format: {"title": "Routine Name", "goal": "Goal", "rows": [{"time": "6:00 AM", "task": "Task", "duration": "30 min", "category": "study"}]}'

      const text = await generateWithGroq(prompt, systemPrompt)
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setRoutine(parsed)
    } catch (e) {
      console.error(e)
      setError(t(lang, 'সমস্যা হয়েছে। আবার চেষ্টা করো।', 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  const updateRow = (idx, updates) => {
    setRoutine(r => ({ ...r, rows: r.rows.map((row, i) => i === idx ? { ...row, ...updates } : row) }))
  }
  const deleteRow = (idx) => {
    setRoutine(r => ({ ...r, rows: r.rows.filter((_, i) => i !== idx) }))
  }
  const addRow = () => {
    setRoutine(r => ({ ...r, rows: [...r.rows, { time: '??:??', task: t(lang, 'নতুন কাজ', 'New Task'), duration: '30 min', category: 'study' }] }))
  }

  return (
    <div className="pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-white">
          {t(lang, 'AI রুটিন বিল্ডার', 'AI Routine Builder')}
        </h1>
        {routine && (
          <Button onClick={handlePrint} variant="secondary" size="sm">
            <Printer size={14} /> {t(lang, 'প্রিন্ট', 'Print')}
          </Button>
        )}
      </div>

      {!routine && (
        <Card className="mb-5 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-orange-400" />
            <h2 className="font-display font-bold text-white">{t(lang, 'তোমার সম্পর্কে বলো', 'Tell about yourself')}</h2>
          </div>
          <p className="text-xs text-gray-500 font-body mb-3">
            {t(lang, 'AI তোমার জন্য একটি বিজ্ঞানসম্মত রুটিন তৈরি করবে', 'AI will create a science-based routine for you')}
          </p>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={4}
            placeholder={t(lang, 'যেমন: আমি HSC 2026 পরীক্ষার্থী...', 'E.g. I am an HSC 2026 student...')}
            className="w-full glass rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500/50 resize-none mb-3"
          />
          {error && <p className="text-red-400 text-xs mb-3 bg-red-500/10 rounded-lg p-2">{error}</p>}
          <Button onClick={generateRoutine} disabled={loading || !prompt.trim()} className="w-full" size="lg">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t(lang, 'তৈরি হচ্ছে...', 'Generating...')}</>
              : <><Wand2 size={16} /> {t(lang, 'রুটিন তৈরি করো', 'Generate Routine')}</>
            }
          </Button>
        </Card>
      )}

      {routine && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className="font-display font-bold text-white text-lg">{routine.title}</h2>
              <p className="text-xs text-gray-500 font-body">{routine.goal}</p>
            </div>
            <button onClick={() => setRoutine(null)} className="ml-auto text-xs text-gray-500 hover:text-orange-400 transition-colors glass px-3 py-1.5 rounded-lg">
              <Wand2 size={12} className="inline mr-1" />{t(lang, 'নতুন করো', 'Regenerate')}
            </button>
          </div>

          <div ref={printRef}>
            <div className="print:hidden flex flex-col gap-2 mb-3">
              {routine.rows.map((row, idx) => (
                <RoutineRow key={idx} row={row} onUpdate={u => updateRow(idx, u)} onDelete={() => deleteRow(idx)} />
              ))}
            </div>
            <div className="hidden print:block p-8 bg-white">
              <h1 className="text-2xl font-bold text-black mb-1">{routine.title}</h1>
              <p className="text-gray-600 text-sm mb-4">{routine.goal}</p>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-800">
                    <th className="py-2 text-left text-sm text-black">সময়</th>
                    <th className="py-2 text-left text-sm text-black">কাজ</th>
                    <th className="py-2 text-left text-sm text-black">সময়কাল</th>
                  </tr>
                </thead>
                <tbody>
                  {routine.rows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-2 text-sm font-mono text-gray-800">{row.time}</td>
                      <td className="py-2 text-sm text-black">{categoryIcons[row.category] || '•'} {row.task}</td>
                      <td className="py-2 text-sm text-gray-600">{row.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-gray-400 mt-4">Generated by DeterMind — Determine Your Path. Dominate Your Day.</p>
            </div>
          </div>

          <button onClick={addRow} className="w-full glass rounded-xl py-2.5 text-sm text-gray-500 hover:text-white border border-dashed border-white/10 hover:border-orange-500/30 transition-all flex items-center justify-center gap-2">
            <Plus size={14} /> {t(lang, 'সারি যোগ করো', 'Add Row')}
          </button>
        </>
      )}
    </div>
  )
}