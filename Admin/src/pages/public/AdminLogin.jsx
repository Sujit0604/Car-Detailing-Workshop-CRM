import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Lock, ShieldCheck } from 'lucide-react'
import Brand from '../../components/Brand'
import AuthField from '../../components/AuthField'
import Modal from '../../components/Modal'
import OtpVerification from '../../components/OtpVerification'
import { loginUser } from '../../services/authApi'
import { useAuth } from '../../contexts/authContext.js'
import { ACCENT, ACCENT_HOVER, FAINT, FOREGROUND } from '../../config/theme'

const SECRET_KEYS = (import.meta.env.VITE_ADMIN_SECRET_KEY || '')
  .split(',')
  .map((key) => key.trim())
  .filter(Boolean)

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1800&h=1000&fit=crop&auto=format',
    eyebrow: 'Premium Auto Detailing & Body Shop · Est. 2016',
    title: 'Your Car.',
    accent: 'Perfected.',
  },
  {
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&h=1000&fit=crop&auto=format',
    eyebrow: 'Paint Protection & Coatings',
    title: 'Protection That',
    accent: 'Lasts.',
  },
  {
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1800&h=1000&fit=crop&auto=format',
    eyebrow: 'Body Shop & Restoration',
    title: 'Repair. Restore.',
    accent: 'Refine.',
  },
]

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

const AdminLogin = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [slide, setSlide] = useState(0)
  const total = SLIDES.length
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % total), 6000)
    return () => clearInterval(timer)
  }, [total])

  useEffect(() => {
    let buffer = []
    const onKeyDown = (e) => {
      if (revealed) return
      buffer = [...buffer, e.key.toLowerCase()].slice(-SECRET_KEYS.length)
      if (buffer.join('') === SECRET_KEYS.join('')) setRevealed(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [revealed])

  const goTo = (index) => setSlide((index + total) % total)

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await loginUser(data)
      if (res.data?.accessToken) {
        if (res.data.user?.role === 'ADMIN') {
          login(res.data.user, res.data.accessToken, res.data.refreshToken)
          toast.success('Logged in successfully')
          navigate('/dashboard')
        } else {
          toast.error('This account is not an administrator')
        }
      } else {
        toast.success(res.message || 'OTP sent to your email')
        setPending({ email: data.email, password: data.password })
        setModalOpen(false)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (pending) {
    return (
      <OtpVerification
        email={pending.email}
        password={pending.password}
        onBack={() => setPending(null)}
      />
    )
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: '#0c0c0c' }}
    >
      <div className="absolute inset-0">
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
                  'linear-gradient(to top, #0c0c0c 0%, rgba(12,12,12,0.55) 50%, rgba(12,12,12,0.35) 100%)',
              }}
            />
          </div>
        ))}
      </div>

      <div className="absolute bottom-8 right-6 md:right-10 z-20 flex items-center gap-6">
        <button
          aria-label="Previous slide"
          className="p-2 transition-colors duration-200 cursor-pointer"
          style={{ border: '1px solid #3a3a3a', color: FOREGROUND, background: 'rgba(12,12,12,0.4)' }}
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
              className="h-1 transition-all duration-300 cursor-pointer"
              style={{
                width: i === slide ? 32 : 16,
                background: i === slide ? ACCENT : '#3a3a3a',
              }}
            />
          ))}
        </div>
        <button
          aria-label="Next slide"
          className="p-2 transition-colors duration-200 cursor-pointer"
          style={{ border: '1px solid #3a3a3a', color: FOREGROUND, background: 'rgba(12,12,12,0.4)' }}
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

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10">
        {revealed ? (
          <>
            <div className="flex justify-center mb-6">
              <Brand size="text-2xl" />
            </div>

            <div className="flex justify-center mb-5">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-full"
                style={{ background: 'rgba(217,79,61,0.10)' }}
              >
                <ShieldCheck size={26} style={{ color: ACCENT }} />
              </div>
            </div>

            <h1
              className="text-3xl font-black uppercase tracking-widest text-center"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Admin Login
            </h1>
            <p className="text-center text-sm mt-2 mb-8 font-light" style={{ color: FOREGROUND }}>
              Access the KROM DETAIL admin console
            </p>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-10 py-4 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={{
                background: ACCENT,
                color: '#fff',
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.2em',
                border: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT_HOVER }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
            >
              Open Admin Login
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <Brand size="text-2xl" />
            </div>

            <div className="flex justify-center mb-5">
              <div
                className="flex items-center justify-center w-14 h-14 rounded-full"
                style={{ background: 'rgba(217,79,61,0.10)' }}
              >
                <Lock size={26} style={{ color: ACCENT }} />
              </div>
            </div>

            <h1
              className="text-3xl font-black uppercase tracking-widest text-center"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Admin Console
            </h1>
            <p className="text-center text-sm mt-2 font-light" style={{ color: FAINT }}>
              Secured · Only admin can access
            </p>
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Admin Login"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <AuthField
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="admin@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <AuthField
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Your password"
            error={errors.password?.message}
            {...register('password')}
          />

          <button
            type="submit"
            disabled={loading}
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </Modal>
    </div>
  )
}

export default AdminLogin