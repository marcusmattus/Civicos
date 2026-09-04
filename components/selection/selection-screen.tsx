'use client'

import { ArrowRight, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { geographies, industries, policyInstruments } from '@/lib/data/catalogue'
import { useWorkspace } from '@/lib/store/workspace'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { cn } from '../ui/utils'
import { SelectionGraph } from './selection-graph'

function SelectableCard({
  name,
  description,
  meta,
  selected,
  onToggle,
}: {
  name: string
  description: string
  meta?: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        'flex h-full flex-col rounded-lg border p-4 text-left transition-colors',
        selected
          ? 'border-civic bg-civic-tint shadow-[0_0_0_1px_var(--color-civic)]'
          : 'border-line bg-surface hover:border-line-strong',
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{name}</span>
        <span
          aria-hidden="true"
          className={cn(
            'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border-[1.5px]',
            selected ? 'border-civic bg-civic text-white' : 'border-line-strong bg-surface',
          )}
        >
          {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
        </span>
      </span>
      <span className="mt-1.5 text-xs text-muted">{description}</span>
      {meta ? <span className="mt-2 text-xs text-faint">{meta}</span> : null}
    </button>
  )
}

export function SelectionScreen() {
  const router = useRouter()
  const workspace = useWorkspace()
  const geography = geographies.find((g) => g.slug === workspace.geographySlug)

  const canContinue = workspace.industrySlugs.length > 0 && workspace.instrumentSlugs.length > 0

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold sm:text-[28px] sm:leading-9">
          Select industries and policy instruments
        </h1>
        <p className="mt-1 text-muted">
          Choose the sectors to model in {geography?.name ?? workspace.geographySlug} and the levers
          government can pull. Selections become connected nodes on the model canvas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section aria-labelledby="industries-heading">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="industries-heading" className="text-base font-semibold">
                Industries
              </h2>
              <span className="text-[13px] text-muted">
                {workspace.industrySlugs.length} of {industries.length} selected
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {industries.map((industry) => (
                <SelectableCard
                  key={industry.id}
                  name={industry.name}
                  description={industry.description}
                  meta={`${industry.models} models · ${industry.datasets} datasets`}
                  selected={workspace.industrySlugs.includes(industry.slug)}
                  onToggle={() => workspace.toggleIndustry(industry.slug)}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="instruments-heading">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="instruments-heading" className="text-base font-semibold">
                Policy instruments
              </h2>
              <span className="text-[13px] text-muted">
                {workspace.instrumentSlugs.length} of {policyInstruments.length} selected
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {policyInstruments.map((instrument) => (
                <SelectableCard
                  key={instrument.id}
                  name={instrument.name}
                  description={instrument.description}
                  meta={`Unlocks ${instrument.levers.length} lever${instrument.levers.length === 1 ? '' : 's'}`}
                  selected={workspace.instrumentSlugs.includes(instrument.slug)}
                  onToggle={() => workspace.toggleInstrument(instrument.slug)}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-0 xl:self-start">
          <Card className="p-4">
            <h2 className="text-sm font-semibold">Connected system</h2>
            <p className="mt-1 mb-3 text-xs text-muted">
              How your selection connects geography, sectors and levers.
            </p>
            <SelectionGraph
              geographyLabel={geography?.name ?? workspace.geographySlug}
              industrySlugs={workspace.industrySlugs}
              instrumentSlugs={workspace.instrumentSlugs}
            />
          </Card>

          {!canContinue ? (
            <p role="status" className="mt-3 text-[13px] text-warning-ink">
              Select at least one industry and one policy instrument to continue.
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="primary"
              size="lg"
              disabled={!canContinue}
              onClick={() => router.push('/model')}
              className="gap-1.5"
            >
              Continue to model canvas
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button onClick={() => router.push('/command-centre')}>Back to Command Centre</Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
