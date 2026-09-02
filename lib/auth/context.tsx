'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Role, User } from '../types'
import { domainPermitted, firebaseConfigured } from './firebase'

export type AuthStatus = 'loading' | 'signed_out' | 'mfa_required' | 'signed_in' | 'locked'

export class AuthError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'AuthError'
  }
}

/** Idle limit shown in Settings as "Session timeout: 30 minutes". */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000
/** How long before expiry the warning dialog appears. */
export const SESSION_WARNING_MS = 2 * 60 * 1000

const STORAGE_KEY = 'civicos.session'

type StoredSession = { user: User; expiresAt: number }

type AuthValue = {
  status: AuthStatus
  user: User | null
  pendingEmail: string | null
  expiresAt: number | null
  usingFirebase: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithSso: () => Promise<void>
  verifyMfa: (code: string) => Promise<void>
  cancelMfa: () => void
  signOut: (reason?: 'user' | 'timeout') => void
  extendSession: () => void
  lastSignOutReason: 'user' | 'timeout' | null
}

const AuthContext = createContext<AuthValue | null>(null)

function readStored(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredSession
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

function writeStored(session: StoredSession | null) {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable — the session stays in memory only */
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/[\s.]+/).filter(Boolean)
  if (parts.length === 0) return 'CO'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

/** Demo role assignment so each role can be explored without a directory. */
function roleForEmail(email: string): Role {
  const local = email.split('@')[0]!.toLowerCase()
  if (local.includes('approver')) return 'approver'
  if (local.includes('auditor')) return 'auditor'
  if (local.includes('steward')) return 'data_steward'
  if (local.includes('developer')) return 'model_developer'
  if (local.includes('reviewer')) return 'policy_reviewer'
  if (local.includes('admin')) return 'administrator'
  return 'analyst'
}

function userFromEmail(email: string): User {
  const name = email
    .split('@')[0]!
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return {
    id: `usr-${email}`,
    email,
    name,
    initials: initials(name),
    role: roleForEmail(email),
    organisationId: 'org-gla',
    mfaEnabled: true,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [lastSignOutReason, setLastSignOutReason] = useState<'user' | 'timeout' | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore a session on mount so a refresh doesn't drop the user at login.
  useEffect(() => {
    const stored = readStored()
    if (stored) {
      setUser(stored.user)
      setExpiresAt(stored.expiresAt)
      setStatus('signed_in')
    } else {
      setStatus('signed_out')
    }
  }, [])

  const signOut = useCallback((reason: 'user' | 'timeout' = 'user') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    writeStored(null)
    setUser(null)
    setExpiresAt(null)
    setPendingEmail(null)
    setLastSignOutReason(reason)
    setStatus('signed_out')
  }, [])

  const establish = useCallback((next: User) => {
    const session = { user: next, expiresAt: Date.now() + SESSION_TIMEOUT_MS }
    writeStored(session)
    setUser(next)
    setExpiresAt(session.expiresAt)
    setPendingEmail(null)
    setLastSignOutReason(null)
    setStatus('signed_in')
  }, [])

  const extendSession = useCallback(() => {
    setUser((current) => {
      if (!current) return current
      const session = { user: current, expiresAt: Date.now() + SESSION_TIMEOUT_MS }
      writeStored(session)
      setExpiresAt(session.expiresAt)
      return current
    })
  }, [])

  // Expire the session on the deadline rather than polling for idleness.
  useEffect(() => {
    if (status !== 'signed_in' || !expiresAt) return
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) {
      signOut('timeout')
      return
    }
    timeoutRef.current = setTimeout(() => signOut('timeout'), remaining)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [status, expiresAt, signOut])

  const signIn = useCallback(async (email: string, password: string) => {
    const normalised = email.trim().toLowerCase()

    if (!domainPermitted(normalised)) {
      throw new AuthError(
        'domain_not_permitted',
        'Sign-in is restricted to authorised public-sector and research domains.',
      )
    }

    if (firebaseConfigured()) {
      const { signInWithEmailAndPassword } = await import('firebase/auth')
      const { firebaseAuth } = await import('./firebase')
      try {
        await signInWithEmailAndPassword(firebaseAuth(), normalised, password)
      } catch (error) {
        const code = (error as { code?: string }).code ?? 'auth/failed'
        if (code === 'auth/too-many-requests') {
          setStatus('locked')
          throw new AuthError('account_locked', 'This account is temporarily locked after repeated failed attempts.')
        }
        throw new AuthError(code, 'Check your email address and password and try again.')
      }
      setPendingEmail(normalised)
      setStatus('mfa_required')
      return
    }

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalised, password }),
    })

    if (response.status === 423) {
      setStatus('locked')
      const body = (await response.json()) as { error: string }
      throw new AuthError('account_locked', body.error)
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null
      throw new AuthError('sign_in_failed', body?.error ?? 'Check your email address and password and try again.')
    }

    setPendingEmail(normalised)
    setStatus('mfa_required')
  }, [])

  const signInWithSso = useCallback(async () => {
    if (firebaseConfigured()) {
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
      const { firebaseAuth } = await import('./firebase')
      const provider = new GoogleAuthProvider()
      // Government SSO: swap GoogleAuthProvider for the OIDC/SAML provider id
      // issued by the identity provider, e.g. new OAuthProvider('oidc.gov-sso').
      const credential = await signInWithPopup(firebaseAuth(), provider)
      const email = credential.user.email ?? 'sso.user@gov.uk'
      if (!domainPermitted(email)) {
        throw new AuthError('domain_not_permitted', 'That directory account is not authorised for CivicOS.')
      }
      establish(userFromEmail(email))
      return
    }

    // Demo SSO: the identity provider is assumed to have asserted MFA already.
    establish(userFromEmail('j.delacroix@london.gov.uk'))
  }, [establish])

  const verifyMfa = useCallback(
    async (code: string) => {
      if (!pendingEmail) throw new AuthError('no_pending_sign_in', 'Start again from the sign-in screen.')
      if (!/^\d{6}$/.test(code)) {
        throw new AuthError('invalid_code', 'Enter the 6-digit code from your authenticator app.')
      }
      // Reserved code demonstrates the rejection path.
      if (code === '000000') {
        throw new AuthError('invalid_code', 'That code was not recognised. Check your authenticator and try again.')
      }
      establish(userFromEmail(pendingEmail))
    },
    [pendingEmail, establish],
  )

  const cancelMfa = useCallback(() => {
    setPendingEmail(null)
    setStatus('signed_out')
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      status,
      user,
      pendingEmail,
      expiresAt,
      usingFirebase: firebaseConfigured(),
      signIn,
      signInWithSso,
      verifyMfa,
      cancelMfa,
      signOut,
      extendSession,
      lastSignOutReason,
    }),
    [
      status,
      user,
      pendingEmail,
      expiresAt,
      signIn,
      signInWithSso,
      verifyMfa,
      cancelMfa,
      signOut,
      extendSession,
      lastSignOutReason,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider')
  return ctx
}
