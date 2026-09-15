import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import Login from '../pages/public/Login'
import Register from '../pages/public/Register'
import OtpVerification from './OtpVerification'
import { ACCENT, PANEL } from '../config/theme'

export default function AuthModal({ open, initialMode = 'login', onClose }) {
  const [mode, setMode] = useState(initialMode)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpPassword, setOtpPassword] = useState('')
  const [prefillEmail, setPrefillEmail] = useState('')

  const [prevOpen, setPrevOpen] = useState(open)
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode)

  if (open !== prevOpen || initialMode !== prevInitialMode) {
    setPrevOpen(open)
    setPrevInitialMode(initialMode)
    if (open) {
      setMode(initialMode)
      setOtpEmail('')
      setOtpPassword('')
      setPrefillEmail('')
    }
  }

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  const handleSwitch = (nextMode, payload = {}) => {
    setMode(nextMode)
    if (nextMode === 'otp') {
      setOtpEmail(payload.email || '')
      setOtpPassword(payload.password || '')
      setPrefillEmail('')
    } else if (nextMode === 'login') {
      setPrefillEmail(payload.email || '')
      setOtpEmail('')
      setOtpPassword('')
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      style={{
        background: 'rgba(8, 8, 8, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'login' ? 'Login' : mode === 'register' ? 'Register' : 'Verify Email'}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{ border: '1px solid #1e1e1e', background: PANEL }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 z-10 p-2 transition-colors duration-200"
          style={{ color: '#8a8580' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8a8580')}
        >
          <X size={20} />
        </button>

        <div className="p-6 pt-12 sm:p-8 sm:pt-12">
          {mode === 'login' ? (
            <Login onSwitchMode={handleSwitch} initialEmail={prefillEmail} />
          ) : mode === 'register' ? (
            <Register onSwitchMode={handleSwitch} />
          ) : (
            <OtpVerification
              email={otpEmail}
              password={otpPassword}
              onBack={() => handleSwitch('login', { email: otpEmail })}
            />
          )}
        </div>
      </div>
    </div>
  )
}