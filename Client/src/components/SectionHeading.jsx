import { ACCENT, MUTED } from '../config/theme'

export default function SectionHeading({ eyebrow, title, sub, align = 'left' }) {
  const centered = align === 'center'
  return (
    <div className={`mb-16 ${centered ? 'text-center' : ''}`}>
      <p
        className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: ACCENT, letterSpacing: '0.3em' }}
      >
        {eyebrow}
      </p>
      <h2
        className="text-5xl md:text-7xl font-black uppercase leading-none"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {title}
      </h2>
      {sub && (
        <p
          className={`mt-5 text-base max-w-md ${centered ? 'mx-auto' : ''}`}
          style={{ color: MUTED, fontWeight: 300, lineHeight: 1.7 }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}