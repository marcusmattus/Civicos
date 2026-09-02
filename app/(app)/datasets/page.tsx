import type { Metadata } from 'next'
import { DatasetsTable } from '@/components/datasets/datasets-table'
import { PageHeader } from '@/components/page-header'
import { datasets } from '@/lib/data/catalogue'

export const metadata: Metadata = { title: 'DataFoundry' }

export default function DatasetsPage() {
  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        title="DataFoundry"
        description="Governed dataset catalogue. Every dataset carries a provenance classification; observed and synthetic data are never silently combined."
      />
      <DatasetsTable datasets={datasets} />
    </div>
  )
}
