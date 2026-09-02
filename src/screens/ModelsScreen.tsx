import { Card, PageHeader, cx } from '../components/ui'
import { modelCards } from '../data/civic'

function statusClass(status: string) {
  if (status === 'Validated') return 'text-positive'
  if (status === 'Review pending') return 'text-warning'
  return 'text-ink-faint'
}

export default function ModelsScreen() {
  return (
    <>
      <PageHeader title="Model registry" subtitle="Government Model Passport catalogue." />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modelCards.map((model) => (
          <Card key={model.name} className="p-4.5">
            <div className="mb-1.5 text-sm font-semibold">{model.name}</div>
            <div className="mb-3.5 text-[13px] text-ink-muted">{model.purpose}</div>
            <div className="flex justify-between border-t border-line-soft pt-2.5 text-xs text-ink-faint">
              <div>{model.version}</div>
              <div>{model.geo}</div>
            </div>
            <div className={cx('mt-2 text-xs font-medium', statusClass(model.status))}>
              {model.status}
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
