import { useState, useMemo } from 'react'
import { useStore } from '../store/store-index'
import { Card, Button, Badge, Modal, Input, Select } from '../components/ui'
import { today, getLast7Days, getLast30Days, formatDate, calcDailyScore, t } from '../utils/helpers'
import { dbAddSection, dbDeleteSection, dbSetEntry } from '../hooks/useSupabase'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts'
import { Plus, BarChart2, Table, Activity, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

const DATA_TYPES = [
  { value: 'number', label: 'সংখ্যা — যেমন: ৬ ঘণ্টা' },
  { value: 'rating', label: 'রেটিং — যেমন: ৫/৫' },
  { value: 'yes_no', label: 'হ্যাঁ/না — যেমন: ✅ ❌' },
  { value: 'percentage', label: 'শতাংশ — যেমন: ৭৫%' },
  { value: 'time', label: 'সময় — ঘণ্টা দশমিকে' },
]
const COLORS = ['#f97316','#22c55e','#3b82f6','#a855f7','#ec4899','#eab308','#06b6d4','#f43f5e']

// ─── Cell Input Popup ────────────────────────────────────────────────────────
function CellPopup({ section, value, onSave, onClose }) {
  const [val, setVal] = useState(value || '')
  const handleSave = () => { onSave(val); onClose() }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative glass rounded-2xl p-5 w-72 z-10 border border-white/10" onClick={e => e.stopPropagation()}>
        <p className="text-xs text-gray-400 mb-1 font-body">{section.name}</p>
        <p className="text-white font-display font-bold text-base mb-4">
          {section.unit ? `মান দাও (${section.unit})` : 'মান দাও'}
        </p>
        {section.type === 'yes_no' && (
          <div className="flex gap-3 mb-4">
            {['yes','no'].map(v => (
              <button key={v} onClick={() => { onSave(v); onClose() }}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${
                  val===v ? v==='yes'
                    ? 'bg-green-500/30 text-green-300 border-green-500/50'
                    : 'bg-red-500/30 text-red-300 border-red-500/50'
                    : 'glass text-gray-400 border-white/10 hover:border-white/30'
                }`}>
                {v==='yes' ? '✅ হ্যাঁ' : '❌ না'}
              </button>
            ))}
          </div>
        )}
        {section.type === 'rating' && (
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {Array.from({length: parseInt(section.max)||5}, (_,i) => i+1).map(i => (
              <button key={i} onClick={() => setVal(i.toString())}
                className={`w-10 h-10 rounded-xl text-sm font-mono font-bold transition-all border ${
                  parseInt(val)>=i ? 'bg-orange-500/30 text-orange-300 border-orange-500/50' : 'glass text-gray-500 border-white/10'
                }`}>{i}</button>
            ))}
          </div>
        )}
        {['number','time','percentage'].includes(section.type) && (
          <input
            type="number"
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder={section.type==='percentage' ? '0–100' : '0'}
            step={section.type==='time' ? '0.5' : '1'}
            autoFocus
            className="w-full glass rounded-xl px-4 py-3 text-2xl text-white text-center font-mono outline-none focus:border-orange-500/50 mb-4"
          />
        )}
        {section.type !== 'yes_no' && (
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 glass rounded-xl py-2.5 text-sm text-gray-400 hover:text-white transition-all">বাতিল</button>
            <button onClick={handleSave} className="flex-1 gradient-brand rounded-xl py-2.5 text-sm text-white font-medium">সংরক্ষণ ✓</button>
          </div>
        )}
        {val && section.type !== 'yes_no' && (
          <button onClick={() => { onSave(''); onClose() }} className="w-full mt-2 text-xs text-gray-600 hover:text-red-400 transition-colors">মুছে ফেলো</button>
        )}
      </div>
    </div>
  )
}

// ─── Delete Confirm Popup ────────────────────────────────────────────────────
function DeleteConfirm({ section, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative glass rounded-2xl p-6 w-72 z-10 border border-white/10" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 size={22} className="text-red-400" />
        </div>
        <p className="text-white font-display font-bold text-center mb-1">Column মুছবে?</p>
        <p className="text-gray-400 text-xs text-center font-body mb-5">
          <span style={{color: section.color}} className="font-semibold">"{section.name}"</span> এবং এর সব data মুছে যাবে। এটা undo করা যাবে না।
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 glass rounded-xl py-2.5 text-sm text-gray-400 hover:text-white transition-all">বাতিল</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl py-2.5 text-sm text-red-400 font-medium transition-all">মুছে দাও</button>
        </div>
      </div>
    </div>
  )
}

// ─── Three Dot Menu ──────────────────────────────────────────────────────────
function SectionMenu({ section, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-block">
      <button
        onClick={e => { e.stopPropagation(); setOpen(!open) }}
        className="p-1 rounded-lg text-gray-600 hover:text-white hover:bg-white/10 transition-all">
        <MoreVertical size={13} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-50 glass rounded-xl border border-white/10 shadow-xl overflow-hidden w-32">
            <button
              onClick={() => { setOpen(false); onEdit() }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-all">
              <Pencil size={12} className="text-orange-400" /> Edit
            </button>
            <button
              onClick={() => { setOpen(false); onDelete() }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-all">
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Edit Section Modal ──────────────────────────────────────────────────────
function EditSectionModal({ section, open, onClose, onSave }) {
  const [form, setForm] = useState({ name: section.name, unit: section.unit||'', target: section.target||'', max: section.max||'5', color: section.color })
  const save = () => { onSave({ ...section, ...form }); onClose() }
  return (
    <Modal open={open} onClose={onClose} title="Column সম্পাদনা করো">
      <div className="flex flex-col gap-4">
        <Input label="Column-এর নাম" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        {['number','time'].includes(section.type) && (
          <>
            <Input label="একক (unit)" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} placeholder="ঘণ্টা / পৃষ্ঠা" />
            <Input label="দৈনিক লক্ষ্য" type="number" value={form.target} onChange={e=>setForm({...form,target:e.target.value})} />
          </>
        )}
        {section.type === 'rating' && (
          <Input label="সর্বোচ্চ মান" type="number" value={form.max} onChange={e=>setForm({...form,max:e.target.value})} />
        )}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">রঙ</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button key={c} onClick={() => setForm({...form,color:c})}
                className={`w-8 h-8 rounded-full border-2 transition-all ${form.color===c?'border-white scale-110':'border-transparent'}`}
                style={{background:c}} />
            ))}
          </div>
        </div>
        <Button onClick={save} className="w-full">সংরক্ষণ করো</Button>
      </div>
    </Modal>
  )
}

// ─── Add Section Modal ───────────────────────────────────────────────────────
function AddSectionModal({ open, onClose, lang }) {
  const { addSection, sections, user } = useStore()
  const [form, setForm] = useState({ name:'', type:'number', unit:'', target:'', max:'5' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const sectionData = { ...form, color: COLORS[sections.length % COLORS.length], order_index: sections.length }
    try {
      if (user?.id) {
        const saved = await dbAddSection(user.id, sectionData)
        addSection(saved)
      } else {
        addSection({ ...sectionData, id: Date.now().toString() })
      }
      setForm({ name:'', type:'number', unit:'', target:'', max:'5' })
      onClose()
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title="নতুন Column যোগ করো">
      <div className="flex flex-col gap-4">
        <Input label="Column-এর নাম" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="যেমন: পড়াশোনা, নামাজ, ঘুম..." />
        <Select label="ধরন" value={form.type} onChange={e=>setForm({...form,type:e.target.value})} options={DATA_TYPES} />
        {['number','time'].includes(form.type) && (
          <>
            <Input label="একক (unit)" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} placeholder="ঘণ্টা / পৃষ্ঠা / ওয়াক্ত" />
            <Input label="দৈনিক লক্ষ্য (target)" type="number" value={form.target} onChange={e=>setForm({...form,target:e.target.value})} placeholder="যেমন: 6" />
          </>
        )}
        {form.type === 'rating' && (
          <Input label="সর্বোচ্চ মান (যেমন ৫)" type="number" value={form.max} onChange={e=>setForm({...form,max:e.target.value})} />
        )}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">রঙ বেছে নাও</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button key={c} onClick={() => setForm({...form,color:c})}
                className={`w-8 h-8 rounded-full border-2 transition-all ${form.color===c?'border-white scale-110':'border-transparent'}`}
                style={{background:c}} />
            ))}
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? 'সংরক্ষণ হচ্ছে...' : 'Column যোগ করো'}
        </Button>
      </div>
    </Modal>
  )
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 text-xs border border-white/10 shadow-xl">
      <p className="text-gray-300 mb-1.5 font-medium">{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{color:p.color}} className="font-mono">
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Section Graph Card ──────────────────────────────────────────────────────
function SectionGraphCard({ section, entries }) {
  const [chartType, setChartType] = useState('line')
  const last30 = getLast30Days()

  const data = useMemo(() => last30.map(date => {
    const raw = entries[date]?.[section.id]
    if (raw === undefined || raw === '') return { date: formatDate(date), value: null }
    let val = section.type === 'yes_no' ? (raw === 'yes' ? 1 : 0) : (parseFloat(raw) || 0)
    return { date: formatDate(date), value: val }
  }), [last30, entries, section])

  const validVals = data.map(d => d.value).filter(v => v !== null)
  const avg = validVals.length ? (validVals.reduce((a,b)=>a+b,0)/validVals.length) : 0
  const max = validVals.length ? Math.max(...validVals) : 0
  const trend = validVals.length >= 2
    ? validVals[validVals.length-1] > validVals[validVals.length-2] ? 'up'
    : validVals[validVals.length-1] < validVals[validVals.length-2] ? 'down' : 'same'
    : 'same'
  const target = parseFloat(section.target) || null

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-10 rounded-full" style={{background: section.color}} />
          <div>
            <h3 className="font-display font-bold text-white text-sm">{section.name}</h3>
            <p className="text-xs text-gray-500 font-body">{section.unit || section.type}</p>
          </div>
        </div>
        <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg">
          <button onClick={() => setChartType('line')}
            className={`px-2.5 py-1 rounded-md text-xs transition-all ${chartType==='line'?'bg-white/15 text-white':'text-gray-500'}`}>📈</button>
          <button onClick={() => setChartType('bar')}
            className={`px-2.5 py-1 rounded-md text-xs transition-all ${chartType==='bar'?'bg-white/15 text-white':'text-gray-500'}`}>📊</button>
        </div>
      </div>
      <div className="flex gap-3 mb-3">
        <div className="flex-1 bg-white/3 rounded-xl p-2 text-center">
          <p className="font-mono font-bold text-white text-sm">{avg.toFixed(1)}</p>
          <p className="text-[10px] text-gray-500">গড়</p>
        </div>
        <div className="flex-1 bg-white/3 rounded-xl p-2 text-center">
          <p className="font-mono font-bold text-white text-sm">{max}</p>
          <p className="text-[10px] text-gray-500">সর্বোচ্চ</p>
        </div>
        <div className="flex-1 bg-white/3 rounded-xl p-2 text-center">
          <p className="font-mono font-bold text-sm" style={{color: trend==='up'?'#22c55e':trend==='down'?'#ef4444':'#eab308'}}>
            {trend==='up'?'↑ বাড়ছে':trend==='down'?'↓ কমছে':'→ একই'}
          </p>
          <p className="text-[10px] text-gray-500">ট্রেন্ড</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        {chartType === 'bar' ? (
          <BarChart data={data} margin={{top:5,right:5,bottom:0,left:-20}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="date" tick={{fill:'#4b5563',fontSize:9}} axisLine={false} tickLine={false} interval={4}/>
            <YAxis tick={{fill:'#4b5563',fontSize:9}} axisLine={false} tickLine={false}/>
            <Tooltip content={<CustomTooltip/>}/>
            {target && <ReferenceLine y={target} stroke={section.color} strokeDasharray="4 4" strokeOpacity={0.6}/>}
            <Bar dataKey="value" name={section.name} fill={section.color} radius={[3,3,0,0]} maxBarSize={14}/>
          </BarChart>
        ) : (
          <LineChart data={data} margin={{top:5,right:5,bottom:0,left:-20}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="date" tick={{fill:'#4b5563',fontSize:9}} axisLine={false} tickLine={false} interval={4}/>
            <YAxis tick={{fill:'#4b5563',fontSize:9}} axisLine={false} tickLine={false}/>
            <Tooltip content={<CustomTooltip/>}/>
            {target && <ReferenceLine y={target} stroke={section.color} strokeDasharray="4 4" strokeOpacity={0.6}/>}
            <Line type="monotone" dataKey="value" name={section.name} stroke={section.color} strokeWidth={2}
              dot={false} activeDot={{r:4, fill:section.color}} connectNulls={false}/>
          </LineChart>
        )}
      </ResponsiveContainer>
      {target && <p className="text-[10px] text-gray-600 mt-1"><span style={{color:section.color}}>---</span> লক্ষ্য: {target} {section.unit}</p>}
    </div>
  )
}

// ─── Monthly Table ───────────────────────────────────────────────────────────
function MonthlyTable({ sections, entries, setEntry, month }) {
  const [popup, setPopup] = useState(null)

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) })
      .map(d => format(d,'yyyy-MM-dd'))
  }, [month])

  const displayVal = (section, val) => {
    if (val === undefined || val === '') return ''
    if (section.type === 'yes_no') return val === 'yes' ? '✅' : '❌'
    if (section.type === 'rating') return `${val}/${section.max||5}`
    if (section.type === 'percentage') return `${val}%`
    return val + (section.unit ? ` ${section.unit}` : '')
  }

  const cellBg = (section, val) => {
    if (val === undefined || val === '') return ''
    if (section.type === 'yes_no') return val==='yes' ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'
    const num = parseFloat(val)
    const target = parseFloat(section.target)
    if (!target) return 'text-white'
    if (num >= target) return 'bg-green-500/15 text-green-300'
    if (num >= target * 0.7) return 'bg-yellow-500/15 text-yellow-300'
    return 'bg-red-500/15 text-red-300'
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/8">
      <table className="w-full text-xs border-collapse min-w-max">
        <thead>
          <tr className="bg-white/5 border-b border-white/8">
            <th className="px-3 py-3 text-left text-gray-400 font-medium sticky left-0 bg-dark-800 z-10 w-16">তারিখ</th>
            {sections.map(s => (
              <th key={s.id} className="px-3 py-3 text-center font-medium min-w-[90px]" style={{color:s.color}}>
                {s.name}
                {s.unit && <span className="text-gray-600 font-normal ml-1">({s.unit})</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(date => {
            const dayEntries = entries[date] || {}
            const isToday = date === today()
            const dayNum = format(new Date(date+'T00:00:00'), 'dd')
            const dayName = format(new Date(date+'T00:00:00'), 'EEE')
            return (
              <tr key={date} className={`border-b border-white/4 transition-colors hover:bg-white/3 ${isToday?'bg-orange-500/5':''}`}>
                <td className={`px-3 py-2.5 sticky left-0 z-10 ${isToday?'bg-orange-500/10':'bg-dark-900'}`}>
                  <div className="flex flex-col">
                    <span className={`font-mono font-bold ${isToday?'text-orange-400':'text-gray-300'}`}>{dayNum}</span>
                    <span className="text-gray-600 text-[9px]">{dayName}</span>
                  </div>
                </td>
                {sections.map(section => {
                  const val = dayEntries[section.id]
                  return (
                    <td key={section.id} className="px-2 py-2 text-center">
                      <button
                        onClick={() => setPopup({date, section})}
                        className={`w-full min-w-[70px] py-1.5 px-2 rounded-lg text-xs font-mono transition-all hover:ring-1 ring-white/20 ${
                          val !== undefined && val !== '' ? cellBg(section, val) : 'text-gray-700 hover:text-gray-400 hover:bg-white/5'
                        }`}>
                        {val !== undefined && val !== '' ? displayVal(section, val) : '—'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-white/5 border-t border-white/10">
            <td className="px-3 py-2.5 sticky left-0 bg-dark-800 z-10">
              <span className="text-gray-400 font-medium text-[10px]">গড়</span>
            </td>
            {sections.map(section => {
              const vals = days.map(d => entries[d]?.[section.id]).filter(v => v !== undefined && v !== '')
              let avg = '—'
              if (section.type === 'yes_no') {
                avg = `${vals.filter(v=>v==='yes').length}/${vals.length}`
              } else {
                const nums = vals.map(v => parseFloat(v)).filter(n => !isNaN(n))
                if (nums.length) avg = (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1)
              }
              return (
                <td key={section.id} className="px-2 py-2.5 text-center">
                  <span className="font-mono font-bold text-orange-400 text-xs">{avg}</span>
                </td>
              )
            })}
          </tr>
        </tfoot>
      </table>
      {popup && (
        <CellPopup
          section={popup.section}
          value={entries[popup.date]?.[popup.section.id] || ''}
          onSave={val => setEntry(popup.date, popup.section.id, val)}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const { sections, entries, setEntry, removeSection, updateSection, lang, user } = useStore()
  const [tab, setTab] = useState('table')
  const [showAdd, setShowAdd] = useState(false)
  const [month, setMonth] = useState(new Date())
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  const handleSetEntry = async (date, sectionId, value) => {
    setEntry(date, sectionId, value)
    if (user?.id) {
      try { await dbSetEntry(user.id, date, sectionId, value) }
      catch(e) { console.error('Entry save error:', e) }
    }
  }

  const handleRemoveSection = async (id) => {
    removeSection(id)
    if (user?.id) {
      try { await dbDeleteSection(id) }
      catch(e) { console.error('Section delete error:', e) }
    }
    setDeleteTarget(null)
  }

  const handleEditSection = (updatedSection) => {
    if (updateSection) updateSection(updatedSection)
    setEditTarget(null)
  }

  const monthLabel = format(month, 'MMMM yyyy')
  const prevMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))
  const nextMonth = () => setMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))

  const monthDays = eachDayOfInterval({start: startOfMonth(month), end: endOfMonth(month)})
    .map(d => format(d,'yyyy-MM-dd'))
  const filledDays = monthDays.filter(d =>
    sections.some(s => entries[d]?.[s.id] !== undefined && entries[d]?.[s.id] !== '')
  ).length

  return (
    <div className="pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-bold text-white">ট্র্যাকার</h1>
        <Button onClick={() => setShowAdd(true)} size="sm"><Plus size={14}/> Column</Button>
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-between mb-4 glass rounded-2xl px-4 py-3">
        <button onClick={prevMonth} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">◀</button>
        <div className="text-center">
          <p className="font-display font-bold text-white">{monthLabel}</p>
          <p className="text-xs text-gray-500">{filledDays}/{monthDays.length} দিন entry দিয়েছো</p>
        </div>
        <button onClick={nextMonth} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">▶</button>
      </div>

      {/* Summary cards — উপরে */}
      {sections.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {sections.map(section => {
            const vals = monthDays.map(d => entries[d]?.[section.id]).filter(v => v !== undefined && v !== '')
            let summary = '—', sub = ''
            if (section.type === 'yes_no') {
              summary = `${vals.filter(v=>v==='yes').length} দিন`
              sub = `মোট ${vals.length} দিনের মধ্যে`
            } else {
              const nums = vals.map(v=>parseFloat(v)).filter(n=>!isNaN(n))
              if (nums.length) {
                const total = nums.reduce((a,b)=>a+b,0)
                summary = total.toFixed(1)
                sub = `গড়: ${(total/nums.length).toFixed(1)} ${section.unit||''}`
              }
            }
            return (
              <div key={section.id} className="glass rounded-2xl p-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{background:section.color}}/>
                    <span className="text-xs text-gray-400 font-body truncate max-w-[80px]">{section.name}</span>
                  </div>
                  <SectionMenu
                    section={section}
                    onEdit={() => setEditTarget(section)}
                    onDelete={() => setDeleteTarget(section)}
                  />
                </div>
                <p className="font-display font-black text-xl text-white">{summary}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{sub || 'মাসের মোট'}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5 p-1 glass rounded-xl w-fit">
        <button onClick={() => setTab('table')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all font-body ${tab==='table'?'gradient-brand text-white':'text-gray-500 hover:text-white'}`}>
          <Table size={15}/> মাসিক রিপোর্ট
        </button>
        <button onClick={() => setTab('graphs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all font-body ${tab==='graphs'?'gradient-brand text-white':'text-gray-500 hover:text-white'}`}>
          <Activity size={15}/> গ্রাফ বিশ্লেষণ
        </button>
      </div>

      {sections.length === 0 && (
        <div className="text-center py-16">
          <BarChart2 size={44} className="mx-auto text-gray-700 mb-3"/>
          <p className="text-gray-500 font-body mb-2 text-sm">এখনো কোনো column নেই</p>
          <p className="text-gray-600 font-body mb-5 text-xs">পড়াশোনা, নামাজ, মেডিটেশন — যা track করতে চাও যোগ করো</p>
          <Button onClick={() => setShowAdd(true)}><Plus size={14}/> প্রথম Column যোগ করো</Button>
        </div>
      )}

      {/* TABLE TAB */}
      {tab === 'table' && sections.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 font-body mb-3">Cell-এ tap করে data দাও</p>
          <MonthlyTable sections={sections} entries={entries} setEntry={handleSetEntry} month={month}/>
        </div>
      )}

      {/* GRAPHS TAB */}
      {tab === 'graphs' && sections.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-gray-500 font-body -mt-1">গত ৩০ দিনের তথ্য · টার্গেট দেওয়া থাকলে --- দিয়ে দেখাবে</p>
          {sections.filter(s => s.type !== 'text').map(section => (
            <SectionGraphCard key={section.id} section={section} entries={entries}/>
          ))}
        </div>
      )}

      <AddSectionModal open={showAdd} onClose={() => setShowAdd(false)} lang={lang}/>

      {deleteTarget && (
        <DeleteConfirm
          section={deleteTarget}
          onConfirm={() => handleRemoveSection(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {editTarget && (
        <EditSectionModal
          section={editTarget}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEditSection}
        />
      )}
    </div>
  )
}