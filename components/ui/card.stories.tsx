import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'

const meta = {
  title: 'Foundations/Card',
  component: Card,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="max-w-md p-5">
      <CardTitle>Dependency preview</CardTitle>
      <CardDescription className="mt-1">
        Active levers influence 9 metrics across transport, healthcare and employment.
      </CardDescription>
    </Card>
  ),
}

/** Header, content and footer composed as the settings and report screens use them. */
export const Composed: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Approval policy</CardTitle>
        <CardDescription>Who must sign off before results leave the platform.</CardDescription>
      </CardHeader>
      <CardContent className="text-[13px] text-ink">
        High-impact simulations require Approver sign-off before results can be exported or shared.
      </CardContent>
      <CardFooter>
        <Button variant="primary" size="sm">
          Request approval
        </Button>
        <Button size="sm">View policy</Button>
      </CardFooter>
    </Card>
  ),
}

/** Tinted variants carry meaning: green accepts, amber warns, red blocks. */
export const StatusTints: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
      <Card className="border-teal-line bg-teal-tint p-4 text-[13px] text-teal">
        ✓ No issues detected
      </Card>
      <Card className="border-warning-line bg-warning-tint p-4 text-[13px] text-warning-ink">
        ⚠ 2 warnings
      </Card>
      <Card className="border-danger-line bg-danger-tint p-4 text-[13px] text-danger">
        ✕ 1 error must be fixed
      </Card>
    </div>
  ),
}
