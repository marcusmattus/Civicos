import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Checkbox } from './checkbox'

const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2 text-[13px]">
        <Checkbox defaultChecked />
        Checked
      </label>
      <label className="flex items-center gap-2 text-[13px]">
        <Checkbox />
        Unchecked
      </label>
      <label className="flex items-center gap-2 text-[13px] opacity-60">
        <Checkbox disabled />
        Disabled
      </label>
    </div>
  ),
}

/** The map-layer toggle pattern from MobilitySim. */
export const LayerToggles: Story = {
  render: function LayerToggles() {
    const [on, setOn] = useState<Record<string, boolean>>({
      approved: true,
      pilot: true,
      restricted: false,
    })
    const layers = [
      { id: 'approved', label: 'Approved zones', swatch: '#0f9d83' },
      { id: 'pilot', label: 'Pilot zones', swatch: '#06b6d4' },
      { id: 'restricted', label: 'Restricted zones', swatch: '#dc2626' },
    ]
    return (
      <ul className="w-72 space-y-2">
        {layers.map((layer) => (
          <li key={layer.id}>
            <label className="flex cursor-pointer items-center gap-2.5 text-[13px]">
              <Checkbox
                checked={on[layer.id]}
                onCheckedChange={(next) => setOn((c) => ({ ...c, [layer.id]: next === true }))}
                aria-label={layer.label}
              />
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-[2px] border"
                style={{ background: `${layer.swatch}33`, borderColor: layer.swatch }}
              />
              {layer.label}
            </label>
          </li>
        ))}
      </ul>
    )
  },
}
