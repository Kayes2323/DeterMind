import { NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Home, BarChart2, Calendar, User, LogOut, Sun, Moon, ChevronRight, Zap } from 'lucide-react'
import { clsx } from 'clsx'

// Sigma icon — Σ symbol
function SigmaIcon({ size = 17, className = '' }) {
  return (
    <span className={`font-display font-bold ${className}`} style={{ fontSize: size, lineHeight: 1 }}>Σ</span>
  )
}

const navItems = [
  { to: '/', icon: Home, label: 'হোম', labelEn: 'Home' },
  { to: '/dashboard', icon: BarChart2, label: 'ট্র্যাকার', labelEn: 'Tracker' },
  { to: '/routine', icon: Calendar, label: 'রুটিন', labelEn: 'Routine' },
  { to: '/sigma', icon: SigmaIcon, label: 'Sigma', labelEn: 'Sigma' },
  { to: '/profile', icon: User, label: 'প্রোফাইল', labelEn: 'Profile' },
]

export default function Layout({ children }) {
  const { lang, setLang, user, logout } = useStore()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-white/5 p-5 gap-2 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6 px-2">
          <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center glow-orange">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold gradient-text">DeterMind</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, icon: Icon, label, labelEn }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
              )}>
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-orange-400' : ''} />
                  <span className="font-body">{lang === 'bn' ? label : labelEn}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto text-orange-400/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="flex-1 glass rounded-xl py-2 text-xs text-gray-400 hover:text-white transition-all text-center font-mono">
              {lang === 'bn' ? 'EN' : 'বাং'}
            </button>
          </div>
          <button onClick={() => { logout(); navigate('/auth') }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={14} />
            <span className="font-body">{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar mobile */}
        <div className="md:hidden sticky top-0 z-30 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 gradient-brand rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-display text-lg font-bold gradient-text">DeterMind</span>
          </div>
        </div>

        {/* Page content */}
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 glass border-t border-white/5 flex justify-around px-2 py-2">
        {navItems.map(({ to, icon: Icon, label, labelEn }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => clsx(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] transition-all',
              isActive ? 'text-orange-400' : 'text-gray-600'
            )}>
            {({ isActive }) => (
              <>
                <Icon size={19} className={isActive ? 'text-orange-400' : ''} />
                <span>{lang === 'bn' ? label : labelEn}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}