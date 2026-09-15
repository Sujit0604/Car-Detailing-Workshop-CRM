import { ACCENT } from '../config/theme'

export default function Brand({ size = 'text-xl', dark = false }) {
  return (
    <div className={`flex items-center gap-2 ${size}`}>
      <span
        className="font-black tracking-widest uppercase"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          color: dark ? ACCENT : ACCENT,
          letterSpacing: '0.18em',
        }}
      >
        KROM
      </span>
      <span
        className="font-black tracking-widest uppercase"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: '0.18em',
        }}
      >
        DETAIL
      </span>
    </div>
  )
}