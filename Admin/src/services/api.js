import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1'

const api = axios.create({ baseURL: BASE_URL })

const STORAGE_KEY = 'krom_admin_auth'

function readAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeAuth(auth) {
  if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  else localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('krom-admin-auth-updated', { detail: auth }))
}

let isRefreshing = false
let refreshWaiters = []

api.interceptors.request.use((config) => {
  const isAuthEndpoint = config.url && config.url.startsWith('/auth/')
  if (isAuthEndpoint) return config
  const auth = readAuth()
  if (auth?.accessToken) config.headers.Authorization = `Bearer ${auth.accessToken}`
  return config
})

async function refreshTokens() {
  const auth = readAuth()
  if (!auth?.refreshToken) {
    throw new Error('No refresh token available')
  }
  const res = await axios.post(`${BASE_URL}/auth/refresh`, {
    refreshToken: auth.refreshToken,
  })
  const body = res.data
  const next = {
    ...auth,
    user: body?.data?.user || auth.user,
    accessToken: body?.data?.accessToken,
    refreshToken: body?.data?.refreshToken || auth.refreshToken,
  }
  writeAuth(next)
  return next
}

function settleWaiters(next, error) {
  refreshWaiters.forEach((waiter) => waiter(next, error))
  refreshWaiters = []
}

function sessionExpired() {
  writeAuth(null)
  toast.error('Session expired. Please log in again.')
  setTimeout(() => {
    window.location.replace('/')
  }, 400)
}

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (axios.isCancel(err)) return Promise.reject(err)

    const status = err.response?.status
    const config = err.config || {}
    const hadAuthHeader = !!config.headers?.Authorization
    const isAuthEndpoint = config.url && config.url.startsWith('/auth/')

    if (status === 401 && hadAuthHeader && !isAuthEndpoint && !config._retry) {
      const auth = readAuth()

      if (!auth?.refreshToken) {
        sessionExpired()
        return Promise.reject(new Error('Session expired'))
      }

      if (!isRefreshing) {
        isRefreshing = true
        refreshTokens()
          .then((next) => {
            isRefreshing = false
            settleWaiters(next, null)
          })
          .catch((error) => {
            isRefreshing = false
            settleWaiters(null, error)
            sessionExpired()
          })
      }

      return new Promise((resolve, reject) => {
        refreshWaiters.push((next, error) => {
          if (error) return reject(error)
          api({
            ...config,
            headers: { ...config.headers, Authorization: `Bearer ${next.accessToken}` },
            _retry: true,
          }).then(resolve, reject)
        })
      })
    }

    if (status === 401 && config._retry) {
      sessionExpired()
      return Promise.reject(new Error('Session expired'))
    }

    const data = err.response?.data
    const validationDetail =
      Array.isArray(data?.errors) && data.errors.length > 0
        ? typeof data.errors[0] === 'string'
          ? data.errors[0]
          : data.errors[0]?.message
        : null
    const message =
      validationDetail ||
      data?.message ||
      err.message ||
      'Something went wrong'
    return Promise.reject(new Error(message))
  },
)

export default api