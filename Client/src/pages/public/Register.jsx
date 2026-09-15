import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Brand from '../../components/Brand'
import AuthField from '../../components/AuthField'
import { registerUser } from '../../services/authApi'
import {
  ACCENT,
  ACCENT_HOVER,
  FAINT,
  FOREGROUND,
  LINE_STRONG,
  PANEL,
} from '../../config/theme'

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Include at least one lowercase letter')
      .regex(/[A-Z]/, 'Include at least one uppercase letter')
      .regex(/[0-9]/, 'Include at least one number')
      .regex(/[^A-Za-z0-9]/, 'Include at least one symbol'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    gender: z.enum(['male', 'female', 'other'], {
      required_error: 'Please select a gender',
    }),
    phone: z
      .string()
      .trim()
      .min(1, 'Phone is required')
      .refine(
        (value) => /^\+?[0-9]{10,15}$/.test(value),
        'Enter a valid 10-15 digit phone number',
      ),
    role: z.enum(['CUSTOMER', 'WORKSHOP_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC'], {
      required_error: 'Please select a role',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

const ROLE_OPTIONS = [
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'WORKSHOP_MANAGER', label: 'Workshop Manager' },
  { value: 'SERVICE_ADVISOR', label: 'Service Advisor' },
  { value: 'MECHANIC', label: 'Mechanic' },
]

const selectStyle = {
  background: '#0c0c0c',
  border: `1px solid ${LINE_STRONG}`,
  color: FOREGROUND,
  fontFamily: "'Barlow', sans-serif",
}

const labelStyle = {
  color: '#8a8580',
  letterSpacing: '0.14em',
}

const Register = ({ onSwitchMode }) => {
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      gender: '',
      phone: '',
      role: '',
    },
  })

  const onSubmit = async ({ confirmPassword, ...data }) => {
    setLoading(true)
    try {
      const res = await registerUser(data)
      toast.success(res.message || 'Account created! Please login.')
      onSwitchMode?.('login', { email: data.email })
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
        Register
      </h1>
      <p className="text-center text-sm mt-2 mb-6 font-light" style={{ color: FAINT }}>
        Join KROM DETAIL and book premium care
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        style={{ border: '1px solid #1e1e1e', background: PANEL, padding: '1.5rem' }}
        noValidate
      >
        <AuthField
          label="Full Name"
          required
          autoComplete="name"
          placeholder="James Wilson"
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          placeholder="At least 8 characters with a symbol"
          error={errors.password?.message}
          {...register('password')}
        />
        <AuthField
          label="Confirm Password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>
            Gender<span style={{ color: ACCENT }}> *</span>
          </label>
          <select
            {...register('gender')}
            className="w-full px-4 py-3 text-sm outline-none transition-colors duration-200 appearance-none cursor-pointer"
            style={selectStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = ACCENT }}
            onBlur={(e) => { e.currentTarget.style.borderColor = LINE_STRONG }}
          >
            <option value="">Select gender</option>
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.gender?.message && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: ACCENT }}>
              {errors.gender.message}
            </p>
          )}
        </div>

        <AuthField
          label="Phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="9876500000"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <div>
          <label className="block text-xs uppercase tracking-widest mb-1.5" style={labelStyle}>
            Role<span style={{ color: ACCENT }}> *</span>
          </label>
          <select
            {...register('role')}
            className="w-full px-4 py-3 text-sm outline-none transition-colors duration-200 appearance-none cursor-pointer"
            style={selectStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = ACCENT }}
            onBlur={(e) => { e.currentTarget.style.borderColor = LINE_STRONG }}
          >
            <option value="">Select role</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.role?.message && (
            <p className="mt-1.5 text-xs font-medium" style={{ color: ACCENT }}>
              {errors.role.message}
            </p>
          )}
        </div>

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
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p
        className="text-center text-sm mt-6 font-light"
        style={{ color: FAINT }}
      >
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onSwitchMode?.('login')}
          className="font-semibold"
          style={{ color: ACCENT }}
        >
          Log in
        </button>
      </p>
    </div>
  )
}

export default Register