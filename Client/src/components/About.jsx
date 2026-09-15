import { Award, ArrowRight } from 'lucide-react'
import SectionHeading from './SectionHeading'
import { ACCENT, MUTED } from '../config/theme'

const BADGES = ['IDA Certified', 'Gyeon Certified', 'PPF Specialist', 'Fully Insured']

export default function About() {
  return (
    <section id="about" className="py-28 px-6 md:px-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <SectionHeading
            eyebrow="Who We Are"
            title={
              <>
                We Don't Just Fix Cars —
                <br />
                <span style={{ color: ACCENT }}>We Build Trust</span>
              </>
            }
          />
          <p className="text-base mb-5" style={{ color: MUTED, fontWeight: 300, lineHeight: 1.8 }}>
            Krom Detail was founded by professional automotive enthusiasts who were
            frustrated with mediocre results. We built our reputation one car at a
            time — on honesty, precision, and a refusal to cut corners.
          </p>
          <p className="text-base mb-8" style={{ color: MUTED, fontWeight: 300, lineHeight: 1.8 }}>
            Every technician on our team is IDA-certified and undergoes ongoing
            training in the latest techniques and product chemistry. Your car is in
            expert hands.
          </p>

          <div className="flex flex-wrap gap-6">
            {BADGES.map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5"
                style={{
                  border: '1px solid #2a2a2a',
                  color: MUTED,
                  letterSpacing: '0.14em',
                }}
              >
                <Award size={12} style={{ color: ACCENT }} />
                {badge}
              </span>
            ))}
          </div>

          <a
            href="#services"
            className="inline-flex items-center gap-2 mt-10 text-sm font-bold uppercase tracking-widest transition-colors duration-200"
            style={{
              color: ACCENT,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.16em',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e8643a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = ACCENT)}
          >
            Explore What We Do
            <ArrowRight size={16} />
          </a>
        </div>

        <div className="relative overflow-hidden" style={{ aspectRatio: '4/5', background: '#151515' }}>
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=875&fit=crop&auto=format"
            alt="Detailer applying ceramic coating"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute bottom-6 left-6 right-6 p-5"
            style={{
              background: 'rgba(12,12,12,0.9)',
              border: '1px solid #1e1e1e',
              backdropFilter: 'blur(8px)',
            }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-1"
              style={{ color: ACCENT, letterSpacing: '0.2em' }}
            >
              Our Promise
            </p>
            <p className="text-sm" style={{ color: '#b0ada8', fontWeight: 300, lineHeight: 1.6 }}>
              'If you are not completely satisfied, we will come back and make it
              right — no questions asked.'
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}