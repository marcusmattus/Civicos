import { Card, PageHeader } from '../components/ui'
import { industryCards } from '../data/civic'

export default function IndustriesScreen() {
  return (
    <>
      <PageHeader
        title="Industries"
        subtitle="Explore available models, datasets and active simulations by sector."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {industryCards.map((industry) => (
          <Card key={industry.name} className="p-4.5">
            <div className="mb-3 h-7 w-7 rounded-md bg-brand-tint" />
            <div className="mb-2.5 text-sm font-semibold">{industry.name}</div>
            <div className="text-xs text-ink-muted">
              {industry.models} models · {industry.datasets} datasets
            </div>
            <div className="mt-0.5 text-xs text-ink-faint">
              {industry.sims} active simulations
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
