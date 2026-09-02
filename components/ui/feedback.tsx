import { AlertTriangle, Inbox, Loader2, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './button'
import { cn } from './utils'

/** Loading placeholder that reserves the final layout. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-line-soft', className)} aria-hidden="true" />
}

export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 p-6 text-sm text-muted">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}…
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface px-6 py-14 text-center">
      <div className="mb-3 text-faint" aria-hidden="true">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-[13px] text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  offline,
}: {
  title?: string
  description: string
  onRetry?: () => void
  offline?: boolean
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-2 rounded-lg border border-danger-line bg-danger-tint p-4"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-danger">
        {offline ? (
          <WifiOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        )}
        {title}
      </div>
      <p className="text-[13px] text-ink">{description}</p>
      {onRetry ? (
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

/** The standing reminder that CivicOS models outcomes; people decide. */
export function HumanDecisionBanner({ className, note }: { className?: string; note?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-warning-line bg-warning-tint px-4 py-2.5 text-[13px] font-medium text-warning-ink',
        className,
      )}
    >
      Modelled outcomes — human decision required.
      {note ? <span className="ml-1 font-normal">{note}</span> : null}
    </div>
  )
}
