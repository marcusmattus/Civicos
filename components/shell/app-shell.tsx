'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { WifiOff } from 'lucide-react'
import { SESSION_WARNING_MS, useAuth } from '@/lib/auth/context'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
import { LoadingBlock } from '../ui/feedback'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

const SIDEBAR_STORAGE_KEY = 'civicos.sidebar-collapsed'

/** Warns before an idle session expires, and lets the user extend it. */
function SessionTimeoutDialog() {
  const { status, expiresAt, extendSession, signOut } = useAuth()
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (status !== 'signed_in' || !expiresAt) {
      setRemaining(null)
      return
    }
    const tick = () => {
      const left = expiresAt - Date.now()
      setRemaining(left <= SESSION_WARNING_MS ? Math.max(0, left) : null)
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [status, expiresAt])

  const open = remaining !== null
  const seconds = Math.ceil((remaining ?? 0) / 1000)

  return (
    <Dialog open={open} onOpenChange={(next) => !next && extendSession()}>
      <DialogContent>
        <DialogTitle className="text-base font-semibold">Your session is about to expire</DialogTitle>
        <DialogDescription className="mt-2 text-[13px] text-muted">
          For security, CivicOS signs you out after 30 minutes of inactivity. You will be signed out
          in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}.
        </DialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => signOut('user')}>Sign out now</Button>
          <Button variant="primary" onClick={extendSession}>
            Stay signed in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-warning-line bg-warning-tint px-4 py-2 text-[13px] text-warning-ink"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      You are offline. Changes are kept locally and will not be saved until the connection returns.
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { status, extendSession } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true')
    } catch {
      /* storage unavailable */
    }
  }, [])

  useEffect(() => {
    if (status === 'signed_out' || status === 'locked') router.replace('/login')
  }, [status, router])

  // Any interaction counts as activity against the idle timeout.
  useEffect(() => {
    if (status !== 'signed_in') return
    let last = 0
    const onActivity = () => {
      const now = Date.now()
      if (now - last < 60_000) return // throttle: at most one refresh a minute
      last = now
      extendSession()
    }
    window.addEventListener('pointerdown', onActivity)
    window.addEventListener('keydown', onActivity)
    return () => {
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
    }
  }, [status, extendSession])

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      } catch {
        /* storage unavailable */
      }
      return next
    })
  }

  if (status === 'loading') {
    return (
      <div className="flex h-dvh items-center justify-center">
        <LoadingBlock label="Restoring your session" />
      </div>
    )
  }

  if (status !== 'signed_in') {
    return (
      <div className="flex h-dvh items-center justify-center">
        <LoadingBlock label="Redirecting to sign in" />
      </div>
    )
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <a
        href="#main"
        className="sr-only-focusable absolute top-2 left-2 z-50 rounded-md bg-civic px-3 py-2 text-sm text-white"
      >
        Skip to main content
      </a>

      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default border-none bg-midnight/50 p-0"
          />
          <div className="relative h-full shadow-xl">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenDrawer={() => setDrawerOpen(true)} />
        <OfflineBanner />

        <main id="main" className="flex-1 overflow-auto bg-canvas p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        <footer className="flex shrink-0 items-center justify-between border-t border-line bg-surface px-4 py-2 text-[11px] tracking-[0.02em] text-faint lg:px-6">
          <span>SECURITY CLASSIFICATION: OFFICIAL</span>
          <span className="hidden sm:inline">
            Demonstration data — all figures are illustrative
          </span>
        </footer>
      </div>

      <SessionTimeoutDialog />
    </div>
  )
}
