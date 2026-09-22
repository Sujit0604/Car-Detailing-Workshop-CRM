import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'
import Brand from '../../components/Brand'
import AuthField from '../../components/AuthField'
import OtpVerification from '../../components/OtpVerification'
import { loginUser } from '../../services/authApi'
import { useAuth } from '../../contexts/authContext.js'
import { ACCENT, ACCENT_HOVER, FAINT, PANEL } from '../../config/theme'

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
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: '#0c0c0c' }}
    >
      <div className="w-full max-w-md mx-auto">
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
        <p className="text-center text-sm mt-2 mb-6 font-light" style={{ color: FAINT }}>
          Access the KROM DETAIL admin console
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          style={{ border: '1px solid #1e1e1e', background: PANEL, padding: '1.5rem' }}
          noValidate
        >
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
      </div>
    </div>
  )
}

export default AdminLogin