import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Brand from './Brand'
import { useAuth } from '../contexts/authContext.js'
import { ACCENT, ACCENT_HOVER, FOREGROUND, MUTED, LINE_STRONG } from '../config/theme'

const NAV_LINKS = ['About','Services', 'Packages', 'Process', 'Gallery', 'Customer-Review', 'Contact']

const btnBaseStyle = {
  fontFamily: "'Barlow Condensed', sans-serif",
  letterSpacing: '0.14em',
}

export default function Navbar({ onLoginClick, onRegisterClick }) {
  const { isAuthenticated, user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const firstName = user?.name?.split(' ')[0] || ''

  const handleLogout = () => {
    setMobileOpen(false)
    logout()
  }

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16"
        style={{
          background: 'rgba(12,12,12,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #1e1e1e',
        }}
      >
        <Brand />

        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              className="text-sm font-medium tracking-widest uppercase transition-colors duration-200"
              style={{
                color: MUTED,
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.14em',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = FOREGROUND)}
              onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
            >
              {l}
            </a>
          ))}

          {isAuthenticated ? (
            <>
              <span
                className="text-sm font-semibold uppercase tracking-widest"
                style={{
                  color: MUTED,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: '0.14em',
                }}
              >
                Hi, {firstName}
              </span>
              <Link
                to="/dashboard"
                className="px-5 py-2 text-sm font-bold uppercase tracking-widest transition-all duration-200"
                style={{
                  color: FOREGROUND,
                  border: `1px solid ${LINE_STRONG}`,
                  background: 'transparent',
                  ...btnBaseStyle,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = ACCENT
                  e.currentTarget.style.color = ACCENT
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = LINE_STRONG
                  e.currentTarget.style.color = FOREGROUND
                }}
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-5 py-2 text-sm font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={{
                  color: MUTED,
                  border: `1px solid ${LINE_STRONG}`,
                  background: 'transparent',
                  ...btnBaseStyle,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = ACCENT
                  e.currentTarget.style.borderColor = ACCENT
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = LINE_STRONG
                  e.currentTarget.style.color = MUTED
                }}
              >
                <LogOut size={14} className="inline -mt-0.5 mr-1" />
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onLoginClick}
                className="px-5 py-2 text-sm font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={{
                  color: FOREGROUND,
                  border: `1px solid ${LINE_STRONG}`,
                  background: 'transparent',
                  ...btnBaseStyle,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = ACCENT
                  e.currentTarget.style.color = ACCENT
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = LINE_STRONG
                  e.currentTarget.style.color = FOREGROUND
                }}
              >
                Login
              </button>
              <button
                type="button"
                onClick={onRegisterClick}
                className="px-5 py-2 text-sm font-bold uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={{
                  color: FOREGROUND,
                  border: `1px solid ${LINE_STRONG}`,
                  background: 'transparent',
                  ...btnBaseStyle,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = ACCENT
                  e.currentTarget.style.color = ACCENT
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = LINE_STRONG
                  e.currentTarget.style.color = FOREGROUND
                }}
              >
                Register
              </button>
            </>
          )}

          <a
            href="#contact"
            className="px-5 py-2 text-sm font-bold uppercase tracking-widest transition-all duration-200"
            style={{
              background: ACCENT,
              color: '#fff',
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.14em',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            Book Now
          </a>
        </div>

        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span
            className="block w-6 h-0.5 transition-all"
            style={{
              background: FOREGROUND,
              transform: mobileOpen ? 'translateY(8px) rotate(45deg)' : 'none',
            }}
          />
          <span
            className="block w-6 h-0.5 transition-all"
            style={{ background: FOREGROUND, opacity: mobileOpen ? 0 : 1 }}
          />
          <span
            className="block w-6 h-0.5 transition-all"
            style={{
              background: FOREGROUND,
              transform: mobileOpen ? 'translateY(-8px) rotate(-45deg)' : 'none',
            }}
          />
        </button>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 md:hidden"
          style={{ background: '#0c0c0c' }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              onClick={() => setMobileOpen(false)}
              className="text-3xl font-black uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              {l}
            </a>
          ))}

          {isAuthenticated ? (
            <>
              <p
                className="text-lg font-semibold uppercase tracking-widest"
                style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Hi, {firstName}
              </p>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="px-8 py-3 text-xl font-black uppercase tracking-widest"
                style={{
                  background: ACCENT,
                  color: '#fff',
                  fontFamily: "'Barlow Condensed', sans-serif",
                }}
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-8 py-3 text-xl font-black uppercase tracking-widest cursor-pointer"
                style={{
                  border: `2px solid ${ACCENT}`,
                  color: ACCENT,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  background: 'transparent',
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false)
                    onLoginClick?.()
                  }}
                  className="px-8 py-3 text-xl font-black uppercase tracking-widest cursor-pointer"
                  style={{
                    border: `2px solid ${ACCENT}`,
                    color: ACCENT,
                    fontFamily: "'Barlow Condensed', sans-serif",
                    background: 'transparent',
                  }}
                >
                  Login
                </button>
                <a
                  href="#contact"
                  onClick={() => setMobileOpen(false)}
                  className="px-8 py-3 text-xl font-black uppercase tracking-widest"
                  style={{
                    background: ACCENT,
                    color: '#fff',
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}
                >
                  Book Now
                </a>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false)
                  onRegisterClick?.()
                }}
                className="px-8 py-3 text-xl font-black uppercase tracking-widest cursor-pointer"
                style={{
                  border: `2px solid ${ACCENT}`,
                  color: ACCENT,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  background: 'transparent',
                }}
              >
                Register
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}