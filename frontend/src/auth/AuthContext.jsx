import { useCallback, useEffect, useState } from 'react'
import { getMeApi, getToken, loginApi, logoutApi, removeToken, setToken, setUnauthorizedHandler } from '../api/client'
import { AuthContext } from './context'

export { AuthContext }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setTokenState] = useState(() => getToken())
  // If no token exists at start, we are not loading session restoration
  const [isLoading, setIsLoading] = useState(() => Boolean(getToken()))

  // Handle automatic logout on 401 responses
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setTokenState(null)
    })
  }, [])

  // Session restoration on mount
  useEffect(() => {
    const savedToken = getToken()
    if (!savedToken) {
      return
    }

    getMeApi()
      .then((data) => {
        const currentUser = data?.user ?? data
        setUser(currentUser)
        setTokenState(savedToken)
      })
      .catch(() => {
        removeToken()
        setUser(null)
        setTokenState(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const login = useCallback(async (email, password) => {
    const response = await loginApi(email, password)
    const receivedToken = response.token
    const receivedUser = response.user

    setToken(receivedToken)
    setTokenState(receivedToken)
    setUser(receivedUser)

    return receivedUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // Even if network or token is already invalid, clear local auth
    } finally {
      removeToken()
      setUser(null)
      setTokenState(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMeApi()
      const currentUser = data?.user ?? data
      setUser(currentUser)
      return currentUser
    } catch (error) {
      if (error.status === 401) {
        removeToken()
        setUser(null)
        setTokenState(null)
      }
      throw error
    }
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
