import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { breadcrumbFor, navItems } from '../app/nav'
import { organisation, viewer } from '../data/civic'
import { cx } from './ui'

function Logo({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const box = size === 'lg' ? 'h-7 w-7' : 'h-[26px] w-[26px]'
  const dot = size === 'lg' ? 'h-2 w-2' : 'h-[7px] w-[7px]'
  const text = size === 'lg' ? 'text-lg' : 'text-base'
  return (
    <div className="flex items-center gap-2.5">
      <div className={cx('flex shrink-0 items-center justify-center rounded-md bg-brand', box)}>
        <div className={cx('rounded-full bg-white', dot)} />
      </div>
      <div className={cx('font-semibold tracking-[-0.01em] text-white', text)}>CivicOS</div>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full w-56 shrink-0 flex-col bg-navy-800 px-3 py-5">
      <div className="px-2 pt-2 pb-6">
        <Logo />
      </div>

      <nav className="flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-brand/[0.18] font-semibold text-white'
                  : 'text-navy-100 hover:bg-white/5 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: isActive ? item.dot : '#3a5a80' }}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex-1" />

      <div className="border-t border-navy-700 p-3 text-xs text-navy-200">
        <div className="mb-0.5 font-semibold text-white">{organisation.name}</div>
        <div>{organisation.clearance}</div>
      </div>
    </div>
  )
}

function MenuIcon() {
  return (
    <span className="flex h-4 w-5 flex-col justify-between" aria-hidden="true">
      <span className="h-0.5 w-full rounded-full bg-ink" />
      <span className="h-0.5 w-full rounded-full bg-ink" />
      <span className="h-0.5 w-full rounded-full bg-ink" />
    </span>
  )
}

export default function AppShell() {
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [location.pathname])

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      {/* Persistent sidebar from lg up */}
      <div className="hidden lg:block">
        <SidebarContent />
      </div>

      {/* Off-canvas drawer below lg */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 h-full w-full cursor-default border-none bg-navy-900/50 p-0"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative h-full shadow-xl">
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line bg-surface lg:hidden"
          >
            <MenuIcon />
          </button>

          <div className="min-w-0 truncate text-sm text-ink-muted">{breadcrumbFor(location.pathname)}</div>

          <div className="mx-4 hidden max-w-[420px] flex-1 md:mx-8 md:block">
            <input
              type="search"
              placeholder="Search simulations, datasets, policies..."
              aria-label="Search"
              className="h-9 w-full rounded-md border border-line bg-canvas px-3.5 text-[13px] outline-none focus:border-brand-ring"
            />
          </div>

          <div className="ml-auto flex items-center gap-5 text-[13px] text-ink-muted">
            <button type="button" className="hidden cursor-pointer border-none bg-transparent p-0 text-inherit hover:text-ink xl:block">
              Notifications
            </button>
            <button type="button" className="hidden cursor-pointer border-none bg-transparent p-0 text-inherit hover:text-ink xl:block">
              Help
            </button>
            <div
              title={viewer.name}
              className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-brand-tint-strong text-xs font-semibold text-brand-link"
            >
              {viewer.initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
