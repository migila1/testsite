import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isDemoMode } from './lib/mode.js'
import { getSupabaseClient } from './lib/supabaseClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const authRequired = !isDemoMode()
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(!authRequired)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    if (!authRequired) return undefined
    const supabase = getSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [authRequired])

  const signIn = useCallback(async (email, password) => {
    setAuthError(null)
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthError(error.message)
      throw error
    }
  }, [])

  const signUp = useCallback(async (email, password) => {
    setAuthError(null)
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setAuthError(error.message)
      throw error
    }
  }, [])

  const signOut = useCallback(async () => {
    setAuthError(null)
    const supabase = getSupabaseClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      setAuthError(error.message)
      throw error
    }
  }, [])

  const value = useMemo(
    () => ({
      authRequired,
      authReady,
      user,
      authError,
      clearAuthError: () => setAuthError(null),
      signIn,
      signUp,
      signOut,
    }),
    [authRequired, authReady, user, authError, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth buiten AuthProvider')
  return ctx
}
