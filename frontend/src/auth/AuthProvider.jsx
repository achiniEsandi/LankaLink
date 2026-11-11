import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './useAuth'

const STORAGE_KEY = 'lankalink.auth'

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { token: null, user: null }
  } catch {
    return { token: null, user: null }
  }
}

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession)

  const signIn = useCallback((token, user) => {
    const next = { token, user }
    setSession(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage unavailable (private mode); the session just won't survive a reload
    }
  }, [])

  const signOut = useCallback(() => {
    setSession({ token: null, user: null })
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing to clear
    }
  }, [])

  const value = useMemo(() => ({ ...session, signIn, signOut }), [session, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
