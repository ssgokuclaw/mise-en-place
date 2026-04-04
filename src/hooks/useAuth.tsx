// ============================================================
// hooks/useAuth.tsx — Authentication context and hook
// ============================================================
// React "Context" lets you share data across your entire component
// tree without passing props through every level. Here we use it
// to make the current user available anywhere in the app.
//
// Usage in any component:
//   const { user, signOut, loading } = useAuth()
// ============================================================

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

// ============================================================
// Define the shape of what the auth context provides
// ============================================================
interface AuthContextType {
  user: User | null        // null = not logged in
  loading: boolean         // true while we're checking session on page load
  signOut: () => Promise<void>
}

// Create the context with a default value.
// The "as" cast is safe here because we always provide a real value below.
const AuthContext = createContext<AuthContextType>({} as AuthContextType)

// ============================================================
// AuthProvider — wrap your app with this to enable auth
// ============================================================
// This component:
//   1. Checks if there's an existing session on mount (page load)
//   2. Listens for auth state changes (login, logout, token refresh)
//   3. Makes the user object available via useAuth()
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for an existing session (e.g. user refreshed the page)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Subscribe to auth changes.
    // This fires whenever the user logs in, logs out, or their token refreshes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Cleanup: unsubscribe when the component unmounts
    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================
// useAuth — the hook components use to access auth state
// ============================================================
export function useAuth() {
  return useContext(AuthContext)
}
