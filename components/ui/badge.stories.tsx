import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Badge } from './badge'

const meta = {
  title: 'Foundations/Badge',
  component: Badge,
  args: { children: 'Validated' },
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'info', 'positive', 'warning', 'danger', 'muted'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = { args: { tone: 'neutral' } }
export const Info: Story = { args: { tone: 'info', children: 'Expected scenario' } }
export const Positive: Story = { args: { tone: 'positive', children: 'Complete' } }
export const Warning: Story = { args: { tone: 'warning', children: 'Awaiting approval' } }
export const Danger: Story = { args: { tone: 'danger', children: 'Failed' } }
export const Muted: Story = { args: { tone: 'muted', children: 'Draft' } }

export const Tones: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="info">Info</Badge>
      <Badge tone="positive">Positive</Badge>
      <Badge tone="warning">Warning</Badge>
      <Badge tone="danger">Danger</Badge>
      <Badge tone="muted">Muted</Badge>
    </div>
  ),
}
