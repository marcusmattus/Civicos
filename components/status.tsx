import type { AgentStatus, SimulationStatus } from '@/lib/types'
import { Badge } from './ui/badge'
import { cn } from './ui/utils'

type Tone = 'neutral' | 'info' | 'positive' | 'warning' | 'danger' | 'muted'

const AGENT_STATUS: Record<AgentStatus, { label: string; tone: Tone; glyph: string }> = {
  queued: { label: 'Queued', tone: 'muted', glyph: '○' },
  retrieving: { label: 'Retrieving', tone: 'info', glyph: '↓' },
  validating: { label: 'Validating', tone: 'info', glyph: '⧗' },
  running: { label: 'Running', tone: 'info', glyph: '▶' },
  complete: { label: 'Complete', tone: 'positive', glyph: '✓' },
  warning: { label: 'Warning', tone: 'warning', glyph: '⚠' },
  failed: { label: 'Failed', tone: 'danger', glyph: '✕' },
  awaiting_approval: { label: 'Awaiting approval', tone: 'warning', glyph: '⏸' },
}

const SIMULATION_STATUS: Record<SimulationStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'muted' },
  validated: { label: 'Validated', tone: 'info' },
  running: { label: 'Running', tone: 'info' },
  complete: { label: 'Complete', tone: 'positive' },
  cancelled: { label: 'Cancelled', tone: 'warning' },
  failed: { label: 'Failed', tone: 'danger' },
  awaiting_approval: { label: 'Awaiting approval', tone: 'warning' },
}

/** Status is always carried by text and a glyph, never by colour alone. */
export function AgentStatusBadge({ status, className }: { status: AgentStatus; className?: string }) {
  const meta = AGENT_STATUS[status]
  return (
    <Badge tone={meta.tone} className={className}>
      <span aria-hidden="true">{meta.glyph}</span>
      {meta.label}
    </Badge>
  )
}

export function SimulationStatusBadge({
  status,
  className,
}: {
  status: SimulationStatus
  className?: string
}) {
  const meta = SIMULATION_STATUS[status]
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  )
}

export function agentStatusLabel(status: AgentStatus): string {
  return AGENT_STATUS[status].label
}

const DOT_TONE: Record<AgentStatus, string> = {
  queued: 'bg-line-strong',
  retrieving: 'bg-cyan',
  validating: 'bg-cyan',
  running: 'bg-civic',
  complete: 'bg-teal',
  warning: 'bg-warning',
  failed: 'bg-danger',
  awaiting_approval: 'bg-warning',
}

export function StatusDot({ status, className }: { status: AgentStatus; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', DOT_TONE[status], className)}
    />
  )
}
