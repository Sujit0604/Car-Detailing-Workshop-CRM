import { ACCENT, FOREGROUND, MUTED } from '../config/theme'

export default function Brand({ size = 'text-xl' }) {
  return (
    <div className="flex items-center gap-2.5" style={{ color: FOREGROUND }}>
      <div
        className="flex items-center justify-center w-10 h-10"
        style={{ background: ACCENT }}
      >
        <span className="text-lg font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#fff' }}>
          KD
        </span>
      </div>
      <div className="leading-none">
        <span
          className={`${size} font-black uppercase tracking-widest`}
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.14em' }}
        >
          KROM<span style={{ color: ACCENT }}>DETAIL</span>
        </span>
        <p className="text-[10px] mt-1 uppercase tracking-[0.3em]" style={{ color: MUTED }}>
          Admin Console
        </p>
      </div>
    </div>
  )
}