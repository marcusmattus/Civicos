'use client'

import { datasetById, metricById, modelById } from '@/lib/data/catalogue'
import type { ModelNode } from '@/lib/types'
import { ClassificationBadge } from '../classification'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Dialog, DialogDescription, DialogTitle, SheetContent } from '../ui/dialog'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-line-soft py-4">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">{title}</h3>
      {children}
    </section>
  )
}

function Empty({ children }: { children: string }) {
  return <p className="text-[13px] text-faint">{children}</p>
}

export function NodeInspector({
  node,
  open,
  onOpenChange,
  onDelete,
}: {
  node: ModelNode | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete?: (id: string) => void
}) {
  if (!node) return null

  const model = node.modelId ? modelById.get(node.modelId) : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby="inspector-description">
        <div className="border-b border-line px-5 py-4">
          <Badge tone="info" className="mb-2 capitalize">
            {node.type}
          </Badge>
          <DialogTitle className="text-lg font-semibold">{node.label}</DialogTitle>
          <DialogDescription id="inspector-description" className="mt-1 text-[13px] text-muted">
            {node.description}
          </DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          <Section title="Validation status">
            <div className="flex items-center gap-2">
              <Badge
                tone={
                  node.validation === 'valid'
                    ? 'positive'
                    : node.validation === 'warning'
                      ? 'warning'
                      : 'danger'
                }
              >
                {node.validation === 'valid'
                  ? '✓ Valid'
                  : node.validation === 'warning'
                    ? '⚠ Warning'
                    : '✕ Invalid'}
              </Badge>
            </div>
            {node.validationNote ? (
              <p className="mt-2 text-[13px] text-warning-ink">{node.validationNote}</p>
            ) : null}
          </Section>

          <Section title="Data sources">
            {node.dataSourceIds.length === 0 ? (
              <Empty>No datasets attached to this node.</Empty>
            ) : (
              <ul className="space-y-2">
                {node.dataSourceIds.map((id) => {
                  const dataset = datasetById.get(id)
                  return (
                    <li key={id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-ink">
                          {dataset?.name ?? id}
                        </div>
                        <div className="text-xs text-muted">
                          {dataset?.source} · v{dataset?.version}
                        </div>
                      </div>
                      {dataset ? <ClassificationBadge classification={dataset.classification} /> : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>

          <Section title="Required datasets">
            {node.requiredDatasetIds.length === 0 ? (
              <Empty>No mandatory datasets — this node can run without additional data.</Empty>
            ) : (
              <ul className="space-y-1">
                {node.requiredDatasetIds.map((id) => (
                  <li key={id} className="text-[13px] text-ink">
                    {datasetById.get(id)?.name ?? id}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Model">
            {model ? (
              <div>
                <div className="text-[13px] font-medium text-ink">{model.name}</div>
                <div className="text-xs text-muted">
                  v{model.version} · {model.status} · {model.geographicScope}
                </div>
                {model.limitations.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">
                    {model.limitations.map((limitation) => (
                      <li key={limitation}>{limitation}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <Empty>No model is bound to this node.</Empty>
            )}
          </Section>

          <Section title="Assumptions">
            {node.assumptions.length === 0 ? (
              <Empty>No node-level assumptions.</Empty>
            ) : (
              <ul className="list-disc space-y-1 pl-4 text-[13px] text-ink">
                {node.assumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Metrics produced">
            {node.metricIds.length === 0 ? (
              <Empty>This node does not emit metrics directly.</Empty>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {node.metricIds.map((id) => (
                  <li key={id}>
                    <Badge tone="muted">{metricById.get(id)?.label ?? id}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        {onDelete ? (
          <div className="flex justify-end gap-2 border-t border-line px-5 py-3">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onDelete(node.id)
                onOpenChange(false)
              }}
            >
              Remove node
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Dialog>
  )
}
