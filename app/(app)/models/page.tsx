import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { datasetById, modelCards } from '@/lib/data/catalogue'

export const metadata: Metadata = { title: 'Model registry' }

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="mt-3">
      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</h3>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-ink">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default function ModelsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Model registry"
        description="Government Model Passport for every model that can produce a published figure."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {modelCards.map((model) => (
          <Card key={model.id} className="flex flex-col p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold">{model.name}</h2>
              <Badge
                tone={
                  model.status === 'Validated'
                    ? 'positive'
                    : model.status === 'Review pending'
                      ? 'warning'
                      : 'muted'
                }
              >
                {model.status}
              </Badge>
            </div>
            <p className="mt-1.5 text-[13px] text-muted">{model.purpose}</p>

            <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line-soft pt-3 text-xs">
              <div>
                <dt className="text-muted">Owner</dt>
                <dd className="text-ink">{model.owner}</dd>
              </div>
              <div>
                <dt className="text-muted">Version</dt>
                <dd className="tabular text-ink">v{model.version}</dd>
              </div>
              <div>
                <dt className="text-muted">Licence</dt>
                <dd className="text-ink">{model.licence}</dd>
              </div>
              <div>
                <dt className="text-muted">Scope</dt>
                <dd className="text-ink">{model.geographicScope}</dd>
              </div>
            </dl>

            <List
              title="Training datasets"
              items={model.trainingDatasetIds.map((id) => datasetById.get(id)?.name ?? id)}
            />
            <List
              title="Evaluation datasets"
              items={model.evaluationDatasetIds.map((id) => datasetById.get(id)?.name ?? id)}
            />
            <List title="Limitations" items={model.limitations} />
            <List title="Bias tests" items={model.biasTests} />
            <List title="Approved uses" items={model.approvedUses} />
            <List title="Prohibited uses" items={model.prohibitedUses} />

            {model.auditHistory.length > 0 ? (
              <div className="mt-3 border-t border-line-soft pt-2.5 text-xs text-faint">
                Last audit: {model.auditHistory[0]!.action} — {model.auditHistory[0]!.actor},{' '}
                {model.auditHistory[0]!.at}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  )
}
