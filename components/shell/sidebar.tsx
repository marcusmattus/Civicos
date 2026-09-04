'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { organisations } from '@/lib/data/catalogue'
import { navItems } from '@/lib/nav'
import { cn } from '../ui/utils'

export function SidebarBrand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      href="/command-centre"
      className="flex items-center gap-2.5 px-2 py-2 text-white no-underline hover:no-underline"
    >
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md bg-civic">
        <span className="h-[7px] w-[7px] rounded-full bg-white" />
      </span>
      {collapsed ? null : <span className="text-base font-semibold text-white">CivicOS</span>}
    </Link>
  )
}

export function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5 overflow-y-auto px-3">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm no-underline transition-colors hover:no-underline',
              collapsed && 'justify-center px-2',
              active
                ? 'bg-civic/[0.18] font-semibold text-white'
                : 'text-navy-soft hover:bg-white/5 hover:text-white',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar({
  collapsed = false,
  onToggle,
  onNavigate,
}: {
  collapsed?: boolean
  onToggle?: () => void
  onNavigate?: () => void
}) {
  const organisation = organisations[0]!

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-navy py-5 transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-sidebar',
      )}
    >
      <div className={cn('flex items-center justify-between px-3 pb-6', collapsed && 'flex-col gap-3')}>
        <SidebarBrand collapsed={collapsed} />
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className="rounded-md p-1.5 text-navy-muted hover:bg-white/5 hover:text-white"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      <SidebarNav collapsed={collapsed} onNavigate={onNavigate} />

      <div className="flex-1" />

      <div className="mx-3 border-t border-navy-line pt-3 text-xs text-navy-muted">
        {collapsed ? (
          <div className="text-center" title={organisation.name}>
            GLA
          </div>
        ) : (
          <>
            <div className="font-semibold text-white">{organisation.name}</div>
            <div>Clearance: {organisation.clearance}</div>
          </>
        )}
      </div>
    </div>
  )
}
