import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1',
})

let redirectingToLogin = false

api.interceptors.request.use((config) => {
  const isAuthEndpoint = config.url && config.url.startsWith('/auth/')
  if (isAuthEndpoint) return config
  try {
    const raw = localStorage.getItem('krom_auth')
    if (raw) {
      const { accessToken } = JSON.parse(raw)
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
    }
  } catch {
    /* ignore corrupted storage */
  }
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status = err.response?.status
    const hadAuthHeader = !!err.config?.headers?.Authorization
    const isAuthEndpoint = err.config?.url && err.config.url.startsWith('/auth/')

    if (status === 401 && hadAuthHeader && !isAuthEndpoint && !redirectingToLogin) {
      redirectingToLogin = true
      localStorage.removeItem('krom_auth')
      toast.error('Session expired. Please log in again.')
      setTimeout(() => {
        window.location.replace('/')
      }, 400)
    }

    const message =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong'
    return Promise.reject(new Error(message))
  },
)

export default api