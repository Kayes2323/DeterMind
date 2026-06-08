import { useState, useMemo } from 'react'
import { useStore } from '../store'
import { Modal, Input, Select, Button } from '../components/ui'
import { today, getLast7Days, getLast30Days, formatDate, calcDailyScore, t } from '../utils/helpers'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts'
import { Plus, MoreVertical, BarChart2, Table, Activity, TrendingUp, TrendingDown, Minus, Edit3, Trash2 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { dbAddSection, dbDeleteSection, dbSetEntry } from '../hooks/useSupabase'

const DATA_TYPES = [
  { value: 'number', label: 'সংখ্যা — যেমন: ৬ ঘণ্টা' },
  { value: 'rating', label: 'রেটিং — যেমন: ৫/৫' },
  { value: 'yes_no', label: 'হ্যাঁ/না — যেমন: ✅ ❌' },
  { value: 'percentage', label: 'শতাংশ — যেমন: ৭৫%' },
  { value: 'time', label: 'সময় — ঘণ্টা দশমিকে' },
]
const COLORS = ['#f97316','#22c55e','#3b82f6','#a855f7','#ec4899','#eab308','#06b6d4','#f43f5e']

// ─── Cell Popup ───────────────────────────────────────────────────────────────
function CellPopup({ section, value, onSave, onClose }) {
  const [val, setVal] = useState(value || '')
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
                  val===v ? v==='yes' ? 'bg-green-500/30 text-green-300 border-green-500/50' : 'bg-red-500/30 text-red-300 border-red-500/50'
                  : 'glass text-gray-400 border-white/10'}`}>
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
                  parseInt(val)>=i ? 'bg-orange-500/30 text-orange-300 border-orange-500/50' : 'glass text-gray-500 border-white/10'}`}>{i}</button>
            ))}
          </div>
        )}
        {['number','time','percentage'].includes(section.type) && (
          <input type="number" value={val} onChange={e => setVal(e.target.value)}
            placeholder={section.type==='percentage' ? '0–100' : '0'}
            step={section.type==='time' ? '0.5' : '1'} autoFocus
            className="w-full glass rounded-xl px-4 py-3 text-2xl text-white text-center font-mono outline-none focus:border-orange-500/50 mb-4" />
        )}
        {section.type !== 'yes_no' && (
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 glass rounded-xl py-2.5 text-sm text-gray-400 hover:text-white transition-all">বাতিল</button>
            <button onClick={() => { onSave(val); onClose() }} className="flex-1 gradient-brand rounded-xl py-2.5 text-sm text-white font-medium">সংরক্ষণ ✓</button>
          </div>
        )}
        {val && section.type !== 'yes_no' && (
          <button onClick={() => { onSave(''); onClose() }} className="w-full mt-2 text-xs text-gray-600 hover:text-red-400 transition-colors">মুছে ফেলো</button>
        )}
      </div>
    </div>
  )
}

