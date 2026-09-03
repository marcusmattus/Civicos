import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { buildResultBundle } from '@/lib/engine/forecast'
import { demoSimulation } from '@/lib/data/demo'
import { TooltipProvider } from '../ui/tooltip'
import { KpiCard } from './kpi-card'

const forecasts = buildResultBundle(demoSimulation(), 'expected').kpis

const meta = {
  title: 'Domain/KPI card',
  component: KpiCard,
  // Default args so render-only stories still satisfy the component's props.
  args: { forecast: forecasts[0]! },
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={0}>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof KpiCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * A decision-grade number: value, change against baseline, the P10–P90 band,
 * the model that produced it and its provenance classification. Values come
 * from the real forecast engine, so the story cannot drift from the app.
 */
export const Single: Story = {
  args: { forecast: forecasts.find((f) => f.metricId === 'met-fiscal-impact')! },
}

export const Grid: Story = {
  render: () => (
    <div className="grid max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {forecasts.map((forecast) => (
        <KpiCard key={forecast.metricId} forecast={forecast} />
      ))}
    </div>
  ),
}
