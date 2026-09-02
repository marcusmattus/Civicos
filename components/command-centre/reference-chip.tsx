import { BarChart3, Boxes, Database, Factory, MapPin, Scale } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Reference, ReferenceKind } from '@/lib/types'
import { cn } from '../ui/utils'

const KIND_ICON: Record<ReferenceKind, LucideIcon> = {
  industry: Factory,
  policy: Scale,
  dataset: Database,
  model: Boxes,
  geography: MapPin,
  metric: BarChart3,
}

const KIND_STYLE: Record<ReferenceKind, string> = {
  industry: 'border-civic-ring bg-civic-tint text-civic-deep',
  policy: 'border-teal-line bg-teal-tint text-teal',
  dataset: 'border-line bg-canvas text-ink',
  model: 'border-line bg-canvas text-ink',
  geography: 'border-civic-ring bg-civic-tint text-civic-deep',
  metric: 'border-warning-line bg-warning-tint text-warning-ink',
}

export function ReferenceChip({
  reference,
  onRemove,
  className,
}: {
  reference: Reference
  onRemove?: () => void
  className?: string
}) {
  const Icon = KIND_ICON[reference.kind]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium',
        KIND_STYLE[reference.kind],
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      <span className="text-[11px] opacity-70">{reference.kind}/</span>
      {reference.label}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${reference.label}`}
          className="ml-0.5 rounded px-0.5 opacity-60 hover:opacity-100"
        >
          ×
        </button>
      ) : null}
    </span>
  )
}

export { KIND_ICON }