// ─── Three Dot Menu ───────────────────────────────────────────────────────────
function SectionMenu({ section, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1 text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/10">
        <MoreVertical size={13} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-50 glass rounded-xl border border-white/10 overflow-hidden w-36 shadow-xl" style={{position:"absolute"}}>
            <button onClick={() => { onEdit(); setOpen(false) }}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 w-full transition-all">
              <Edit3 size={13} /> Edit
            </button>
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full transition-all">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(false)} />
          <div className="relative glass rounded-2xl p-5 w-72 z-10 border border-red-500/30">
            <p className="font-display font-bold text-white mb-2">Delete করবে?</p>
            <p className="text-sm text-gray-400 mb-4 font-body">"{section.name}" এর সব data মুছে যাবে।</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 glass rounded-xl py-2.5 text-sm text-gray-400">বাতিল</button>
              <button onClick={() => { onDelete(); setConfirmDelete(false) }} className="flex-1 bg-red-500/20 border border-red-500/40 rounded-xl py-2.5 text-sm text-red-400">Delete করো</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add/Edit Section Modal ───────────────────────────────────────────────────
function SectionModal({ open, onClose, lang, editSection = null }) {
  const { addSection, updateSection, sections, user } = useStore()
  const [form, setForm] = useState(editSection || { name:'', type:'number', unit:'', target:'', max:'5' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editSection) {
        updateSection(editSection.id, form)
      } else {
        const sectionData = { ...form, color: COLORS[sections.length % COLORS.length], order_index: sections.length }
        if (user?.id) {
          const saved = await dbAddSection(user.id, sectionData)
          addSection(saved)
        } else {
          addSection({ ...sectionData, id: Date.now().toString() })
        }
      }
      onClose()
    } catch(e) { console.error(e) }
    finally { setSaving(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={editSection ? 'Column Edit করো' : 'নতুন Column যোগ করো'}>
      <div className="flex flex-col gap-4">
        <Input label="Column-এর নাম" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="যেমন: পড়াশোনা, নামাজ..." />
        <Select label="ধরন" value={form.type} onChange={e=>setForm({...form,type:e.target.value})} options={DATA_TYPES} />
        {['number','time'].includes(form.type) && (
          <>
            <Input label="একক (unit)" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} placeholder="ঘণ্টা / পৃষ্ঠা / ওয়াক্ত" />
            <Input label="দৈনিক লক্ষ্য" type="number" value={form.target} onChange={e=>setForm({...form,target:e.target.value})} placeholder="যেমন: 6" />
          </>
        )}
        {form.type === 'rating' && (
          <Input label="সর্বোচ্চ মান" type="number" value={form.max} onChange={e=>setForm({...form,max:e.target.value})} />
        )}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">রঙ</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button key={c} onClick={() => setForm({...form,color:c})}
                className={`w-7 h-7 rounded-full border-2 transition-all ${form.color===c?'border-white scale-110':'border-transparent'}`}
                style={{background:c}} />
            ))}
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="w-full">
          {saving ? 'সংরক্ষণ হচ্ছে...' : editSection ? 'Update করো' : 'Column যোগ করো'}
        </Button>
      </div>
    </Modal>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 text-xs border border-white/10 shadow-xl">
      <p className="text-gray-300 mb-1.5 font-medium">{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{color:p.color}} className="font-mono">{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  )
}

