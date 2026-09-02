'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/client/api'
import { formatDateTime } from '@/lib/format'
import { leverById } from '@/lib/data/catalogue'
import type { ScenarioKey } from '@/lib/types'
import { ClassificationBadge } from '../classification'
import { Badge } from '../ui/badge'
import { Dialog, DialogDescription, DialogTitle, SheetContent } from '../ui/dialog'
import { ErrorState, LoadingBlock } from '../ui/feedback'

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <section className="border-b border-line-soft py-4">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase">
        {title}
        {count !== undefined ? <Badge tone="muted">{count}</Badge> : null}
      </h3>
      {children}
    </section>
  )
}

/**
 * Everything that produced the current numbers: dataset versions, model
 * versions, assumptions, parameters and approvals. This is what makes a run
 * defensible after the fact.
 */
export function EvidenceDrawer({
  simulationId,
  scenario,
  open,
  onOpenChange,
}: {
  simulationId: string
  scenario: ScenarioKey
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['evidence', simulationId, scenario],
    queryFn: () => api.getEvidence(simulationId, scenario),
    enabled: open,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby="evidence-description">
        <div className="border-b border-line px-5 py-4">
          <DialogTitle className="text-lg font-semibold">Evidence</DialogTitle>
          <DialogDescription id="evidence-description" className="mt-1 text-[13px] text-muted">
            Dataset and model versions, assumptions and approvals for this run.
            {data ? ` Generated ${formatDateTime(data.generatedAt)}.` : ''}
          </DialogDescription>
          {data?.runId ? (
            <Badge tone="muted" className="mt-2 font-mono text-[11px]">
              {data.runId}
            </Badge>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {isLoading ? <LoadingBlock label="Collecting evidence" /> : null}

          {error ? (
            <div className="py-4">
              <ErrorState
                description="The evidence bundle could not be loaded."
                onRetry={() => void refetch()}
              />
            </div>
          ) : null}

          {data ? (
            <>
              <Section title="Datasets" count={data.evidence.datasets.length}>
                <ul className="space-y-3">
                  {data.evidence.datasets.map((dataset) => {
                    const extended = dataset as typeof dataset & {
                      source?: string
                      licence?: string
                      qualityWarnings?: string[]
                    }
                    return (
                      <li key={dataset.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[13px] font-medium text-ink">{dataset.name}</div>
                            <div className="text-xs text-muted">
                              {extended.source} · v{dataset.version} · {extended.licence}
                            </div>
                          </div>
                          <ClassificationBadge classification={dataset.classification} />
                        </div>
                        {extended.qualityWarnings?.length ? (
                          <ul className="mt-1 list-disc pl-4 text-xs text-warning-ink">
                            {extended.qualityWarnings.map((warning) => (
                              <li key={warning}>{warning}</li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </Section>

              <Section title="Models" count={data.evidence.models.length}>
                <ul className="space-y-3">
                  {data.evidence.models.map((model) => {
                    const extended = model as typeof model & {
                      status?: string
                      limitations?: string[]
                    }
                    return (
                      <li key={model.id}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-[13px] font-medium text-ink">{model.name}</div>
                          <Badge tone={extended.status === 'Validated' ? 'positive' : 'warning'}>
                            v{model.version} · {extended.status}
                          </Badge>
                        </div>
                        {extended.limitations?.length ? (
                          <ul className="mt-1 list-disc pl-4 text-xs text-muted">
                            {extended.limitations.map((limitation) => (
                              <li key={limitation}>{limitation}</li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </Section>

              <Section title="Assumptions" count={data.evidence.assumptions.length}>
                <ul className="space-y-1.5">
                  {data.evidence.assumptions.map((assumption) => (
                    <li
                      key={assumption.label}
                      className="flex items-center justify-between gap-3 text-[13px]"
                    >
                      <span className="text-ink">
                        {leverById.get(assumption.label)?.label ?? assumption.label}
                      </span>
                      <span className="tabular font-medium">{assumption.value}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-warning-ink">
                  Assumptions are inputs chosen by the analyst — they are not observations.
                </p>
              </Section>

              <Section title="Run parameters">
                <ul className="space-y-1.5">
                  {data.evidence.parameters.map((parameter) => (
                    <li
                      key={parameter.label}
                      className="flex items-center justify-between gap-3 text-[13px]"
                    >
                      <span className="text-muted">{parameter.label}</span>
                      <span className="font-medium text-ink capitalize">{parameter.value}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Approvals">
                <ul className="space-y-2">
                  {data.evidence.approvals.map((approval) => (
                    <li key={`${approval.role}-${approval.actor}`} className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[13px] font-medium text-ink">{approval.actor}</div>
                        <div className="text-xs text-muted">
                          {approval.role} · {formatDateTime(approval.at)}
                        </div>
                      </div>
                      <Badge tone={approval.decision === 'Approved' ? 'positive' : 'warning'}>
                        {approval.decision}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </Section>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Dialog>
  )
}
