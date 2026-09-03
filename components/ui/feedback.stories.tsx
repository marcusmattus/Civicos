import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './button'
import {
  EmptyState,
  ErrorState,
  HumanDecisionBanner,
  LoadingBlock,
  Skeleton,
} from './feedback'

const meta = {
  title: 'Feedback/States',
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Loading: Story = {
  render: () => (
    <div className="w-[520px] space-y-3">
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <LoadingBlock label="Collecting evidence" />
    </div>
  ),
}

export const Empty: Story = {
  render: () => (
    <div className="w-[560px]">
      <EmptyState
        title="No simulations yet"
        description="Describe a public system in the Command Centre to create your first simulation."
        action={<Button variant="primary">Go to Command Centre</Button>}
      />
    </div>
  ),
}

export const Error: Story = {
  render: () => (
    <div className="w-[520px]">
      <ErrorState
        description="Results could not be loaded for this run."
        onRetry={() => undefined}
      />
    </div>
  ),
}

export const Offline: Story = {
  render: () => (
    <div className="w-[520px]">
      <ErrorState
        title="You are offline"
        description="Changes are kept locally and will not be saved until the connection returns."
        offline
      />
    </div>
  ),
}

/** The standing reminder that CivicOS models outcomes and people decide. */
export const HumanDecision: Story = {
  render: () => (
    <div className="w-[640px] space-y-3">
      <HumanDecisionBanner />
      <HumanDecisionBanner note="All figures are illustrative demonstration data." />
    </div>
  ),
}
