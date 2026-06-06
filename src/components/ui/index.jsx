import { clsx } from 'clsx'

export function Button({ children, variant = 'primary', size = 'md', className = '', onClick, disabled, type = 'button' }) {
  const base = 'inline-flex items-center justify-center gap-2 font-body font-medium rounded-xl transition-all duration-200 cursor-pointer select-none'
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }
  const variants = {
    primary: 'gradient-brand text-white shadow-lg hover:opacity-90 active:scale-95 glow-orange',
    secondary: 'glass text-white hover:bg-white/10 border border-white/10',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(base, sizes[size], variants[variant], disabled && 'opacity-50 cursor-not-allowed', className)}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '', glow = false }) {
  return (
    <div className={clsx('glass rounded-2xl p-5', glow && 'glow-orange', className)}>
      {children}
    </div>
  )
}

export function Badge({ children, color = 'orange' }) {
  const colors = {
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border', colors[color])}>
      {children}
    </span>
  )
}

export function Input({ label, value, onChange, placeholder, type = 'text', className = '' }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-gray-400 font-body">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={clsx(
          'glass rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none',
          'focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all',
          className
        )}
      />
    </div>
  )
}

export function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-gray-400 font-body">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        className={clsx(
          'glass rounded-xl px-4 py-2.5 text-sm text-white outline-none',
          'focus:border-orange-500/50 transition-all bg-dark-700',
          className
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-dark-800">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl p-6 w-full max-w-md z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-xl">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ScoreRing({ score, size = 80 }) {
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const fill = circ - (circ * score) / 100
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f97316' : score >= 40 ? '#eab308' : '#ef4444'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x={size/2} y={size/2 + 5} textAnchor="middle" fill="white" fontSize={size * 0.2} fontFamily="Syne" fontWeight="700">
        {score}
      </text>
    </svg>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )
}
