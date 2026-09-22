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
  return (
    <div>
      {label && (
        <FieldLabel>
          {label}
          {required && <span style={{ color: ACCENT }}> *</span>}
        </FieldLabel>
      )}
      <input
        {...props}
        className="w-full px-4 py-3 text-sm transition-colors duration-200"
        style={fieldBaseStyle}
        onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
        onBlur={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
      />
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