import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { ACCENT, FOREGROUND, FAINT, LINE_STRONG, fieldBaseStyle, labelStyle } from '../config/theme'

export function FieldLabel({ children }) {
  return (
    <label
      className="block text-xs uppercase tracking-widest mb-1.5"
      style={labelStyle}
    >
      {children}
    </label>
  )
}

export function TextInput({ label, required, ...props }) {
  const [show, setShow] = useState(false)
  const isPassword = props.type === 'password'
  const inputType = isPassword && show ? 'text' : props.type

  return (
    <div>
      {label && (
        <FieldLabel>
          {label}
          {required && <span style={{ color: ACCENT }}> *</span>}
        </FieldLabel>
      )}
      <div className="relative">
        <input
          {...props}
          type={inputType}
          className="w-full px-4 py-3 text-sm transition-colors duration-200"
          style={isPassword ? { ...fieldBaseStyle, paddingRight: '44px' } : fieldBaseStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
          onBlur={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
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
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}

export function SelectInput({ label, required, children, placeholder, ...props }) {
  return (
    <div>
      {label && (
        <FieldLabel>
          {label}
          {required && <span style={{ color: ACCENT }}> *</span>}
        </FieldLabel>
      )}
      <select
        {...props}
        className="w-full px-4 py-3 text-sm transition-colors duration-200"
        style={{
          ...fieldBaseStyle,
          appearance: 'none',
          color: props.value ? FOREGROUND : FAINT,
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
        onBlur={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    </div>
  )
}

export function TextArea({ label, required, ...props }) {
  return (
    <div>
      {label && (
        <FieldLabel>
          {label}
          {required && <span style={{ color: ACCENT }}> *</span>}
        </FieldLabel>
      )}
      <textarea
        {...props}
        className="w-full px-4 py-3 text-sm transition-colors duration-200 resize-none"
        style={fieldBaseStyle}
        onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
        onBlur={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
      />
    </div>
  )
}