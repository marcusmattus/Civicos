'use client'

import { Handle, Position } from '@xyflow/react'
import type { NodeProps, Node } from '@xyflow/react'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import type { ModelNode, ModelNodeType } from '@/lib/types'
import { cn } from '../ui/utils'

export type CanvasNodeData = ModelNode & Record<string, unknown>
export type CanvasNode = Node<CanvasNodeData, 'civic'>

const TYPE_STYLE: Record<ModelNodeType, string> = {
  geography: 'border-civic bg-civic-tint',
  industry: 'border-line bg-surface',
  instrument: 'border-teal-line bg-teal-tint',
  assumption: 'border-warning-line bg-warning-tint',
  metric: 'border-line bg-surface',
  outcome: 'border-civic bg-civic-tint',
}

const TYPE_LABEL: Record<ModelNodeType, string> = {
  geography: 'Geography',
  industry: 'Industry',
  instrument: 'Instrument',
  assumption: 'Assumptions',
  metric: 'Metrics',
  outcome: 'Outcomes',
}

const VALIDATION_ICON = {
  valid: CheckCircle2,
  warning: AlertTriangle,
  invalid: XCircle,
} as const

const VALIDATION_STYLE = {
  valid: 'text-teal',
  warning: 'text-warning',
  invalid: 'text-danger',
} as const

export function CanvasNodeCard({ data, selected }: NodeProps<CanvasNode>) {
  const Icon = VALIDATION_ICON[data.validation]

  return (
    <div
      className={cn(
        'w-[190px] rounded-lg border px-3 py-2.5 text-left shadow-[var(--shadow-card)]',
        TYPE_STYLE[data.type],
        selected && 'ring-2 ring-civic ring-offset-1',
      )}
    >
      <Handle type="target" position={Position.Left} />
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-medium tracking-wide text-muted uppercase">
          {TYPE_LABEL[data.type]}
        </span>
        <Icon
          className={cn('h-3.5 w-3.5 shrink-0', VALIDATION_STYLE[data.validation])}
          aria-label={`Validation: ${data.validation}`}
        />
      </div>
      <div className="mt-1 text-[13px] leading-tight font-semibold text-ink">{data.label}</div>
      {data.metricIds.length > 0 ? (
        <div className="mt-1.5 text-[11px] text-muted">
          {data.metricIds.length} metric{data.metricIds.length === 1 ? '' : 's'}
        </div>
      ) : null}
      {data.dataSourceIds.length > 0 ? (
        <div className="text-[11px] text-muted">
          {data.dataSourceIds.length} dataset{data.dataSourceIds.length === 1 ? '' : 's'}
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
