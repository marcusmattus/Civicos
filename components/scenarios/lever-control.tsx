'use client'

import { metricById } from '@/lib/data/catalogue'
import { formatLeverValue } from '@/lib/format'
import type { LeverDef } from '@/lib/types'
import { Slider } from '../ui/slider'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { cn } from '../ui/utils'

export function LeverControl({
  lever,
  value,
  onChange,
  locked,
  invalid,
}: {
  lever: LeverDef
  value: number | string
  onChange: (value: number | string) => void
  locked?: boolean
  invalid?: string
}) {
  const id = `lever-${lever.id}`
  const affects = lever.affects.map((m) => metricById.get(m)?.label ?? m)

  return (
    <div className={cn('py-3', locked && 'opacity-55')}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] text-ink">
          {lever.label}
          {locked ? <span className="ml-1.5 text-xs text-muted">(instrument not selected)</span> : null}
        </label>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="tabular cursor-help text-[13px] font-semibold text-ink">
              {formatLeverValue(lever, value)}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{lever.help}</p>
            {affects.length ? (
              <p className="mt-1 text-muted">Affects: {affects.join(', ')}</p>
            ) : null}
          </TooltipContent>
        </Tooltip>
      </div>

      {lever.kind === 'choice' && lever.choices ? (
        <div role="radiogroup" aria-label={lever.label} className="flex gap-1.5">
          {lever.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              role="radio"
              aria-checked={choice === value}
              disabled={locked}
              onClick={() => onChange(choice)}
              className={cn(
                'flex-1 rounded-md border px-2 py-2 text-[13px]',
                choice === value
                  ? 'border-civic bg-civic-tint font-medium text-civic-deep'
                  : 'border-line bg-surface text-ink hover:bg-canvas',
              )}
            >
              {choice}
            </button>
          ))}
        </div>
      ) : lever.kind === 'year' ? (
        <input
          id={id}
          type="number"
          min={lever.min}
          max={lever.max}
          step={lever.step ?? 1}
          disabled={locked}
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-invalid={Boolean(invalid)}
          className="tabular h-10 w-32 rounded-md border border-line px-3 text-sm"
        />
      ) : (
        <Slider
          id={id}
          value={[typeof value === 'number' ? value : 0]}
          min={lever.min ?? 0}
          max={lever.max ?? 100}
          step={lever.step ?? 1}
          disabled={locked}
          onValueChange={([next]) => onChange(next ?? 0)}
          aria-label={lever.label}
        />
      )}

      {invalid ? (
        <p role="alert" className="mt-1 text-xs text-danger">
          {invalid}
        </p>
      ) : null}
    </div>
  )
}
