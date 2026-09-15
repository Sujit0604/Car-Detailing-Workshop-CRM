import { useState } from 'react'
import { Check } from 'lucide-react'
import { ACCENT, ACCENT_HOVER, FAINT, FOREGROUND, LINE_STRONG, PANEL } from '../config/theme'

const TEXT_FIELDS = [
  { key: 'name', label: 'Full Name', type: 'text', placeholder: 'James Wilson', required: true },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'james@example.com', required: true },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '(512) 000-0000', required: false },
  { key: 'vehicle', label: 'Vehicle', type: 'text', placeholder: '2022 BMW M4 Competition', required: true },
]

const DATE_FIELDS = [
  { key: 'date', label: 'Preferred Date', type: 'date', required: true },
  { key: 'time', label: 'Preferred Time', type: 'time', required: false },
]

const inputStyle = {
  background: '#0c0c0c',
  border: `1px solid ${LINE_STRONG}`,
  color: FOREGROUND,
  fontFamily: "'Barlow', sans-serif",
}

const labelStyle = {
  color: '#8a8580',
  letterSpacing: '0.14em',
}

export default function BookingForm({ services, packages }) {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    vehicle: '',
    service: '',
    date: '',
    time: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const updateField = (key) => (e) =>
    setFormState((s) => ({ ...s, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full text-center p-12"
        style={{ border: '1px solid #1e1e1e', background: PANEL }}
      >
        <div className="w-14 h-14 rounded-full flex items-center justify-center mb-6" style={{ background: ACCENT }}>
          <Check size={28} style={{ color: '#fff' }} />
        </div>
        <h3
          className="text-3xl font-black uppercase mb-3"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Request Received
        </h3>
        <p style={{ color: FAINT, fontWeight: 300 }}>
          We will be in touch within 24 hours with your estimate and booking times.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      style={{ border: '1px solid #1e1e1e', background: PANEL, padding: '2rem' }}
    >
      {TEXT_FIELDS.map((field) => (
        <div key={field.key}>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>
            {field.label}
            {field.required && <span style={{ color: ACCENT }}> *</span>}
          </label>
          <input
            type={field.type}
            required={field.required}
            placeholder={field.placeholder}
            value={formState[field.key]}
            onChange={updateField(field.key)}
            className="w-full px-4 py-3 text-sm outline-none transition-colors duration-200"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
            onBlur={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
          />
        </div>
      ))}

      <div>
        <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>
          Service <span style={{ color: ACCENT }}>*</span>
        </label>
        <select
          required
          value={formState.service}
          onChange={updateField('service')}
          className="w-full px-4 py-3 text-sm outline-none transition-colors duration-200"
          style={{
            ...inputStyle,
            color: formState.service ? FOREGROUND : FAINT,
            appearance: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
          onBlur={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
        >
          <option value="" disabled>
            Select a service or package
          </option>
          {services.map((s) => (
            <option key={s.title} value={s.title} style={{ background: PANEL }}>
              {s.title}
            </option>
          ))}
          {packages.map((p) => (
            <option key={p.name} value={`${p.name} Package`} style={{ background: PANEL }}>
              {p.name} — ${p.price}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DATE_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>
              {field.label}
              {field.required && <span style={{ color: ACCENT }}> *</span>}
            </label>
            <input
              type={field.type}
              required={field.required}
              value={formState[field.key]}
              onChange={updateField(field.key)}
              className="w-full px-4 py-3 text-sm outline-none transition-colors duration-200"
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
              onBlur={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>
          Additional Notes
        </label>
        <textarea
          rows={3}
          placeholder="Any specific concerns, paint condition, or add-ons you would like..."
          value={formState.message}
          onChange={updateField('message')}
          className="w-full px-4 py-3 text-sm outline-none transition-colors duration-200 resize-none"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
          onBlur={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
        />
      </div>

      <button
        type="submit"
        className="w-full py-4 text-sm font-black uppercase tracking-widest transition-all duration-200"
        style={{
          background: ACCENT,
          color: '#fff',
          fontFamily: "'Barlow Condensed', sans-serif",
          letterSpacing: '0.2em',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
        onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
      >
        Submit Booking Request
      </button>

      <p className="text-center text-xs" style={{ color: FAINT }}>
        By submitting, you agree to be contacted about your booking. No upfront
        charges to request an estimate.
      </p>
    </form>
  )
}