import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Users,
  Building2,
  Sparkles,
  Layers,
  CalendarClock,
  ClipboardList,
  LogOut,
} from 'lucide-react'
import Modal from './Modal'
import { useAuth } from '../contexts/authContext.js'
import {
  ACCENT,
  ACCENT_HOVER,
  FOREGROUND,
  LINE_STRONG,
  MUTED,
  PANEL,
} from '../config/theme'

const ADMIN_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/workshops', label: 'Workshops', icon: Building2 },
  { to: '/services', label: 'Services', icon: Sparkles },
  { to: '/service-categories', label: 'Categories', icon: Layers },
  { to: '/bookings', label: 'Bookings', icon: CalendarClock },
  { to: '/jobs', label: 'Jobs', icon: ClipboardList },
]

export default function AdminNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header
      className="sticky top-0 z-50 px-4 sm:px-8"
      style={{ background: PANEL, borderBottom: `1px solid ${LINE_STRONG}` }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 py-4">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2.5"
          style={{ color: FOREGROUND, textDecoration: 'none' }}
        >
          <div
            className="flex items-center justify-center w-9 h-9"
            style={{ background: ACCENT }}
          >
            <span
              className="text-sm font-black"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#fff' }}
            >
              KD
            </span>
          </div>
          <div className="leading-none">
            <span
              className="text-xl font-black uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.14em' }}
            >
              KROM<span style={{ color: ACCENT }}>ADMIN</span>
            </span>
          </div>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          {ADMIN_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className="px-3.5 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200"
              style={({ isActive }) => ({
                color: isActive ? ACCENT : MUTED,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.12em',
                textDecoration: 'none',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span
            className="hidden sm:inline text-[11px] uppercase tracking-widest"
            style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {user?.name} · <span style={{ color: ACCENT }}>Admin</span>
          </span>
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
            style={{
              color: MUTED,
              border: `1px solid ${LINE_STRONG}`,
              background: 'transparent',
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.12em',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = ACCENT
              e.currentTarget.style.color = ACCENT
              e.currentTarget.style.background = ACCENT_HOVER
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = LINE_STRONG
              e.currentTarget.style.color = MUTED
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      <nav className="md:hidden flex items-center overflow-x-auto gap-1 pb-3">
        {ADMIN_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap"
            style={({ isActive }) => ({
              color: isActive ? ACCENT : MUTED,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.1em',
              textDecoration: 'none',
              border: `1px solid ${isActive ? ACCENT : LINE_STRONG}`,
            })}
          >
            <Icon size={13} />
            {label}
          </NavLink>
        ))}
      </nav>

      <Modal open={logoutOpen} onClose={() => setLogoutOpen(false)} title="Logout">
        <p className="text-sm" style={{ color: MUTED }}>
          Are you sure you want to logout of your KROM ADMIN account?
        </p>
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => setLogoutOpen(false)}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
            style={{
              color: MUTED,
              border: `1px solid ${LINE_STRONG}`,
              background: 'transparent',
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = MUTED }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
            style={{
              background: ACCENT,
              color: '#fff',
              border: 'none',
              fontFamily: "'Barlow Condensed', sans-serif",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            Yes, Logout
          </button>
        </div>
      </Modal>
    </header>
  )
}