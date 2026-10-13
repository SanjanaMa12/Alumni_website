import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client.js'

const AuthContext = createContext(null)

// Login is passwordless: request a code by email, then verify it.
// The server answers a successful verify with a JWT in an httpOnly cookie,
// so the token itself never passes through JavaScript.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const requestLoginCode = useCallback((email, role) => api.post('/auth/login/otp', { email, role }), [])

  const verifyLogin = useCallback(async (email, role, code) => {
    const data = await api.post('/auth/login/verify', { email, role, code })
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {})
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, requestLoginCode, verifyLogin, logout, setUser }),
    [user, loading, requestLoginCode, verifyLogin, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
