'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AtSign, Banknote, CalendarRange, MapPin, Mic, Paperclip, Scale, Send, SlidersHorizontal } from 'lucide-react'
import { geographies } from '@/lib/data/catalogue'
import {
  activeReferenceQuery,
  insertReference,
  resolveReferences,
  searchReferences,
  unknownReferences,
} from '@/lib/engine/references'
import type { Reference } from '@/lib/types'
import { Button } from '../ui/button'
import { cn } from '../ui/utils'
import { KIND_ICON, ReferenceChip } from './reference-chip'

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  geographySlug: string
  onGeographyChange: (slug: string) => void
  baselineYear: number
  endYear: number
  onHorizonChange: (baselineYear: number, endYear: number) => void
  budgetBn: number
  onBudgetChange: (bn: number) => void
  submitting?: boolean
}

/** Popover-style control used by the geography / horizon / budget actions. */
function ComposerControl({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof MapPin
  label: string
  value: string
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${label}: ${value}`}
        className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] text-ink hover:bg-canvas"
      >
        <Icon className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
        <span className="hidden sm:inline">{label}:</span>
        <span className="font-medium">{value}</span>
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-md border border-line bg-surface p-3 shadow-lg">
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  )
}

export function PromptComposer({
  value,
  onChange,
  onSubmit,
  geographySlug,
  onGeographyChange,
  baselineYear,
  endYear,
  onHorizonChange,
  budgetBn,
  onBudgetChange,
  submitting,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [menu, setMenu] = useState<{ query: string; start: number } | null>(null)
  const [highlight, setHighlight] = useState(0)

  const suggestions = useMemo(() => (menu ? searchReferences(menu.query) : []), [menu])
  const chips = useMemo(() => resolveReferences(value), [value])
  const unknown = useMemo(() => unknownReferences(value), [value])
  const geography = geographies.find((g) => g.slug === geographySlug)

  useEffect(() => setHighlight(0), [menu?.query])

  function syncMenu(text: string, caret: number) {
    setMenu(activeReferenceQuery(text, caret))
  }

  function choose(reference: Reference) {
    const textarea = textareaRef.current
    if (!textarea || !menu) return
    const caret = textarea.selectionStart ?? value.length
    const next = insertReference(value, menu.start, caret, reference)
    onChange(next.text)
    setMenu(null)
    // Restore the caret after React re-renders the textarea.
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(next.caret, next.caret)
    })
  }

  function removeChip(reference: Reference) {
    const token = `@${reference.kind}/${reference.slug}`
    onChange(value.replace(new RegExp(`\\s?${token}\\b`, 'g'), '').replace(/\s{2,}/g, ' ').trim())
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (menu && suggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlight((h) => (h + 1) % suggestions.length)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length)
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        const picked = suggestions[highlight]
        if (picked) choose(picked)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenu(null)
        return
      }
    }

    // ⌘/Ctrl-Enter submits from anywhere in the composer.
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="rounded-lg border border-civic-ring bg-surface p-4 shadow-[0_0_0_3px_rgba(37,99,235,0.08)] sm:p-5">
      <label htmlFor="composer" className="sr-only">
        Describe the public system you want to model
      </label>

      <div className="relative">
        <textarea
          id="composer"
          ref={textareaRef}
          value={value}
          rows={3}
          onChange={(e) => {
            onChange(e.target.value)
            syncMenu(e.target.value, e.target.selectionStart ?? 0)
          }}
          onClick={(e) => syncMenu(value, e.currentTarget.selectionStart ?? 0)}
          onKeyUp={(e) => syncMenu(value, e.currentTarget.selectionStart ?? 0)}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setMenu(null), 120)}
          placeholder="Describe the system to model. Type @ to reference an industry, policy, dataset, model, geography or metric."
          aria-describedby="composer-hint"
          aria-autocomplete="list"
          aria-expanded={Boolean(menu)}
          aria-controls={menu ? 'reference-menu' : undefined}
          className="w-full resize-none border-none bg-transparent text-base leading-7 text-ink outline-none placeholder:text-faint"
        />

        {menu ? (
          <ul
            id="reference-menu"
            role="listbox"
            aria-label="Insert reference"
            className="absolute top-full left-0 z-30 mt-1 max-h-72 w-full max-w-md overflow-y-auto rounded-md border border-line bg-surface p-1 shadow-lg"
          >
            {suggestions.length === 0 ? (
              <li className="px-3 py-3 text-[13px] text-muted">
                No reference matches “{menu.query}”.
              </li>
            ) : (
              suggestions.map((reference, i) => {
                const Icon = KIND_ICON[reference.kind]
                return (
                  <li key={reference.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === highlight}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => choose(reference)}
                      className={cn(
                        'flex w-full items-start gap-2.5 rounded px-2.5 py-2 text-left',
                        i === highlight ? 'bg-civic-tint' : 'hover:bg-canvas',
                      )}
                    >
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium text-ink">
                          {reference.label}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          @{reference.kind}/{reference.slug} · {reference.description}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        ) : null}
      </div>

      {chips.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line-soft pt-3">
          {chips.map((reference) => (
            <ReferenceChip
              key={reference.id}
              reference={reference}
              onRemove={() => removeChip(reference)}
            />
          ))}
        </div>
      ) : null}

      {unknown.length > 0 ? (
        <p role="status" className="mt-2 text-xs text-warning-ink">
          Not in the catalogue: {unknown.join(', ')} — these will be ignored.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" className="gap-1.5">
          <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
          Attach data
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => {
            onChange(`${value.trimEnd()} @policy/`)
            textareaRef.current?.focus()
          }}
        >
          <Scale className="h-3.5 w-3.5" aria-hidden="true" />
          Add policy
        </Button>
        <Button size="sm" className="gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
          Add constraint
        </Button>

        <ComposerControl icon={MapPin} label="Geography" value={geography?.name ?? geographySlug}>
          {(close) => (
            <ul className="space-y-0.5">
              {geographies.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onGeographyChange(g.slug)
                      close()
                    }}
                    className={cn(
                      'w-full rounded px-2 py-1.5 text-left text-[13px] hover:bg-canvas',
                      g.slug === geographySlug && 'bg-civic-tint text-civic-deep',
                    )}
                  >
                    {g.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ComposerControl>

        <ComposerControl
          icon={CalendarRange}
          label="Horizon"
          value={`${baselineYear}–${endYear}`}
        >
          {() => (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-ink">
                Baseline year
                <input
                  type="number"
                  min={2020}
                  max={2050}
                  value={baselineYear}
                  onChange={(e) => onHorizonChange(Number(e.target.value), endYear)}
                  className="mt-1 h-9 w-full rounded-md border border-line px-2 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-ink">
                End year
                <input
                  type="number"
                  min={2021}
                  max={2060}
                  value={endYear}
                  onChange={(e) => onHorizonChange(baselineYear, Number(e.target.value))}
                  className="mt-1 h-9 w-full rounded-md border border-line px-2 text-sm"
                />
              </label>
            </div>
          )}
        </ComposerControl>

        <ComposerControl icon={Banknote} label="Budget" value={`£${budgetBn}bn`}>
          {() => (
            <label className="block text-xs font-medium text-ink">
              Envelope (£bn)
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={budgetBn}
                onChange={(e) => onBudgetChange(Number(e.target.value))}
                className="mt-1 h-9 w-full rounded-md border border-line px-2 text-sm"
              />
            </label>
          )}
        </ComposerControl>

        <Button size="sm" className="gap-1.5" disabled title="Voice input is not available in this build">
          <Mic className="h-3.5 w-3.5" aria-hidden="true" />
          Voice
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <span id="composer-hint" className="hidden text-xs text-faint sm:inline">
            <AtSign className="mr-1 inline h-3 w-3" aria-hidden="true" />
            references · ⌘↵ to create
          </span>
          <Button
            variant="primary"
            className="gap-1.5"
            onClick={onSubmit}
            disabled={submitting || value.trim().length < 10}
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            {submitting ? 'Creating…' : 'Create simulation'}
          </Button>
        </div>
      </div>
    </div>
  )
}
