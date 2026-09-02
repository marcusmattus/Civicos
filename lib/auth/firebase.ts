import type { FirebaseApp } from 'firebase/app'
import { getApp, getApps, initializeApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import { getAuth } from 'firebase/auth'

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

/**
 * Firebase is optional. With no config the app runs in demo mode against the
 * mock auth provider, so `npm run dev` works with zero setup.
 */
export function firebaseConfigured(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)
}

export function firebaseApp(): FirebaseApp {
  if (!firebaseConfigured()) {
    throw new Error('Firebase is not configured — check NEXT_PUBLIC_FIREBASE_* environment variables')
  }
  return getApps().length ? getApp() : initializeApp(config as Required<typeof config>)
}

export function firebaseAuth(): Auth {
  return getAuth(firebaseApp())
}

/** Domains permitted to sign in, e.g. "gov.uk,london.gov.uk". */
export function allowedDomains(): string[] {
  return (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
}

export function domainPermitted(email: string): boolean {
  const domains = allowedDomains()
  if (domains.length === 0) return true
  const lower = email.toLowerCase()
  return domains.some((domain) => lower.endsWith(`@${domain}`) || lower.endsWith(`.${domain}`))
}
