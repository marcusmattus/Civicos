import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type SessionValue = {
  signedIn: boolean
  signIn: () => void
  signOut: () => void
}

const SessionContext = createContext<SessionValue | null>(null)

/**
 * Sign-in is mock-only, but it is persisted for the tab so a refresh or a deep
 * link into a screen doesn't bounce the user back to the login form.
 */
const STORAGE_KEY = 'civicos.signedIn'

function readStoredSession(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function writeStoredSession(value: boolean) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, 'true')
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable (private mode, blocked cookies) — session stays in memory.
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(readStoredSession)

  const signIn = useCallback(() => {
    writeStoredSession(true)
    setSignedIn(true)
  }, [])

  const signOut = useCallback(() => {
    writeStoredSession(false)
    setSignedIn(false)
  }, [])

  const value = useMemo(() => ({ signedIn, signIn, signOut }), [signedIn, signIn, signOut])
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside a SessionProvider')
  return ctx
}
