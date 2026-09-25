import { useCallback, useEffect, useState } from 'react'
import { getMeApi, getToken, loginApi, logoutApi, removeToken, setToken, setUnauthorizedHandler } from '../api/client'
import { AuthContext } from './context'

export { AuthContext }

const USER_KEY = 'simkk_user'

function getSavedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

export function AuthProvider({ children }) {
  const initialSavedToken = getToken()
  const initialSavedUser = getSavedUser()

  const [user, setUser] = useState(() => (initialSavedToken ? initialSavedUser : null))
  const [token, setTokenState] = useState(() => initialSavedToken)
  // If we already have a valid cached token and user profile, render immediately (0ms blank screen)
  const [isLoading, setIsLoading] = useState(() => Boolean(initialSavedToken && !initialSavedUser))

  // Handle automatic logout on 401 responses
  useEffect(() => {
    setUnauthorizedHandler(() => {
      saveUser(null)
      setUser(null)
      setTokenState(null)
    })
  }, [])

  // Session restoration and verification on mount
  useEffect(() => {
    const savedToken = getToken()
    if (!savedToken) {
      return
    }

    getMeApi({ skipCache: true })
      .then((data) => {
        const currentUser = data?.user ?? data
        saveUser(currentUser)
        setUser(currentUser)
        setTokenState(savedToken)
      })
      .catch((error) => {
        // If 401 or invalid session, clear auth
        if (error.status === 401 || !initialSavedUser) {
          removeToken()
          saveUser(null)
          setUser(null)
          setTokenState(null)
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [initialSavedUser])

  const login = useCallback(async (email, password) => {
    const response = await loginApi(email, password)
    const receivedToken = response.token
    const receivedUser = response.user

    setToken(receivedToken)
    saveUser(receivedUser)
    setTokenState(receivedToken)
    setUser(receivedUser)

    return receivedUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // Even if network fails, clear local auth
    } finally {
      removeToken()
      saveUser(null)
      setUser(null)
      setTokenState(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMeApi({ skipCache: true })
      const currentUser = data?.user ?? data
      saveUser(currentUser)
      setUser(currentUser)
      return currentUser
    } catch (error) {
      if (error.status === 401) {
        removeToken()
        saveUser(null)
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
