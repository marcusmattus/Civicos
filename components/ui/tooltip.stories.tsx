import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

const meta = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={0}>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tooltip open>
      <TooltipTrigger asChild>
        <Button>Fiscal impact</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">Fiscal impact (£bn)</p>
        <ul className="mt-1 space-y-0.5">
          <li>Baseline: 0</li>
          <li>P10: −1.1</li>
          <li>P50 (median): −0.8</li>
          <li>P90: −0.5</li>
          <li>Model: UBI Fiscal Model</li>
        </ul>
      </TooltipContent>
    </Tooltip>
  ),
}
