import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/** White panel with the standard 1px border + 8px radius used across every screen. */
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx('rounded-lg border border-line bg-surface', className)}>{children}</div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('text-sm font-semibold', className)}>{children}</div>
}

export function CardSubtitle({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('text-xs text-ink-muted', className)}>{children}</div>
}

export function PageHeader({
  title,
  subtitle,
  className,
}: {
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div className={cx(subtitle ? 'mb-6' : 'mb-5', className)}>
      <h1 className="text-2xl font-semibold sm:text-[28px] sm:leading-9">{title}</h1>
      {subtitle ? <p className="mt-1 text-ink-muted">{subtitle}</p> : null}
    </div>
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ variant = 'secondary', className, ...props }: ButtonProps) {
  const base =
    'inline-flex h-10 cursor-pointer items-center justify-center rounded-md px-5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60'
  const variants = {
    primary: 'bg-brand font-semibold text-white hover:bg-brand-deep',
    secondary: 'border border-line bg-surface text-ink hover:bg-canvas',
    ghost: 'cursor-pointer border-none bg-transparent p-0 text-sm text-ink-muted hover:text-ink',
  }
  return <button className={cx(variant === 'ghost' ? variants.ghost : cx(base, variants[variant]), className)} {...props} />
}

/** Rounded blue chip used for prompt context and dataset classifications. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx('rounded-full bg-brand-tint px-3.5 py-1.5 text-[13px] text-brand-deep', className)}
    >
      {children}
    </span>
  )
}

export function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-canvas px-3 py-[5px] text-xs font-semibold whitespace-nowrap">
      {children}
    </span>
  )
}

/**
 * Horizontally scrollable wrapper for the wide data tables. Below `md` the
 * screens render a stacked card list instead — see DatasetsScreen / AuditScreen.
 */
export function TableScroll({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">{children}</div>
    </div>
  )
}
