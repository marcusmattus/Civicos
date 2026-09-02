import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { industries } from '@/lib/data/catalogue'

export const metadata: Metadata = { title: 'Industries' }

export default function IndustriesPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Industries"
        description="Available models, datasets and active simulations by sector."
        actions={
          <Button asChild variant="primary">
            <Link href="/industries/select">Select for a simulation</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {industries.map((industry) => (
          <Card key={industry.id} className="p-4">
            <h2 className="text-sm font-semibold">{industry.name}</h2>
            <p className="mt-1.5 text-xs text-muted">{industry.description}</p>
            <dl className="mt-3 space-y-1 border-t border-line-soft pt-2.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted">Models</dt>
                <dd className="tabular text-ink">{industry.models}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Datasets</dt>
                <dd className="tabular text-ink">{industry.datasets}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Active simulations</dt>
                <dd className="tabular text-ink">{industry.activeSimulations}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>
    </div>
  )
}
