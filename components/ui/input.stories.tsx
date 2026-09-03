import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FieldError, Input, Label, Textarea } from './input'

const meta = {
  title: 'Forms/Input',
  component: Input,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Label htmlFor="email" className="mb-1.5">
        Government email
      </Label>
      <Input id="email" type="email" placeholder="name@london.gov.uk" />
      <p className="mt-1.5 text-xs text-muted">Authorised domains: gov.uk, london.gov.uk</p>
    </div>
  ),
}

export const Invalid: Story = {
  render: () => (
    <div className="w-80">
      <Label htmlFor="email-invalid" className="mb-1.5">
        Government email
      </Label>
      <Input id="email-invalid" defaultValue="someone@example.com" aria-invalid />
      <FieldError>Sign-in is restricted to authorised public-sector domains.</FieldError>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <Label htmlFor="run-id" className="mb-1.5">
        Run ID
      </Label>
      <Input id="run-id" defaultValue="run-mtklco0n" disabled />
    </div>
  ),
}

export const WithTextarea: Story = {
  render: () => (
    <div className="w-96">
      <Label htmlFor="notes" className="mb-1.5">
        Scenario notes
      </Label>
      <Textarea
        id="notes"
        className="h-24"
        placeholder="Why these assumptions? Note the source of any figure that is not a default."
      />
    </div>
  ),
}
