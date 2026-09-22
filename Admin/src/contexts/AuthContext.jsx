import { useState, useEffect } from 'react'
import { AuthContext } from './authContext'
import { logoutUser } from '../services/authApi'

const STORAGE_KEY = 'krom_admin_auth'

function getStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(getStoredAuth)

  useEffect(() => {
    const handleAuthUpdated = (event) => setAuth(event.detail)
    window.addEventListener('krom-admin-auth-updated', handleAuthUpdated)
    return () => window.removeEventListener('krom-admin-auth-updated', handleAuthUpdated)
  }, [])

  useEffect(() => {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [auth])

  const login = (user, accessToken, refreshToken) =>
    setAuth({ user, accessToken, refreshToken })

  const logout = () => {
    if (auth?.refreshToken) {
      logoutUser({ refreshToken: auth.refreshToken }).catch(() => {})
    }
    setAuth(null)
  }

  return (
    <AuthContext.Provider
      value={{
        auth,
        isAuthenticated: !!auth?.accessToken,
        user: auth?.user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}