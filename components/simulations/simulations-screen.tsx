'use client'

import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api, ApiError } from '@/lib/client/api'
import { geographies } from '@/lib/data/catalogue'
import { relativeTime } from '@/lib/format'
import { PageHeader } from '../page-header'
import { SimulationStatusBadge } from '../status'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { EmptyState, ErrorState, Skeleton } from '../ui/feedback'

export function SimulationsScreen() {
  const router = useRouter()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['simulations'],
    queryFn: api.listSimulations,
  })

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Simulations"
        description="Every simulation in your organisation, with its owner and current state."
        actions={
          <Button variant="primary" className="gap-1.5" onClick={() => router.push('/')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New simulation
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          description={error instanceof ApiError ? error.message : 'Simulations could not be loaded.'}
          onRetry={() => void refetch()}
          offline={error instanceof ApiError && error.code === 'network_error'}
        />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          title="No simulations yet"
          description="Describe a public system in the Command Centre to create your first simulation."
          action={
            <Button variant="primary" onClick={() => router.push('/')}>
              Go to Command Centre
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {(data ?? []).map((sim) => {
            const geography = geographies.find((g) => g.slug === sim.geographySlug)
            return (
              <li key={sim.id}>
                <Card className="p-0 transition-colors hover:border-civic-ring">
                  <Link
                    href="/results"
                    className="flex flex-col justify-between gap-3 p-4 text-ink no-underline hover:no-underline sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{sim.title}</div>
                      <div className="truncate text-[13px] text-muted">
                        {sim.scenarios[sim.activeScenario]?.label} scenario · {geography?.name} ·
                        Owner: {sim.owner}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-faint">
                        <span>{sim.industrySlugs.length} industries</span>
                        <span aria-hidden="true">·</span>
                        <span>{sim.instrumentSlugs.length} instruments</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {sim.baselineYear}–{sim.endYear}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-faint">{relativeTime(sim.updatedAt)}</span>
                      <SimulationStatusBadge status={sim.status} />
                    </div>
                  </Link>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
