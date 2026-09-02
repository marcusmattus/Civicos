'use client'

import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from './utils'

export function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn('relative flex w-full touch-none items-center select-none py-2', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-line-soft">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-civic" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          'block h-4 w-4 rounded-full border-2 border-civic bg-surface',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic',
          // Larger invisible hit area keeps the visual thumb small but touchable.
          'after:absolute after:-inset-3 after:content-[""]',
        )}
      />
    </SliderPrimitive.Root>
  )
}
