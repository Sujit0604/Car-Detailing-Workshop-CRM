import { useState } from 'react'
import SectionHeading from './SectionHeading'
import { SERVICES } from '../data/siteData'
import { ACCENT, MUTED, PANEL, PANEL_ACTIVE, SECTION_ALT } from '../config/theme'

export default function Services() {
  const [activeService, setActiveService] = useState(null)

  return (
    <section id="services" className="py-28 px-6 md:px-16" style={{ background: SECTION_ALT }}>
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          eyebrow="What We Do"
          title="Choose From Premium Services"
          sub="Paint protection, body repair, and detailing — every service performed by certified professionals using professional-grade products."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ border: '1px solid #1e1e1e' }}>
          {SERVICES.map((s, i) => {
            const Icon = s.icon
            const active = activeService === i
            return (
              <div
                key={i}
                className="p-8 cursor-pointer transition-all duration-300"
                style={{
                  background: active ? PANEL_ACTIVE : PANEL,
                  borderRight: '1px solid #1e1e1e',
                  borderBottom: '1px solid #1e1e1e',
                }}
                onMouseEnter={() => setActiveService(i)}
                onMouseLeave={() => setActiveService(null)}
              >
                <Icon
                  size={26}
                  className="mb-5 transition-colors duration-200"
                  style={{ color: active ? ACCENT : '#3a3a3a' }}
                />
                <h3
                  className="text-xl font-black uppercase mb-3 tracking-wide"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: MUTED, fontWeight: 300 }}>
                  {s.desc}
                </p>
                <div
                  className="mt-6 h-px transition-all duration-300"
                  style={{ background: ACCENT, width: active ? '100%' : '0%' }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}