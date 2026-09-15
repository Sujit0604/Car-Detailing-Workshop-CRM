import { useState, useEffect } from 'react'
import { AuthContext } from './authContext'

const STORAGE_KEY = 'krom_auth'

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
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [auth])

  const login = (user, accessToken, refreshToken) =>
    setAuth({ user, accessToken, refreshToken })

  const logout = () => setAuth(null)

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