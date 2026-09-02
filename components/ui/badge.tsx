import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from './utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'border-line bg-canvas text-ink',
        info: 'border-civic-ring bg-civic-tint text-civic-deep',
        positive: 'border-teal-line bg-teal-tint text-teal',
        warning: 'border-warning-line bg-warning-tint text-warning-ink',
        danger: 'border-danger-line bg-danger-tint text-danger',
        muted: 'border-line bg-surface text-muted',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
