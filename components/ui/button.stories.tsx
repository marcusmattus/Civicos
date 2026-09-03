import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Download, ShieldCheck } from 'lucide-react'
import { Button } from './button'

const meta = {
  title: 'Foundations/Button',
  component: Button,
  args: { children: 'Run simulation' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger', 'link'] },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'icon'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = { args: { variant: 'primary' } }
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Danger: Story = { args: { variant: 'danger', children: 'Cancel simulation' } }
export const Link: Story = { args: { variant: 'link', children: 'View evidence' } }
export const Disabled: Story = { args: { variant: 'primary', disabled: true } }

/** Every variant at every size, the way the app actually mixes them. */
export const Variants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="space-y-3">
      {(['primary', 'secondary', 'ghost', 'danger', 'link'] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-2">
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Button key={size} variant={variant} size={size}>
              {variant} {size}
            </Button>
          ))}
        </div>
      ))}
    </div>
  ),
}

/** Icons sit inside the button; the utility sizes them to 16px automatically. */
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="primary" className="gap-1.5">
        <Download aria-hidden="true" />
        Export policy brief
      </Button>
      <Button className="gap-1.5">
        <ShieldCheck aria-hidden="true" />
        Validate model
      </Button>
      <Button size="icon" aria-label="Download">
        <Download aria-hidden="true" />
      </Button>
    </div>
  ),
}
