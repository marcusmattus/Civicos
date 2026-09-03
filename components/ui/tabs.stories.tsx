import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

/** The four scenarios, as Results and Scenario configuration present them. */
export const Scenarios: Story = {
  render: () => (
    <Tabs defaultValue="expected" className="w-[520px]">
      <TabsList aria-label="Scenario">
        <TabsTrigger value="conservative">Conservative</TabsTrigger>
        <TabsTrigger value="expected">Expected</TabsTrigger>
        <TabsTrigger value="accelerated">Accelerated</TabsTrigger>
        <TabsTrigger value="intervention">Intervention</TabsTrigger>
      </TabsList>
      {[
        ['conservative', 'Slow diffusion, tight fiscal constraint.'],
        ['expected', 'Central case agreed with GLA Transport and HM Treasury analysts.'],
        ['accelerated', 'Faster adoption with lighter licensing; wider uncertainty bands.'],
        ['intervention', 'Full instrument set: higher UBI, quota and empty-mileage charging.'],
      ].map(([value, copy]) => (
        <TabsContent key={value} value={value!} className="pt-4 text-[13px] text-muted">
          {copy}
        </TabsContent>
      ))}
    </Tabs>
  ),
}
