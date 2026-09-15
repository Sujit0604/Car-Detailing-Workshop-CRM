import { useEffect, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { ACCENT, ACCENT_HOVER, FOREGROUND } from '../config/theme'

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1800&h=1000&fit=crop&auto=format',
    eyebrow: 'Premium Auto Detailing & Body Shop · Est. 2016',
    title: 'Your Car.',
    accent: 'Perfected.',
    sub: 'From a quick refresh to a full concours restoration — paint protection, ceramic coating, body repair, and detailing that turns heads.',
  },
  {
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&h=1000&fit=crop&auto=format',
    eyebrow: 'Paint Protection & Coatings',
    title: 'Protection That',
    accent: 'Lasts.',
    sub: '9H nano-ceramic bonding and self-healing paint protection film engineered for years of hydrophobic, UV-proof defence.',
  },
  {
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1800&h=1000&fit=crop&auto=format',
    eyebrow: 'Body Shop & Restoration',
    title: 'Repair. Restore.',
    accent: 'Refine.',
    sub: 'Multi-stage paint correction, panel painting, and full resprays restored to a factory-level gloss and mirror finish.',
  },
]

export default function Hero() {
  const [slide, setSlide] = useState(0)
  const total = SLIDES.length

  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % total), 6000)
    return () => clearInterval(timer)
  }, [total])

  const goTo = (index) => setSlide((index + total) % total)

  return (
    <section id="home" className="relative min-h-screen flex flex-col justify-end">
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === slide ? 1 : 0 }}
        >
          <img src={s.image} alt="" className="w-full h-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, #0c0c0c 0%, rgba(12,12,12,0.7) 50%, rgba(12,12,12,0.3) 100%)',
            }}
          />
        </div>
      ))}

      <div className="relative z-10 px-6 md:px-16 pb-20 pt-32">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-4"
          style={{ color: ACCENT, letterSpacing: '0.3em' }}
        >
          {SLIDES[slide].eyebrow}
        </p>
        <h1
          className="text-6xl md:text-9xl font-black uppercase leading-none mb-6"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '-0.01em',
          }}
        >
          {SLIDES[slide].title}
          <br />
          <span style={{ color: ACCENT }}>{SLIDES[slide].accent}</span>
        </h1>
        <p
          className="text-base md:text-lg max-w-lg mb-10"
          style={{ color: '#b0ada8', lineHeight: 1.7, fontWeight: 300 }}
        >
          {SLIDES[slide].sub}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-200"
            style={{
              background: ACCENT,
              color: '#fff',
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.18em',
              fontSize: '1rem',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            Book a Detail
            <ArrowRight size={16} />
          </a>
          <a
            href="#services"
            className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-200"
            style={{
              border: '1px solid #3a3a3a',
              color: FOREGROUND,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.18em',
              fontSize: '1rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = ACCENT
              e.currentTarget.style.color = ACCENT
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#3a3a3a'
              e.currentTarget.style.color = FOREGROUND
            }}
          >
            Explore Services
          </a>
        </div>

        <div className="mt-12 flex items-center gap-6">
          <button
            aria-label="Previous slide"
            className="p-2 transition-colors duration-200"
            style={{ border: '1px solid #3a3a3a', color: FOREGROUND }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = ACCENT
              e.currentTarget.style.color = ACCENT
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#3a3a3a'
              e.currentTarget.style.color = FOREGROUND
            }}
            onClick={() => goTo(slide - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className="h-1 transition-all duration-300"
                style={{
                  width: i === slide ? 32 : 16,
                  background: i === slide ? ACCENT : '#3a3a3a',
                }}
              />
            ))}
          </div>
          <button
            aria-label="Next slide"
            className="p-2 transition-colors duration-200"
            style={{ border: '1px solid #3a3a3a', color: FOREGROUND }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = ACCENT
              e.currentTarget.style.color = ACCENT
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#3a3a3a'
              e.currentTarget.style.color = FOREGROUND
            }}
            onClick={() => goTo(slide + 1)}
          >
            <ChevronRight size={18} />
          </button>
          <span
            className="text-sm tracking-widest"
            style={{ color: '#8a8580', fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            0{slide + 1} / 0{total}
          </span>
        </div>
      </div>
    </section>
  )
}