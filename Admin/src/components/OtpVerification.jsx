import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { loginUser, verifyOtp } from '../services/authApi'
import { useAuth } from '../contexts/authContext.js'
import Brand from './Brand'
import { ACCENT, ACCENT_HOVER, FAINT, FOREGROUND, LINE_STRONG, MUTED, PANEL } from '../config/theme'

const OTP_LENGTH = 6

export default function OtpVerification({ email, password = '', onBack }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const inputRefs = useRef([])

  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setTimeout(() => setResendTimer((t) => t - 1), 1000)
    return () => clearTimeout(id)
  }, [resendTimer])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const code = useMemo(() => digits.join(''), [digits])

  const verify = useCallback(async (otp) => {
    if (otp.length < OTP_LENGTH || loading) return
    setLoading(true)
    try {
      const res = await verifyOtp({ email, code: otp })
      toast.success(res.message || 'Email verified!')
      if (res.data?.user?.role === 'ADMIN') {
        login(res.data.user, res.data.accessToken, res.data.refreshToken)
        navigate('/dashboard')
      } else {
        toast.error('This account is not an administrator')
      }
    } catch (err) {
      toast.error(err.message)
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }, [email, loading, login, navigate])

  const setDigit = useCallback((index, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
    if (next.every((d) => d !== '')) {
      verify(next.join(''))
    }
  }, [digits, verify])

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }, [digits])

  const handlePaste = useCallback((e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus()
    if (next.every((d) => d !== '')) {
      verify(next.join(''))
    }
  }, [verify])

  const resend = useCallback(async () => {
    if (resendTimer > 0 || !password) {
      if (!password) toast.error('Please login again to resend the code')
      return
    }
    try {
      await loginUser({ email, password })
      toast.success('OTP resent to your email')
      setResendTimer(60)
    } catch (err) {
      toast.error(err.message || 'Could not resend OTP')
    }
  }, [email, password, resendTimer])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#0c0c0c' }}>
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <Brand size="text-2xl" />
        </div>

        <div className="flex justify-center mb-5">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-full"
            style={{ background: 'rgba(217,79,61,0.10)' }}
          >
            <Mail size={26} style={{ color: ACCENT }} />
          </div>
        </div>

        <h1
          className="text-3xl font-black uppercase tracking-widest text-center"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Verify Email
        </h1>
        <p className="text-center text-sm mt-2 mb-2 font-light" style={{ color: FAINT }}>
          Enter the 6-digit code sent to
        </p>
        <p className="text-center text-sm mb-6 font-semibold" style={{ color: FOREGROUND }}>
          {email}
        </p>

        <div
          className="space-y-5"
          style={{ border: '1px solid #1e1e1e', background: PANEL, padding: '1.5rem' }}
        >
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className="w-12 h-14 text-center text-xl font-bold outline-none transition-colors duration-200"
                style={{
                  background: '#0c0c0c',
                  border: `1px solid ${d ? ACCENT : LINE_STRONG}`,
                  color: FOREGROUND,
                  fontFamily: "'Barlow Condensed', sans-serif",
                  borderRadius: 2,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = ACCENT }}
                onBlur={(e) => { if (!d) e.currentTarget.style.borderColor = LINE_STRONG }}
              />
            ))}
          </div>

          {loading && (
            <p className="text-center text-sm" style={{ color: MUTED }}>
              Verifying...
            </p>
          )}

          <button
            type="button"
            onClick={() => verify(code)}
            disabled={loading || code.length < OTP_LENGTH}
            className="w-full py-4 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: ACCENT,
              color: '#fff',
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.2em',
              border: 'none',
            }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            Verify
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 mt-6">
          <button
            type="button"
            onClick={resend}
            disabled={resendTimer > 0}
            className="text-sm font-medium disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{ color: resendTimer > 0 ? FAINT : ACCENT, background: 'none', border: 'none' }}
          >
            {resendTimer > 0
              ? `Resend code in ${resendTimer}s`
              : 'Resend code'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm cursor-pointer"
            style={{ color: FAINT, background: 'none', border: 'none' }}
          >
            <ArrowLeft size={14} />
            Back to login
          </button>
        </div>
      </div>
    </div>
  )
}