import { ACCENT, MUTED, PANEL } from '../config/theme'

const STATS = [
  { value: '2,400+', label: 'Happy Customers' },
  { value: '3,100+', label: 'Projects Handled' },
  { value: '45,000+', label: 'Hours of Work' },
  { value: '8+', label: 'Years of Experience' },
]

export default function StatsBar() {
  return (
    <section
      className="grid grid-cols-2 md:grid-cols-4"
      style={{ borderTop: '1px solid #1e1e1e', borderBottom: '1px solid #1e1e1e', background: PANEL }}
    >
      {STATS.map((s, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center py-10 px-4"
          style={{
            borderRight: i < STATS.length - 1 ? '1px solid #1e1e1e' : 'none',
          }}
        >
          <span
            className="text-4xl md:text-5xl font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: ACCENT }}
          >
            {s.value}
          </span>
          <span
            className="text-xs uppercase tracking-widest mt-1"
            style={{ color: MUTED, letterSpacing: '0.14em' }}
          >
            {s.label}
          </span>
        </div>
      ))}
    </section>
  )
}