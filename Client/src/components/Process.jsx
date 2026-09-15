import SectionHeading from './SectionHeading'
import { ACCENT, MUTED, PANEL, SECTION_ALT } from '../config/theme'

const STEPS = [
  {
    step: '01',
    title: 'Share Your Requirements',
    desc: 'Tell us about your vehicle and the service you need through the booking form below — we take it from there.',
  },
  {
    step: '02',
    title: 'Schedule a Consultation',
    desc: 'We inspect your car and send a detailed, itemised estimate — labour and parts, no surprises.',
  },
  {
    step: '03',
    title: 'Approve & Book a Slot',
    desc: 'Approve the estimate, pick your date and time, and confirm with a small refundable booking token.',
  },
  {
    step: '04',
    title: 'Bring Your Car In',
    desc: 'Our detailers handle the rest — repair, quality check, final invoice, and keys back to you.',
  },
]

export default function Process() {
  return (
    <section id="process" className="py-28 px-6 md:px-16" style={{ background: SECTION_ALT }}>
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          align="center"
          eyebrow="How It Works"
          title="From Inquiry to Delivery"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px" style={{ border: '1px solid #1e1e1e' }}>
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="p-8 relative"
              style={{ background: PANEL, borderRight: '1px solid #1e1e1e' }}
            >
              <span
                className="text-6xl font-black leading-none"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: '#2a2a2a' }}
              >
                {s.step}
              </span>
              <h3
                className="text-xl font-black uppercase mt-6 mb-3 tracking-wide"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: MUTED, fontWeight: 300 }}>
                {s.desc}
              </p>
              <div className="absolute bottom-0 left-8 h-0.5 w-12" style={{ background: ACCENT }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}