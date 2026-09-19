import { ACCENT } from '../config/theme'

export default function Spinner({ label = 'Loading...' }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-16"
      style={{ color: ACCENT }}
    >
      <div
        className="w-8 h-8 rounded-full animate-spin"
        style={{
          border: `2px solid rgba(217,79,61,0.2)`,
          borderTopColor: ACCENT,
        }}
      />
      <span className="text-xs uppercase tracking-widest" style={{ color: ACCENT }}>
        {label}
      </span>
    </div>
  )
}