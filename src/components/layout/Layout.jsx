import { NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Home, BarChart2, Calendar, Timer, LogOut, ChevronRight, Zap } from 'lucide-react'
import { clsx } from 'clsx'

function SigmaIcon({ size = 20, className = '', isActive = false }) {
  return (
    <div style={{position:'relative', width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center'}}>
      {isActive && (
        <div style={{
          position:'absolute', inset:0,
          borderRadius:'50%',
          background:'radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)',
          animation:'sigmaPulse 2s ease-in-out infinite',
        }}/>
      )}
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <defs>
          <linearGradient id="sigNav" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97316"/>
            <stop offset="100%" stopColor="#7c3aed"/>
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" stroke="url(#sigNav)" strokeWidth="1.5" fill="none"/>
        <circle cx="12" cy="12" r="10" stroke="url(#sigNav)" strokeWidth="0.5" fill="none" opacity="0.3"/>
        <text x="12" y="17" textAnchor="middle" fontSize="12" fontWeight="700" fill="white" fontFamily="serif">Σ</text>
      </svg>
      <style>{`
        @keyframes sigmaPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

const navItems = [
  { to: '/', icon: Home, label: 'হোম', labelEn: 'Home' },
  { to: '/dashboard', icon: BarChart2, label: 'ট্র্যাকার', labelEn: 'Tracker' },
  { to: '/routine', icon: Calendar, label: 'রুটিন', labelEn: 'Routine' },
  { to: '/focus', icon: Timer, label: 'ফোকাস', labelEn: 'Focus' },
  { to: '/sigma', icon: SigmaIcon, label: 'Sigma', labelEn: 'Sigma' },
]

export default function Layout({ children }) {
  const { lang, setLang, user, logout } = useStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-white/5 p-5 gap-2 shrink-0">
        <div className="flex items-center gap-2.5 mb-6 px-2">
          <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center glow-orange">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold gradient-text">DeterMind</span>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, icon: Icon, label, labelEn }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
              )}>
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-orange-400' : ''} />
                  <span className="font-body">{lang === 'bn' ? label : labelEn}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto text-orange-400/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Profile + settings */}
        <div className="pt-4 border-t border-white/5">
          <button onClick={() => navigate('/profile')}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-orange-500/30 shrink-0">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover"/>
                : <div className="w-full h-full gradient-brand flex items-center justify-center text-white text-xs font-bold font-display">
                    {user?.name?.[0]?.toUpperCase()||'D'}
                  </div>
              }
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
            </div>
          </button>
          <div className="flex gap-2">
            <button onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="flex-1 glass rounded-xl py-1.5 text-xs text-gray-400 hover:text-white transition-all text-center font-mono">
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
            <button onClick={() => { logout(); navigate('/auth') }}
              className="flex-1 glass rounded-xl py-1.5 text-xs text-gray-500 hover:text-red-400 transition-all text-center">
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden shrink-0 px-4 py-3 flex items-center justify-between"
          style={{background:'rgba(10,10,15,0.95)', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-brand rounded-xl flex items-center justify-center glow-orange">
              <Zap size={15} className="text-white" />
            </div>
            <span className="font-display text-lg font-bold gradient-text">DeterMind</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Sigma quick access */}
            <button onClick={() => navigate('/sigma')}
              className="relative active:scale-95 transition-all">
              <SigmaIcon size={34} />
              <div style={{
                position:'absolute', bottom:1, right:1,
                width:8, height:8, borderRadius:'50%',
                background:'#22c55e',
                border:'1.5px solid #0a0a0f'
              }}/>
            </button>
            {/* Profile avatar top right */}
            <button onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-orange-500/40 active:scale-95 transition-all">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover"/>
                : <div className="w-full h-full gradient-brand flex items-center justify-center text-white text-sm font-bold font-display">
                    {user?.name?.[0]?.toUpperCase()||'D'}
                  </div>
              }
            </button>
          </div>
        </div>

        {/* Page content — scrollable */}
        <div className="flex-1 overflow-y-auto" style={{paddingBottom: '80px'}}>
          <div className="p-4 md:p-6 max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(8,8,12,0.98)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}>
        <div className="flex justify-around items-center px-2 pt-2 pb-1">
          {navItems.map(({ to, icon: Icon, label, labelEn }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className="flex-1">
              {({ isActive }) => (
                <div className={clsx(
                  'flex flex-col items-center gap-1 py-1.5 px-1 rounded-2xl mx-0.5 transition-all duration-200',
                  isActive ? 'bg-orange-500/12' : ''
                )}>
                  <div className={clsx(
                    'w-7 h-7 rounded-xl flex items-center justify-center transition-all duration-200',
                    isActive ? 'bg-orange-500/20' : ''
                  )}>
                    {to === '/sigma'
                      ? <SigmaIcon size={21} isActive={isActive} />
                      : <Icon size={21} className={clsx('transition-all duration-200', isActive ? 'text-orange-400' : 'text-gray-500')} />
                    }
                  </div>
                  <span className={clsx(
                    'text-[10px] font-medium transition-all duration-200 font-body',
                    isActive ? 'text-orange-400' : 'text-gray-600'
                  )}>
                    {lang === 'bn' ? label : labelEn}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}