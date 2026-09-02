'use client'

import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { datasets, industries, modelCards, policyInstruments } from '@/lib/data/catalogue'
import { demoSimulation, companionSimulations } from '@/lib/data/demo'
import { navItems } from '@/lib/nav'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { cn } from '../ui/utils'

type Hit = { id: string; label: string; group: string; href: Route }

function catalogue(): Hit[] {
  const simulations = [demoSimulation(), ...companionSimulations()]
  return [
    ...navItems.map<Hit>((n) => ({ id: `nav-${n.href}`, label: n.label, group: 'Navigate', href: n.href })),
    ...simulations.map<Hit>((s) => ({
      id: s.id,
      label: s.title,
      group: 'Simulations',
      href: '/results' as Route,
    })),
    ...datasets.map<Hit>((d) => ({
      id: d.id,
      label: d.name,
      group: 'Datasets',
      href: `/datasets/${d.id}` as Route,
    })),
    ...modelCards.map<Hit>((m) => ({ id: m.id, label: m.name, group: 'Models', href: '/models' as Route })),
    ...industries.map<Hit>((i) => ({
      id: i.id,
      label: i.name,
      group: 'Industries',
      href: '/industries' as Route,
    })),
    ...policyInstruments.map<Hit>((p) => ({
      id: p.id,
      label: p.name,
      group: 'Policy instruments',
      href: '/industries/select' as Route,
    })),
  ]
}

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const all = useMemo(catalogue, [])

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return all.slice(0, 8)
    return all.filter((hit) => hit.label.toLowerCase().includes(q)).slice(0, 12)
  }, [all, query])

  function go(hit: Hit) {
    onOpenChange(false)
    setQuery('')
    router.push(hit.href)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[15%] max-w-xl translate-y-0 p-0">
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <DialogDescription className="sr-only">
          Search simulations, datasets, models and policies
        </DialogDescription>

        <div className="flex items-center gap-2 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && hits[0]) go(hits[0])
            }}
            placeholder="Search simulations, datasets, policies…"
            aria-label="Search"
            className="border-none px-0 focus:border-none"
          />
        </div>

        <ul role="listbox" aria-label="Search results" className="max-h-80 overflow-y-auto p-2">
          {hits.length === 0 ? (
            <li className="px-3 py-6 text-center text-[13px] text-muted">
              No matches for “{query}”.
            </li>
          ) : (
            hits.map((hit, i) => (
              <li key={hit.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={i === 0}
                  onClick={() => go(hit)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-[13px] hover:bg-canvas',
                  )}
                >
                  <span className="truncate text-ink">{hit.label}</span>
                  <span className="shrink-0 text-xs text-faint">{hit.group}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
