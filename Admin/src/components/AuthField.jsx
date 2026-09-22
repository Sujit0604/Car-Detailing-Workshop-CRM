import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { ACCENT, FAINT, FOREGROUND, LINE_STRONG } from '../config/theme'

const labelStyle = {
  color: '#8a8580',
  letterSpacing: '0.14em',
}

export default function AuthField({
  label,
  error,
  type = 'text',
  required = false,
  autoComplete,
  placeholder,
  onBlur,
  ...inputProps
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div>
      <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>
        {label}
        {required && <span style={{ color: ACCENT }}> *</span>}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          type={isPassword && show ? 'text' : type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = ACCENT
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = LINE_STRONG
            if (onBlur) onBlur(e)
          }}
          className="w-full px-4 py-3 text-sm outline-none transition-colors duration-200 pr-12"
          style={{
            background: '#0c0c0c',
            border: `1px solid ${LINE_STRONG}`,
            color: FOREGROUND,
            fontFamily: "'Barlow', sans-serif",
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200"
            style={{ color: FAINT }}
            onMouseEnter={(e) => (e.currentTarget.style.color = FOREGROUND)}
            onMouseLeave={(e) => (e.currentTarget.style.color = FAINT)}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium" style={{ color: ACCENT }}>
          {error}
        </p>
      )}
    </div>
  )
}