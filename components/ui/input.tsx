'use client'

import * as LabelPrimitive from '@radix-ui/react-label'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from './utils'

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn('block text-[13px] font-medium text-ink', className)}
      {...props}
    />
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-11 w-full rounded-md border border-line bg-surface px-3.5 text-[15px] text-ink',
        'placeholder:text-faint focus:border-civic focus:outline-none',
        'aria-[invalid=true]:border-danger disabled:bg-canvas disabled:text-muted',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full resize-none rounded-md border border-line bg-surface p-3 text-sm text-ink',
        'placeholder:text-faint focus:border-civic focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return (
    <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-[13px] text-danger">
      <span aria-hidden="true">⚠</span>
      {children}
    </p>
  )
}