// ─── Graph Card ───────────────────────────────────────────────────────────────
function SectionGraphCard({ section, entries }) {
  const [chartType, setChartType] = useState('line')
  const last30 = getLast30Days()
  const data = useMemo(() => last30.map(date => {
    const raw = entries[date]?.[section.id]
    if (raw === undefined || raw === '') return { date: formatDate(date), value: null }
    return { date: formatDate(date), value: section.type==='yes_no' ? (raw==='yes'?1:0) : (parseFloat(raw)||0) }
  }), [last30, entries, section])

  const validVals = data.map(d=>d.value).filter(v=>v!==null)
  const avg = validVals.length ? (validVals.reduce((a,b)=>a+b,0)/validVals.length) : 0
  const maxVal = validVals.length ? Math.max(...validVals) : 0
  const trend = validVals.length>=2 ? validVals[validVals.length-1]>validVals[validVals.length-2]?'up':validVals[validVals.length-1]<validVals[validVals.length-2]?'down':'same' : 'same'
  const target = parseFloat(section.target)||null

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-10 rounded-full" style={{background:section.color}} />
          <div>
            <h3 className="font-display font-bold text-white text-sm">{section.name}</h3>
            <p className="text-xs text-gray-500">{section.unit||section.type}</p>
          </div>
        </div>
        <div className="flex gap-1 p-0.5 bg-white/5 rounded-lg">
          <button onClick={()=>setChartType('line')} className={`px-2.5 py-1 rounded-md text-xs transition-all ${chartType==='line'?'bg-white/15 text-white':'text-gray-500'}`}>📈</button>
          <button onClick={()=>setChartType('bar')} className={`px-2.5 py-1 rounded-md text-xs transition-all ${chartType==='bar'?'bg-white/15 text-white':'text-gray-500'}`}>📊</button>
        </div>
      </div>
      <div className="flex gap-3 mb-3">
        <div className="flex-1 bg-white/3 rounded-xl p-2 text-center">
          <p className="font-mono font-bold text-white text-sm">{avg.toFixed(1)}</p>
          <p className="text-[10px] text-gray-500">গড়</p>
        </div>
        <div className="flex-1 bg-white/3 rounded-xl p-2 text-center">
          <p className="font-mono font-bold text-white text-sm">{maxVal}</p>
          <p className="text-[10px] text-gray-500">সর্বোচ্চ</p>
        </div>
        <div className="flex-1 bg-white/3 rounded-xl p-2 text-center">
          <p className="font-mono font-bold text-sm" style={{color:trend==='up'?'#22c55e':trend==='down'?'#ef4444':'#eab308'}}>
            {trend==='up'?'↑':trend==='down'?'↓':'→'}
          </p>
          <p className="text-[10px] text-gray-500">ট্রেন্ড</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        {chartType==='bar' ? (
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
            <Line type="monotone" dataKey="value" name={section.name} stroke={section.color} strokeWidth={2} dot={false} activeDot={{r:4,fill:section.color}} connectNulls={false}/>
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

// ─── Monthly Table ────────────────────────────────────────────────────────────
function MonthlyTable({ sections, entries, onCellClick, month }) {
  const days = useMemo(() =>
    eachDayOfInterval({start:startOfMonth(month),end:endOfMonth(month)}).map(d=>format(d,'yyyy-MM-dd'))
  , [month])

  const displayVal = (section, val) => {
    if (val===undefined||val==='') return ''
    if (section.type==='yes_no') return val==='yes'?'✅':'❌'
    if (section.type==='rating') return `${val}/${section.max||5}`
    if (section.type==='percentage') return `${val}%`
    return `${val}${section.unit?` ${section.unit}`:''}`
  }

  const cellColor = (section, val) => {
    if (!val||val==='') return ''
    if (section.type==='yes_no') return val==='yes'?'text-green-300':'text-red-300'
    const num=parseFloat(val), target=parseFloat(section.target)
    if (!target) return 'text-white'
    if (num>=target) return 'text-green-300'
    if (num>=target*0.7) return 'text-yellow-300'
    return 'text-red-300'
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/8">
      <table className="w-full text-xs border-collapse" style={{minWidth: sections.length>3?`${sections.length*110+80}px`:'100%'}}>
        <thead>
          <tr className="bg-white/5 border-b border-white/8">
            <th className="px-3 py-3 text-left text-gray-400 font-medium sticky left-0 bg-dark-800 z-10 w-16">তারিখ</th>
            {sections.map(s => (
              <th key={s.id} className="px-3 py-3 text-center font-medium" style={{color:s.color, minWidth:100}}>
                {s.name}
                {s.unit&&<span className="text-gray-600 font-normal ml-1 text-[10px]">({s.unit})</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(date => {
            const dayEntries = entries[date]||{}
            const isToday = date===today()
            return (
              <tr key={date} className={`border-b border-white/4 hover:bg-white/3 transition-colors ${isToday?'bg-orange-500/5':''}`}>
                <td className={`px-3 py-2.5 sticky left-0 z-10 ${isToday?'bg-orange-500/10':'bg-dark-900'}`}>
                  <div className="flex flex-col">
                    <span className={`font-mono font-bold text-sm ${isToday?'text-orange-400':'text-gray-300'}`}>
                      {format(new Date(date+'T00:00:00'),'dd')}
                    </span>
                    <span className="text-gray-600 text-[9px]">{format(new Date(date+'T00:00:00'),'EEE')}</span>
                  </div>
                </td>
                {sections.map(section => {
                  const val = dayEntries[section.id]
                  const hasData = val!==undefined&&val!==''
                  return (
                    <td key={section.id} className="px-2 py-2 text-center">
                      <button onClick={() => onCellClick(date, section, val)}
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-mono transition-all hover:ring-1 ring-white/20 ${hasData?cellColor(section,val):'text-gray-700 hover:text-gray-400 hover:bg-white/5'}`}>
                        {hasData ? displayVal(section, val) : '—'}
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
            <td className="px-3 py-2.5 sticky left-0 bg-dark-800 z-10 text-[10px] text-gray-400 font-medium">গড়</td>
            {sections.map(section => {
              const vals = days.map(d=>entries[d]?.[section.id]).filter(v=>v!==undefined&&v!=='')
              let avg='—'
              if (section.type==='yes_no') avg=`${vals.filter(v=>v==='yes').length}/${vals.length}`
              else { const nums=vals.map(v=>parseFloat(v)).filter(n=>!isNaN(n)); if(nums.length) avg=(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1) }
              return <td key={section.id} className="px-2 py-2.5 text-center"><span className="font-mono font-bold text-orange-400 text-xs">{avg}</span></td>
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ sections, entries, month }) {
  const monthDays = eachDayOfInterval({start:startOfMonth(month),end:endOfMonth(month)}).map(d=>format(d,'yyyy-MM-dd'))
  const scores = monthDays.map(d=>({ date:format(new Date(d+'T00:00:00'),'dd MMM'), score:calcDailyScore(entries[d]||{},sections) }))
  const validScores = scores.filter(s=>s.score>0)
  const avgScore = validScores.length ? Math.round(validScores.reduce((a,b)=>a+b.score,0)/validScores.length) : 0
  const bestDay = validScores.length ? validScores.reduce((a,b)=>a.score>b.score?a:b) : null
  const worstDay = validScores.length ? validScores.reduce((a,b)=>a.score<b.score?a:b) : null
  const activeDays = validScores.length

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="glass rounded-2xl p-4 text-center">
          <p className="font-display font-black text-3xl text-white">{avgScore}</p>
          <p className="text-xs text-gray-500 mt-1">মাসিক গড় স্কোর</p>
        </div>
        <div className="glass rounded-2xl p-4 text-center">
          <p className="font-display font-black text-3xl text-white">{activeDays}</p>
          <p className="text-xs text-gray-500 mt-1">সক্রিয় দিন</p>
        </div>
        {bestDay && (
          <div className="glass rounded-2xl p-4 border border-green-500/20">
            <p className="text-xs text-green-400 mb-1">🏆 সেরা দিন</p>
            <p className="font-display font-bold text-white">{bestDay.date}</p>
            <p className="text-xs text-gray-500">Score: {bestDay.score}</p>
          </div>
        )}
        {worstDay && (
          <div className="glass rounded-2xl p-4 border border-red-500/20">
            <p className="text-xs text-red-400 mb-1">📉 দুর্বল দিন</p>
            <p className="font-display font-bold text-white">{worstDay.date}</p>
            <p className="text-xs text-gray-500">Score: {worstDay.score}</p>
          </div>
        )}
      </div>

      {/* Score trend chart */}
      <div className="glass rounded-2xl p-4 mb-4">
        <p className="text-xs text-gray-400 mb-3">মাসিক স্কোর ট্রেন্ড</p>
        <ResponsiveContainer width="100%" height={150}>
          <AreaChart data={scores.filter((_,i)=>i%2===0)}>
            <defs>
              <linearGradient id="scoreG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="date" tick={{fill:'#4b5563',fontSize:9}} axisLine={false} tickLine={false} interval={3}/>
            <YAxis domain={[0,100]} tick={{fill:'#4b5563',fontSize:9}} axisLine={false} tickLine={false}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Area type="monotone" dataKey="score" stroke="#f97316" fill="url(#scoreG)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Per section summary */}
      <div className="grid grid-cols-2 gap-3">
        {sections.map(section => {
          const vals = monthDays.map(d=>entries[d]?.[section.id]).filter(v=>v!==undefined&&v!=='')
          let summary='—', sub=''
          if (section.type==='yes_no') { summary=`${vals.filter(v=>v==='yes').length}d`; sub=`/ ${vals.length} দিন` }
          else { const nums=vals.map(v=>parseFloat(v)).filter(n=>!isNaN(n)); if(nums.length){const total=nums.reduce((a,b)=>a+b,0);summary=total.toFixed(1);sub=`গড়: ${(total/nums.length).toFixed(1)} ${section.unit||''}` } }
          const consistency = vals.length ? Math.round((vals.length/monthDays.length)*100) : 0
          return (
            <div key={section.id} className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{background:section.color}}/>
                <span className="text-xs text-gray-400 truncate font-body">{section.name}</span>
              </div>
              <p className="font-display font-black text-xl text-white">{summary}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
              <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{width:`${consistency}%`,background:section.color}}/>
              </div>
              <p className="text-[10px] text-gray-600 mt-1">{consistency}% consistent</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { sections, entries, setEntry, removeSection, updateSection, lang, user } = useStore()
  const [tab, setTab] = useState('table')
  const [showAdd, setShowAdd] = useState(false)
  const [editSection, setEditSection] = useState(null)
  const [month, setMonth] = useState(new Date())
  const [popup, setPopup] = useState(null)

  const handleCellClick = (date, section, currentVal) => {
    setPopup({ date, section, value: currentVal })
  }

  const handleSaveEntry = async (date, sectionId, value) => {
    setEntry(date, sectionId, value)
    if (user?.id) {
      try { await dbSetEntry(user.id, date, sectionId, value) }
      catch(e) { console.error(e) }
    }
  }

  const handleRemoveSection = async (id) => {
    removeSection(id)
    if (user?.id) {
      try { await dbDeleteSection(id) }
      catch(e) { console.error(e) }
    }
  }

  const monthLabel = format(month, 'MMMM yyyy')
  const monthDays = eachDayOfInterval({start:startOfMonth(month),end:endOfMonth(month)}).map(d=>format(d,'yyyy-MM-dd'))
  const filledDays = monthDays.filter(d=>sections.some(s=>entries[d]?.[s.id]!==undefined&&entries[d]?.[s.id]!=='')).length

  return (
    <div className="pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-bold text-white">ট্র্যাকার</h1>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 gradient-brand px-4 py-2 rounded-xl text-sm text-white font-medium glow-orange">
          <Plus size={14}/> Column
        </button>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4 glass rounded-2xl px-4 py-3">
        <button onClick={() => setMonth(m=>new Date(m.getFullYear(),m.getMonth()-1,1))} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all">◀</button>
        <div className="text-center">
          <p className="font-display font-bold text-white">{monthLabel}</p>
          <p className="text-xs text-gray-500">{filledDays}/{monthDays.length} দিন entry</p>
        </div>
        <button onClick={() => setMonth(m=>new Date(m.getFullYear(),m.getMonth()+1,1))} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all">▶</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 p-1 glass rounded-xl w-fit">
        {[
          {k:'table', icon:<Table size={14}/>, label:'মাসিক রিপোর্ট'},
          {k:'graphs', icon:<Activity size={14}/>, label:'গ্রাফ'},
          {k:'overview', icon:<TrendingUp size={14}/>, label:'Overview'},
        ].map(({k,icon,label}) => (
          <button key={k} onClick={()=>setTab(k)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all font-body ${tab===k?'gradient-brand text-white':'text-gray-500 hover:text-white'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Columns management */}
      {sections.length > 0 && tab === 'table' && (
        <div className="flex gap-2 flex-wrap mb-3">
          {sections.map(s => (
            <div key={s.id} className="flex items-center gap-1 glass px-2.5 py-1 rounded-lg text-xs" style={{color:s.color}}>
              <span>{s.name}</span>
              <SectionMenu
                section={s}
                onEdit={() => setEditSection(s)}
                onDelete={() => handleRemoveSection(s.id)}
              />
            </div>
          ))}
        </div>
      )}

      {sections.length === 0 && (
        <div className="text-center py-16">
          <BarChart2 size={44} className="mx-auto text-gray-700 mb-3"/>
          <p className="text-gray-500 font-body mb-2 text-sm">এখনো কোনো column নেই</p>
          <button onClick={() => setShowAdd(true)} className="gradient-brand px-5 py-2.5 rounded-xl text-sm text-white font-medium mt-2 flex items-center gap-2 mx-auto">
            <Plus size={14}/> প্রথম Column যোগ করো
          </button>
        </div>
      )}

      {tab === 'table' && sections.length > 0 && (
        <>
          <MonthlyTable sections={sections} entries={entries} onCellClick={handleCellClick} month={month}/>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {sections.map(section => {
              const vals = monthDays.map(d=>entries[d]?.[section.id]).filter(v=>v!==undefined&&v!=='')
              let summary='—', sub=''
              if (section.type==='yes_no'){summary=`${vals.filter(v=>v==='yes').length} দিন`;sub=`মোট ${vals.length} দিনের মধ্যে`}
              else{const nums=vals.map(v=>parseFloat(v)).filter(n=>!isNaN(n));if(nums.length){const total=nums.reduce((a,b)=>a+b,0);summary=total.toFixed(1);sub=`গড়: ${(total/nums.length).toFixed(1)} ${section.unit||''}`}}
              return (
                <div key={section.id} className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{background:section.color}}/>
                    <span className="text-xs text-gray-400 truncate font-body">{section.name}</span>
                  </div>
                  <p className="font-display font-black text-xl text-white">{summary}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{sub||'মাসের মোট'}</p>
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'graphs' && sections.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-gray-500 font-body -mt-1">গত ৩০ দিনের তথ্য</p>
          {sections.filter(s=>s.type!=='text').map(section => (
            <SectionGraphCard key={section.id} section={section} entries={entries}/>
          ))}
        </div>
      )}

      {tab === 'overview' && <OverviewTab sections={sections} entries={entries} month={month}/>}

      {popup && (
        <CellPopup
          section={popup.section}
          value={popup.value||''}
          onSave={val => handleSaveEntry(popup.date, popup.section.id, val)}
          onClose={() => setPopup(null)}
        />
      )}

      <SectionModal open={showAdd} onClose={() => setShowAdd(false)} lang={lang}/>
      {editSection && <SectionModal open={true} onClose={() => setEditSection(null)} lang={lang} editSection={editSection}/>}
    </div>
  )
}