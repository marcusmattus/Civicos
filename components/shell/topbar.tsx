'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChevronDown, HelpCircle, Menu, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth/context'
import { ROLE_LABELS } from '@/lib/types'
import { organisations } from '@/lib/data/catalogue'
import { breadcrumbFor } from '@/lib/nav'
import { Badge } from '../ui/badge'
import { cn } from '../ui/utils'
import { GlobalSearch } from './global-search'

function Breadcrumbs() {
  const pathname = usePathname()
  const crumbs = breadcrumbFor(pathname)

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
        {crumbs.map((crumb, i) => (
          <li key={`${crumb}-${i}`} className="flex min-w-0 items-center gap-1.5">
            {i > 0 ? (
              <span aria-hidden="true" className="text-line-strong">
                /
              </span>
            ) : null}
            <span
              className={cn('truncate capitalize', i === crumbs.length - 1 && 'text-ink')}
              aria-current={i === crumbs.length - 1 ? 'page' : undefined}
            >
              {crumb}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function OrganisationSelector() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(organisations[0]!)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-[13px] text-ink hover:bg-canvas"
      >
        <span className="max-w-[170px] truncate">{selected.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Organisation"
          className="absolute right-0 z-40 mt-1 w-64 rounded-md border border-line bg-surface p-1 shadow-lg"
        >
          {organisations.map((org) => (
            <li key={org.id}>
              <button
                type="button"
                role="option"
                aria-selected={org.id === selected.id}
                onClick={() => {
                  setSelected(org)
                  setOpen(false)
                }}
                className={cn(
                  'w-full rounded px-2.5 py-2 text-left text-[13px] hover:bg-canvas',
                  org.id === selected.id && 'bg-civic-tint text-civic-deep',
                )}
              >
                <div className="font-medium">{org.name}</div>
                <div className="text-xs text-muted">{org.clearance}</div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${user.name}`}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-civic-tint-strong text-xs font-semibold text-civic-link hover:bg-civic-ring"
      >
        {user.initials}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 w-64 rounded-md border border-line bg-surface p-1 shadow-lg"
        >
          <div className="border-b border-line-soft px-3 py-2.5">
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="truncate text-xs text-muted">{user.email}</div>
            <Badge tone="info" className="mt-2">
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded px-3 py-2 text-[13px] text-ink no-underline hover:bg-canvas hover:no-underline"
          >
            Settings
          </Link>
          <Link
            href="/governance"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded px-3 py-2 text-[13px] text-ink no-underline hover:bg-canvas hover:no-underline"
          >
            Roles &amp; permissions
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => signOut('user')}
            className="w-full rounded px-3 py-2 text-left text-[13px] text-ink hover:bg-canvas"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function Topbar({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const [searchOpen, setSearchOpen] = useState(false)

  // ⌘K / Ctrl-K opens global search from anywhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="flex h-topbar shrink-0 items-center gap-3 border-b border-line bg-surface px-4 lg:px-6">
      <button
        type="button"
        onClick={onOpenDrawer}
        aria-label="Open navigation"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line lg:hidden"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </button>

      <Breadcrumbs />

      <div className="mx-auto hidden w-full max-w-md md:block">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-9 w-full items-center gap-2 rounded-md border border-line bg-canvas px-3 text-left text-[13px] text-faint hover:border-line-strong"
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="flex-1">Search simulations, datasets, policies…</span>
          <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-muted">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2 md:gap-3">
        <OrganisationSelector />
        <button
          type="button"
          aria-label="Notifications — 2 unread"
          className="relative hidden h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-canvas hover:text-ink sm:flex"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-warning" />
        </button>
        <Link
          href="/governance"
          aria-label="Help and governance"
          className="hidden h-9 w-9 items-center justify-center rounded-md text-muted no-underline hover:bg-canvas hover:text-ink hover:no-underline sm:flex"
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
        </Link>
        <UserMenu />
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
