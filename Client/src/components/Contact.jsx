import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import BookingForm from './BookingForm'
import { SERVICES, PACKAGES } from '../data/siteData'
import { ACCENT, FOREGROUND, MUTED } from '../config/theme'

const CONTACT_INFO = [
  { icon: MapPin, label: 'Location', value: '4820 Industrial Blvd, Pune, MH 412307' },
  { icon: Phone, label: 'Phone', value: '(512) 944-2200' },
  { icon: Mail, label: 'Email', value: 'hello@kromdetail.com' },
  { icon: Clock, label: 'Hours', value: 'Mon–Sat  8:00 AM – 6:00 PM' },
]

export default function Contact() {
  return (
    <section id="contact" className="py-28 px-6 md:px-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: ACCENT, letterSpacing: '0.3em' }}
          >
            Book a Detail
          </p>
          <h2
            className="text-5xl md:text-6xl font-black uppercase leading-none mb-6"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Ready to
            <br />
            Get Started?
          </h2>
          <p className="text-base mb-10" style={{ color: MUTED, fontWeight: 300, lineHeight: 1.8 }}>
            Fill out the form and we will send an itemised estimate within 24 hours.
            Approve it, pick a slot, and we will take it from there.
          </p>

          <div className="space-y-6">
            {CONTACT_INFO.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-start gap-4">
                  <Icon size={18} className="mt-0.5" style={{ color: ACCENT }} />
                  <div>
                    <p
                      className="text-xs uppercase tracking-widest mb-0.5"
                      style={{ color: MUTED, letterSpacing: '0.16em' }}
                    >
                      {item.label}
                    </p>
                    <p className="text-sm" style={{ color: FOREGROUND, fontWeight: 400 }}>
                      {item.value}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <BookingForm services={SERVICES} packages={PACKAGES} />
        </div>
      </div>
    </section>
  )
}