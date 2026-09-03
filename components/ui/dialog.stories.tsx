import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  SheetContent,
} from './dialog'

const meta = {
  title: 'Overlays/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

/** Centred modal — the session-timeout warning. */
export const Modal: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">Open modal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="text-base font-semibold">
          Your session is about to expire
        </DialogTitle>
        <DialogDescription className="mt-2 text-[13px] text-muted">
          For security, CivicOS signs you out after 30 minutes of inactivity.
        </DialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <Button>Sign out now</Button>
          <Button variant="primary">Stay signed in</Button>
        </div>
      </DialogContent>
    </Dialog>
  ),
}

/** Right-hand drawer — evidence and the model-canvas node inspector. */
export const Sheet: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary">Open evidence drawer</Button>
      </DialogTrigger>
      <SheetContent>
        <div className="border-b border-line px-5 py-4">
          <DialogTitle className="text-lg font-semibold">Evidence</DialogTitle>
          <DialogDescription className="mt-1 text-[13px] text-muted">
            Dataset and model versions, assumptions and approvals for this run.
          </DialogDescription>
        </div>
        <div className="px-5 py-4 text-[13px] text-muted">
          12 datasets · 5 models · 15 assumptions · 2 approvals
        </div>
      </SheetContent>
    </Dialog>
  ),
}
