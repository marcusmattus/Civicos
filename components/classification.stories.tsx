import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { DATA_CLASSIFICATIONS } from '@/lib/types'
import { ClassificationBadge } from './classification'
import { TooltipProvider } from './ui/tooltip'

const meta = {
  title: 'Domain/Classification',
  component: ClassificationBadge,
  // Default args so render-only stories still satisfy the component's props.
  args: { classification: 'OBSERVED' },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={0}>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof ClassificationBadge>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Provenance is the product's central guarantee, so each classification pairs
 * a glyph with its colour — the distinction survives greyscale printing and
 * colour-blind viewing. Hover for what each one means.
 */
export const AllClassifications: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {DATA_CLASSIFICATIONS.map((classification) => (
        <ClassificationBadge key={classification} classification={classification} />
      ))}
    </div>
  ),
}

export const Observed: Story = { args: { classification: 'OBSERVED' } }
export const Synthetic: Story = { args: { classification: 'SYNTHETIC' } }
export const ScenarioAssumption: Story = { args: { classification: 'SCENARIO_ASSUMPTION' } }
