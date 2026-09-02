'use client'

import { useQuery } from '@tanstack/react-query'
import { api, ApiError } from '@/lib/client/api'
import { datasetById, modelById } from '@/lib/data/catalogue'
import { formatDateTime, relativeTime } from '@/lib/format'
import type { AuditEntry } from '@/lib/types'
import { PageHeader } from '../page-header'
import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import { EmptyState, ErrorState, Skeleton } from '../ui/feedback'

function decisionTone(decision: AuditEntry['decision']) {
  if (decision === 'Approved') return 'positive'
  if (decision === 'Pending') return 'warning'
  if (decision === 'Denied') return 'danger'
  return 'muted'
}

function Versions({ entry }: { entry: AuditEntry }) {
  const datasets = entry.datasetVersions ?? []
  const models = entry.modelVersions ?? []
  if (datasets.length === 0 && models.length === 0) return null

  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {datasets.slice(0, 3).map((v) => (
        <Badge key={v.datasetId} tone="muted" className="text-[11px]">
          {datasetById.get(v.datasetId)?.name ?? v.datasetId} v{v.version}
        </Badge>
      ))}
      {datasets.length > 3 ? (
        <Badge tone="muted" className="text-[11px]">
          +{datasets.length - 3} datasets
        </Badge>
      ) : null}
      {models.slice(0, 2).map((v) => (
        <Badge key={v.modelId} tone="muted" className="text-[11px]">
          {modelById.get(v.modelId)?.name ?? v.modelId} v{v.version}
        </Badge>
      ))}
      {models.length > 2 ? (
        <Badge tone="muted" className="text-[11px]">
          +{models.length - 2} models
        </Badge>
      ) : null}
    </div>
  )
}

export function AuditScreen() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api.listAudit(100),
  })

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Audit Centre"
        description="Immutable record of user actions, with the dataset and model versions in force at the time."
      />

      {isLoading ? (
        <div className="space-y-2.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          description={error instanceof ApiError ? error.message : 'The audit record could not be loaded.'}
          onRetry={() => void refetch()}
        />
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          title="No audit entries yet"
          description="Actions across the platform are recorded here as they happen."
        />
      ) : (
        <>
          {/* Table from md up */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-[13px]">
                <caption className="sr-only">Audit entries, most recent first.</caption>
                <thead>
                  <tr className="bg-canvas">
                    {['User', 'Organisation', 'Action', 'Subject', 'When', 'Decision'].map((head) => (
                      <th
                        key={head}
                        scope="col"
                        className="border-b border-line px-3 py-2.5 text-left text-xs font-medium text-muted"
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data ?? []).map((entry) => (
                    <tr key={entry.id}>
                      <td className="border-b border-line-soft px-3 py-2.5 font-medium">
                        {entry.actor}
                      </td>
                      <td className="border-b border-line-soft px-3 py-2.5 text-muted">
                        {entry.organisation}
                      </td>
                      <td className="border-b border-line-soft px-3 py-2.5">{entry.action}</td>
                      <td className="border-b border-line-soft px-3 py-2.5">
                        {entry.subject}
                        <Versions entry={entry} />
                      </td>
                      <td
                        className="border-b border-line-soft px-3 py-2.5 text-faint"
                        title={formatDateTime(entry.at)}
                      >
                        {relativeTime(entry.at)}
                      </td>
                      <td className="border-b border-line-soft px-3 py-2.5">
                        <Badge tone={decisionTone(entry.decision)}>{entry.decision}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Stacked cards below md */}
          <ul className="space-y-2.5 md:hidden">
            {(data ?? []).map((entry) => (
              <li key={entry.id}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold">{entry.action}</span>
                    <Badge tone={decisionTone(entry.decision)}>{entry.decision}</Badge>
                  </div>
                  <p className="mt-1 text-[13px] text-muted">{entry.subject}</p>
                  <Versions entry={entry} />
                  <p className="mt-2 text-xs text-faint">
                    {entry.actor} · {entry.organisation} · {relativeTime(entry.at)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
