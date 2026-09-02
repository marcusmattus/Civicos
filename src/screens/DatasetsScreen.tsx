import { Card, PageHeader, TableScroll, cx } from '../components/ui'
import { datasetRows } from '../data/civic'
import type { DatasetRow } from '../data/civic'

const COLUMNS = 'grid-cols-[2fr_1fr_1fr_1.2fr_1fr_1fr_1fr_1fr]'

function readyClass(ready: DatasetRow['ready']) {
  return ready === 'Ready' ? 'text-positive' : 'text-warning'
}

function ClassificationTag({ children }: { children: string }) {
  return (
    <span className="inline-block rounded border-none bg-brand-tint px-1.5 py-0.5 text-[11px] break-all text-brand-deep">
      {children}
    </span>
  )
}

export default function DatasetsScreen() {
  return (
    <>
      <PageHeader title="DataFoundry" subtitle="Governed dataset catalogue." />

      {/* Table from md up; stacked cards below that */}
      <Card className="hidden overflow-hidden md:block">
        <TableScroll>
          <div
            className={cx(
              'grid border-b border-line bg-canvas px-5 py-3 text-xs text-ink-muted',
              COLUMNS,
            )}
          >
            <div>Dataset</div>
            <div>Source</div>
            <div>Department</div>
            <div>Classification</div>
            <div>Geography</div>
            <div>Freshness</div>
            <div>Quality</div>
            <div>Status</div>
          </div>
          {datasetRows.map((row) => (
            <div
              key={row.name}
              className={cx(
                'grid items-center border-b border-line-soft px-5 py-3 text-[13px] last:border-b-0',
                COLUMNS,
              )}
            >
              <div className="pr-3 font-medium">{row.name}</div>
              <div className="text-ink-muted">{row.source}</div>
              <div className="text-ink-muted">{row.dept}</div>
              <div className="pr-3">
                <ClassificationTag>{row.cls}</ClassificationTag>
              </div>
              <div className="text-ink-muted">{row.geo}</div>
              <div className="text-ink-muted">{row.fresh}</div>
              <div className="text-ink-muted">{row.quality}</div>
              <div className={cx('font-medium', readyClass(row.ready))}>{row.ready}</div>
            </div>
          ))}
        </TableScroll>
      </Card>

      <div className="md:hidden">
        {datasetRows.map((row) => (
          <Card key={row.name} className="mb-2.5 p-4">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="text-sm font-semibold">{row.name}</div>
              <div className={cx('shrink-0 text-xs font-medium', readyClass(row.ready))}>
                {row.ready}
              </div>
            </div>
            <div className="mb-2.5 text-[13px] text-ink-muted">
              {row.source} · {row.dept} · {row.geo}
            </div>
            <div className="mb-2.5">
              <ClassificationTag>{row.cls}</ClassificationTag>
            </div>
            <div className="text-xs text-ink-faint">
              Freshness: {row.fresh} · Quality: {row.quality}
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
