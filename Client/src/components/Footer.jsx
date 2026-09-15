import Brand from './Brand'
import { ACCENT } from '../config/theme'

const SOCIALS = ['Instagram', 'Facebook', 'Google']

export default function Footer() {
  return (
    <footer
      className="py-10 px-6 md:px-16"
      style={{ borderTop: '1px solid #1e1e1e', background: '#0a0a0a' }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Brand size="text-lg" />
        <p className="text-xs" style={{ color: '#4a4a4a' }}>
          © 2026 Krom Detail. All rights reserved.
        </p>
        <div className="flex gap-6">
          {SOCIALS.map((s) => (
            <a
              key={s}
              href="#"
              className="text-xs uppercase tracking-widest transition-colors duration-200"
              style={{ color: '#4a4a4a', letterSpacing: '0.14em' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#4a4a4a')}
            >
              {s}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}