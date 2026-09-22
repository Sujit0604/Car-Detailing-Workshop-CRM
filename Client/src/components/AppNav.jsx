import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutGrid,
  Car,
  CalendarPlus,
  CalendarClock,
  Wrench,
  ClipboardList,
  Package,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../contexts/authContext.js'
import { getHomePath } from '../utils/routes'
import {
  ACCENT,
  ACCENT_HOVER,
  FOREGROUND,
  LINE_STRONG,
  MUTED,
  PANEL,
} from '../config/theme'

const CUSTOMER_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/vehicles', label: 'Vehicles', icon: Car },
  { to: '/book-service', label: 'Book Service', icon: CalendarPlus },
  { to: '/bookings', label: 'My Bookings', icon: CalendarClock },
]

const ROLE_LINKS = {
  CUSTOMER: [...CUSTOMER_LINKS],
  SERVICE_ADVISOR: [
    { to: '/workshop/jobs', label: 'Job Board', icon: ClipboardList },
    { to: '/workshop/bookings', label: 'Bookings', icon: Wrench },
  ],
  WORKSHOP_MANAGER: [
    { to: '/workshop/jobs', label: 'Job Board', icon: ClipboardList },
    { to: '/workshop/bookings', label: 'Bookings', icon: Wrench },
    { to: '/workshop/inventory', label: 'Inventory', icon: Package },
  ],
  MECHANIC: [
    { to: '/workshop/jobs', label: 'My Jobs', icon: ClipboardList },
  ],
  ADMIN: [
    { to: '/workshop/jobs', label: 'Job Board', icon: ClipboardList },
    { to: '/workshop/bookings', label: 'Bookings', icon: Wrench },
    { to: '/workshop/inventory', label: 'Inventory', icon: Package },
  ],
}

export default function AppNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role

  const links = ROLE_LINKS[role] || CUSTOMER_LINKS
  const homePath = getHomePath(role)

  return (
    <header
      className="sticky top-0 z-50 px-4 sm:px-8"
      style={{ background: PANEL, borderBottom: `1px solid ${LINE_STRONG}` }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 py-4">
        <NavLink
          to={homePath}
          className="flex items-center gap-2.5"
          style={{ color: FOREGROUND, textDecoration: 'none' }}
        >
          <div
            className="flex items-center justify-center w-9 h-9"
            style={{ background: ACCENT }}
          >
            <Wrench size={18} style={{ color: '#fff' }} />
          </div>
          <span
            className="text-xl font-black uppercase tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.14em' }}
          >
            KROM<span style={{ color: ACCENT }}>DETAIL</span>
          </span>
        </NavLink>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
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
            {user?.name}
            {user?.role && (
              <span style={{ color: ACCENT }}> · {user.role.replace(/_/g, ' ')}</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/')
            }}
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
        {links.map(({ to, label, icon: Icon }) => (
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
    </header>
  )
}