import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AGENT_STATUSES } from '@/lib/types'
import type { SimulationStatus } from '@/lib/types'
import { AgentStatusBadge, SimulationStatusBadge, StatusDot } from './status'

const meta = {
  title: 'Domain/Status',
  component: AgentStatusBadge,
  // Default args so render-only stories still satisfy the component's props.
  args: { status: 'complete' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof AgentStatusBadge>

export default meta
type Story = StoryObj<typeof meta>

const SIMULATION_STATUSES: SimulationStatus[] = [
  'draft',
  'validated',
  'running',
  'complete',
  'cancelled',
  'failed',
  'awaiting_approval',
]

/** Every agent state carries a label and a glyph, never colour alone. */
export const AgentStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {AGENT_STATUSES.map((status) => (
        <AgentStatusBadge key={status} status={status} />
      ))}
    </div>
  ),
}

export const SimulationStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {SIMULATION_STATUSES.map((status) => (
        <SimulationStatusBadge key={status} status={status} />
      ))}
    </div>
  ),
}

/** The agent-orchestration row: dot, name, state, progress. */
export const AgentRows: Story = {
  render: () => (
    <ul className="w-[520px]">
      {[
        { name: 'Data Intelligence Agent', status: 'complete' as const, pct: 100 },
        { name: 'Healthcare Agent', status: 'running' as const, pct: 62 },
        { name: 'Employment Agent', status: 'warning' as const, pct: 100 },
        { name: 'Audit Agent', status: 'queued' as const, pct: 0 },
      ].map((agent) => (
        <li
          key={agent.name}
          className="flex items-center gap-3 border-b border-line-softer py-2.5 last:border-b-0"
        >
          <StatusDot status={agent.status} />
          <span className="flex-1 text-[13px] font-medium text-ink">{agent.name}</span>
          <AgentStatusBadge status={agent.status} />
          <span className="tabular w-11 text-right text-xs text-muted">{agent.pct}%</span>
        </li>
      ))}
    </ul>
  ),
}
