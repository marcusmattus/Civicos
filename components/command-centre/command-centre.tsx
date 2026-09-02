'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api, ApiError } from '@/lib/client/api'
import { selectionsFromPrompt } from '@/lib/engine/references'
import { relativeTime } from '@/lib/format'
import { useWorkspace } from '@/lib/store/workspace'
import { SimulationStatusBadge } from '../status'
import { Card } from '../ui/card'
import { ErrorState, Skeleton } from '../ui/feedback'
import { PromptComposer } from './prompt-composer'

/** Starter prompts from the product spec, written with structured references. */
const STARTERS = [
  {
    title: 'Optimise a £500m public budget',
    prompt:
      'Optimise a £500m budget across @industry/healthcare, @industry/transport and @industry/education in @geography/greater-london, maximising @metric/public-service-access.',
  },
  {
    title: 'Compare autonomous-cab regulations',
    prompt:
      'Compare @policy/licensing and @policy/regulation options for autonomous cabs in @geography/greater-london and their effect on @metric/congestion and @metric/average-cab-fare.',
  },
  {
    title: 'Forecast healthcare demand',
    prompt:
      'Forecast @industry/healthcare demand against capacity in @geography/greater-london using @dataset/nhs-capacity and @model/healthcare-demand.',
  },
  {
    title: 'Assess universal basic income',
    prompt:
      'Assess a @policy/ubi for @geography/greater-london and its effect on @metric/ubi-funding-gap and @metric/jobs-changed.',
  },
  {
    title: 'Test farming resilience',
    prompt:
      'Test @industry/agriculture resilience to supply shocks across the @geography/united-kingdom with @policy/subsidies.',
  },
  {
    title: 'Model energy-grid demand',
    prompt:
      'Model @industry/energy grid demand under electrification with @policy/infrastructure-investment and report @metric/carbon-impact.',
  },
]

function RecentSimulations() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['simulations'],
    queryFn: api.listSimulations,
  })

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[70px] w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <ErrorState
        description={error instanceof ApiError ? error.message : 'Could not load your simulations.'}
        onRetry={() => void refetch()}
        offline={error instanceof ApiError && error.code === 'network_error'}
      />
    )
  }

  const simulations = (data ?? []).slice(0, 4)

  return (
    <div className="space-y-2.5">
      {simulations.map((sim) => (
        <Link
          key={sim.id}
          href="/results"
          className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4 text-ink no-underline hover:border-civic-ring hover:no-underline"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{sim.title}</div>
            <div className="truncate text-[13px] text-muted">
              {sim.scenarios[sim.activeScenario]?.label} scenario · {sim.owner}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden items-center gap-1 text-xs text-faint sm:flex">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {relativeTime(sim.updatedAt)}
            </span>
            <SimulationStatusBadge status={sim.status} />
          </div>
        </Link>
      ))}
      <Link href="/simulations" className="inline-flex items-center gap-1 text-[13px]">
        View all simulations <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </Link>
    </div>
  )
}

export function CommandCentre() {
  const router = useRouter()
  const workspace = useWorkspace()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createSimulation() {
    setCreating(true)
    setError(null)

    // References written into the prompt drive the initial selection.
    const fromPrompt = selectionsFromPrompt(workspace.prompt)
    if (fromPrompt.industrySlugs.length) workspace.setIndustries(fromPrompt.industrySlugs)
    if (fromPrompt.instrumentSlugs.length) workspace.setInstruments(fromPrompt.instrumentSlugs)
    if (fromPrompt.geographySlug) workspace.setGeography(fromPrompt.geographySlug)

    try {
      await api.createSimulation({
        title: workspace.title,
        prompt: workspace.prompt,
        geographySlug: fromPrompt.geographySlug ?? workspace.geographySlug,
        budgetGbp: workspace.budgetBn * 1e9,
        baselineYear: workspace.baselineYear,
        endYear: workspace.endYear,
        industrySlugs: fromPrompt.industrySlugs.length
          ? fromPrompt.industrySlugs
          : workspace.industrySlugs,
        instrumentSlugs: fromPrompt.instrumentSlugs.length
          ? fromPrompt.instrumentSlugs
          : workspace.instrumentSlugs,
      })
      workspace.markSaved()
      router.push('/industries/select')
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'The simulation could not be created. Try again.',
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="mb-5 text-2xl font-semibold sm:text-[28px] sm:leading-9">
        What public system do you want to model?
      </h1>

      {error ? (
        <div className="mb-4">
          <ErrorState description={error} onRetry={createSimulation} />
        </div>
      ) : null}

      <PromptComposer
        value={workspace.prompt}
        onChange={workspace.setPrompt}
        onSubmit={createSimulation}
        geographySlug={workspace.geographySlug}
        onGeographyChange={workspace.setGeography}
        baselineYear={workspace.baselineYear}
        endYear={workspace.endYear}
        onHorizonChange={workspace.setHorizon}
        budgetBn={workspace.budgetBn}
        onBudgetChange={workspace.setBudget}
        submitting={creating}
      />

      {workspace.dirty ? (
        <p role="status" className="mt-2 text-xs text-faint">
          Draft saved locally — unsaved changes will be committed when you create the simulation.
        </p>
      ) : workspace.lastSavedAt ? (
        <p role="status" className="mt-2 text-xs text-faint">
          Last saved {relativeTime(workspace.lastSavedAt)}.
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="mb-3 text-base font-semibold">
            Recent simulations
          </h2>
          <RecentSimulations />
        </section>

        <section aria-labelledby="starters-heading">
          <h2 id="starters-heading" className="mb-3 text-base font-semibold">
            Starter prompts
          </h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {STARTERS.map((starter) => (
              <Card key={starter.title} className="hover:border-civic-ring">
                <button
                  type="button"
                  onClick={() => workspace.setPrompt(starter.prompt)}
                  className="block w-full p-3.5 text-left"
                >
                  <span className="block text-[13px] font-medium text-ink">{starter.title}</span>
                  <span className="mt-1 block text-xs text-faint">
                    {workspace.baselineYear}–{workspace.endYear}
                  </span>
                </button>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
