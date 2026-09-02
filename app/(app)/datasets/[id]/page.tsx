import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ClassificationBadge } from '@/components/classification'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle } from '@/components/ui/card'
import { datasetById, datasets, modelById } from '@/lib/data/catalogue'

type Props = { params: Promise<{ id: string }> }

export function generateStaticParams() {
  return datasets.map((dataset) => ({ id: dataset.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return { title: datasetById.get(id)?.name ?? 'Dataset' }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <CardTitle>{title}</CardTitle>
      <div className="mt-3">{children}</div>
    </Card>
  )
}

export default async function DatasetDetailPage({ params }: Props) {
  const { id } = await params
  const dataset = datasetById.get(id)
  if (!dataset) notFound()

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/datasets" className="text-[13px]">
        ← Back to DataFoundry
      </Link>

      <PageHeader title={dataset.name} description={dataset.description} />

      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <ClassificationBadge classification={dataset.classification} />
          <Badge tone={dataset.modelReadiness === 'Ready' ? 'positive' : 'warning'}>
            {dataset.modelReadiness}
          </Badge>
          <Badge tone="muted">v{dataset.version}</Badge>
          <Badge tone={dataset.sensitivity === 'OFFICIAL-SENSITIVE' ? 'warning' : 'neutral'}>
            {dataset.sensitivity}
          </Badge>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
          {[
            ['Source', dataset.source],
            ['Department', dataset.department],
            ['Geography', dataset.geography],
            ['Freshness', dataset.freshness],
            ['Quality', dataset.quality],
            ['Licence', dataset.licence],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {dataset.qualityWarnings.length > 0 ? (
        <Card className="mb-4 border-warning-line bg-warning-tint p-5">
          <CardTitle>Quality warnings</CardTitle>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-warning-ink">
            {dataset.qualityWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Schema">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <caption className="sr-only">Fields in {dataset.name}</caption>
              <thead>
                <tr className="bg-canvas">
                  <th scope="col" className="border-b border-line px-2.5 py-2 text-left text-xs font-medium text-muted">
                    Field
                  </th>
                  <th scope="col" className="border-b border-line px-2.5 py-2 text-left text-xs font-medium text-muted">
                    Type
                  </th>
                  <th scope="col" className="border-b border-line px-2.5 py-2 text-left text-xs font-medium text-muted">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {dataset.schema.map((field) => (
                  <tr key={field.name}>
                    <td className="border-b border-line-soft px-2.5 py-2 font-mono text-xs">
                      {field.name}
                    </td>
                    <td className="border-b border-line-soft px-2.5 py-2 text-muted">{field.type}</td>
                    <td className="border-b border-line-soft px-2.5 py-2">{field.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Provenance">
          <ul className="list-disc space-y-1 pl-5 text-[13px]">
            {dataset.provenance.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </Section>

        <Section title="Transformations">
          <ul className="list-disc space-y-1 pl-5 text-[13px]">
            {dataset.transformations.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </Section>

        <Section title="Version history">
          <ul className="space-y-2 text-[13px]">
            {dataset.versionHistory.map((version) => (
              <li key={version.version} className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">v{version.version}</div>
                  <div className="text-xs text-muted">{version.note}</div>
                </div>
                <span className="tabular shrink-0 text-xs text-faint">{version.publishedAt}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Models using this data">
          {dataset.usedByModelIds.length === 0 ? (
            <p className="text-[13px] text-faint">No registered model uses this dataset.</p>
          ) : (
            <ul className="space-y-2 text-[13px]">
              {dataset.usedByModelIds.map((modelId) => {
                const model = modelById.get(modelId)
                return (
                  <li key={modelId} className="flex items-center justify-between gap-3">
                    <span>{model?.name ?? modelId}</span>
                    <Badge tone={model?.status === 'Validated' ? 'positive' : 'warning'}>
                      v{model?.version}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}
