import { Check } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { PACKAGES } from '../data/siteData'
import { ACCENT, FAINT, FOREGROUND, LINE_STRONG, MUTED, PANEL, PANEL_ACTIVE } from '../config/theme'

const buttonHover = (e) => {
  e.currentTarget.style.background = ACCENT
  e.currentTarget.style.borderColor = ACCENT
  e.currentTarget.style.color = '#fff'
}

const buttonLeave = (e, pkg) => {
  e.currentTarget.style.background = pkg.highlight ? ACCENT : 'transparent'
  e.currentTarget.style.borderColor = pkg.highlight ? ACCENT : LINE_STRONG
  e.currentTarget.style.color = pkg.highlight ? '#fff' : FOREGROUND
}

export default function Packages() {
  return (
    <section id="packages" className="py-28 px-6 md:px-16">
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          align="center"
          eyebrow="Pricing"
          title="Choose Your Package"
          sub="Transparent pricing with itemised estimates. No surprises."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ border: '1px solid #1e1e1e' }}>
          {PACKAGES.map((pkg, i) => (
            <div
              key={i}
              className="relative flex flex-col p-8"
              style={{
                background: pkg.highlight ? PANEL_ACTIVE : PANEL,
                borderRight: '1px solid #1e1e1e',
              }}
            >
              {pkg.highlight && (
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: ACCENT }} />
              )}
              <div className="mb-8">
                <p
                  className="text-xs uppercase tracking-widest mb-1"
                  style={{ color: MUTED, letterSpacing: '0.2em' }}
                >
                  {pkg.tagline}
                </p>
                <h3
                  className="text-3xl font-black uppercase"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {pkg.name}
                </h3>
                <div className="flex items-baseline gap-1 mt-4">
                  <span
                    className="text-5xl font-black"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      color: pkg.highlight ? ACCENT : FOREGROUND,
                    }}
                  >
                    ${pkg.price}
                  </span>
                  <span className="text-sm" style={{ color: MUTED }}>
                    / vehicle
                  </span>
                </div>
                <p className="text-xs mt-2" style={{ color: MUTED }}>
                  ≈ {pkg.duration}
                </p>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                {pkg.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-3 text-sm">
                    <Check size={14} style={{ color: ACCENT, marginTop: 2 }} />
                    <span style={{ color: '#b0ada8', fontWeight: 300 }}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                onMouseEnter={(e) => buttonHover(e, pkg)}
                onMouseLeave={(e) => buttonLeave(e, pkg)}
                className="block text-center py-3.5 text-sm font-bold uppercase tracking-widest transition-all duration-200"
                style={{
                  background: pkg.highlight ? ACCENT : 'transparent',
                  color: pkg.highlight ? '#fff' : FOREGROUND,
                  border: pkg.highlight ? '1px solid #d94f3d' : '1px solid #2a2a2a',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: '0.16em',
                }}
              >
                Book {pkg.name}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-sm mt-6" style={{ color: FAINT }}>
          Prices may vary by vehicle size. SUVs & trucks add $50. Fleet pricing available.
        </p>
      </div>
    </section>
  )
}