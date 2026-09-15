import { Quote } from 'lucide-react'
import SectionHeading from './SectionHeading'
import StarRating from './StarRating'
import { ACCENT, MUTED, PANEL, SECTION_ALT } from '../config/theme'

const TESTIMONIALS = [
  {
    name: 'Marcus R.',
    vehicle: '2022 BMW M4',
    stars: 5,
    text: 'The paint correction on my M4 is absolutely mind-blowing. Swirl marks I thought were permanent are completely gone. Worth every penny.',
    avatar: 'M',
  },
  {
    name: 'Priya S.',
    vehicle: '2021 Range Rover Sport',
    stars: 5,
    text: 'Booked the Prestige package before a road trip. The ceramic coating has been repelling everything for 8 months now. Exceptional work.',
    avatar: 'P',
  },
  {
    name: 'Amit R.',
    vehicle: '2020 Honda City',
    stars: 5,
    text: 'The insurance repair process was completely stress-free. One estimate, one approval, and my car came back looking better than the day I bought it.',
    avatar: 'A',
  },
]

export default function Testimonials() {
  return (
    <section id="customer-review" className="py-28 px-6 md:px-16" style={{ background: SECTION_ALT }}>
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          align="center"
          eyebrow="Customer Review"
          title="What Clients Say"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px" style={{ border: '1px solid #1e1e1e' }}>
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="p-8"
              style={{ background: PANEL, borderRight: '1px solid #1e1e1e' }}
            >
              <Quote size={20} style={{ color: ACCENT }} />
              <StarRating count={t.stars} />
              <p
                className="mt-5 mb-8 text-sm leading-relaxed"
                style={{ color: '#b0ada8', fontWeight: 300, lineHeight: 1.8 }}
              >
                '{t.text}'
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: ACCENT, color: '#fff' }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs" style={{ color: MUTED }}>
                    {t.vehicle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}