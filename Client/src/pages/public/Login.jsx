import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Brand from '../../components/Brand'
import AuthField from '../../components/AuthField'
import { loginUser } from '../../services/authApi'
import { useAuth } from '../../contexts/authContext.js'
import { getHomePath } from '../../utils/routes'
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

const Login = ({ onSwitchMode, initialEmail = '' }) => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: initialEmail, password: '' },
  })

  useEffect(() => {
    if (initialEmail) setValue('email', initialEmail)
  }, [initialEmail, setValue])

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await loginUser(data)
      if (res.data?.accessToken) {
        login(res.data.user, res.data.accessToken, res.data.refreshToken)
        toast.success('Logged in successfully')
        navigate(getHomePath(res.data.user.role))
      } else {
        toast.success(res.message || 'OTP sent to your email')
        onSwitchMode?.('otp', { email: data.email, password: data.password })
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        <Brand size="text-2xl" />
      </div>

      <h1
        className="text-3xl font-black uppercase tracking-widest text-center"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        Login
      </h1>
      <p className="text-center text-sm mt-2 mb-6 font-light" style={{ color: FAINT }}>
        Access your KROM DETAIL account
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
          placeholder="james@example.com"
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

      <p
        className="text-center text-sm mt-6 font-light"
        style={{ color: FAINT }}
      >
        New to KROM DETAIL?{' '}
        <button
          type="button"
          onClick={() => onSwitchMode?.('register')}
          className="font-semibold"
          style={{ color: ACCENT }}
        >
          Create an account
        </button>
      </p>
    </div>
  )
}

export default Login