import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Slider } from './slider'

const meta = {
  title: 'Forms/Slider',
  component: Slider,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={[35]} min={0} max={100} step={1} aria-label="Adoption" />
    </div>
  ),
}

/** The scenario-lever pattern: label, live value, then the control. */
export const AsLever: Story = {
  render: function AsLever() {
    const [value, setValue] = useState(600)
    return (
      <div className="w-96">
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="ubi" className="text-[13px] text-ink">
            Monthly UBI
          </label>
          <span className="tabular text-[13px] font-semibold">£{value.toLocaleString('en-GB')}</span>
        </div>
        <Slider
          id="ubi"
          value={[value]}
          min={0}
          max={1500}
          step={50}
          aria-label="Monthly UBI"
          onValueChange={([next]) => setValue(next ?? 0)}
        />
        <p className="mt-1 text-xs text-muted">
          Unconditional monthly transfer per eligible adult resident.
        </p>
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={[20]} min={0} max={100} disabled aria-label="Locked lever" />
      <p className="mt-1 text-xs text-muted">Locked: the owning instrument is not selected.</p>
    </div>
  ),
}
