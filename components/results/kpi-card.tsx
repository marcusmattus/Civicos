'use client'

import { datasetById, modelById } from '@/lib/data/catalogue'
import { formatMetricValue, formatRange } from '@/lib/format'
import type { Forecast } from '@/lib/types'
import { ClassificationBadge } from '../classification'
import { Card } from '../ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { cn } from '../ui/utils'

const TONE_TEXT = {
  positive: 'text-teal',
  negative: 'text-danger',
  warning: 'text-warning',
  neutral: 'text-muted',
} as const

const TONE_GLYPH = {
  positive: '▲',
  negative: '▼',
  warning: '◆',
  neutral: '–',
} as const

/**
 * Every forecast displays baseline, P10/P50/P90, unit, change, source, model
 * and provenance classification — the spec's minimum for a decision-grade
 * number.
 */
export function KpiCard({ forecast }: { forecast: Forecast }) {
  const model = modelById.get(forecast.modelId)
  const sources = forecast.sourceDatasetIds.map((id) => datasetById.get(id)?.name ?? id)

  return (
    <Card className="flex flex-col p-4">
      <span className="mb-1.5 text-xs text-muted">{forecast.label}</span>

      <Tooltip>
        <TooltipTrigger asChild>
          <span className="tabular cursor-help text-xl font-bold text-ink">
            {formatMetricValue(forecast)}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">
            {forecast.label} ({forecast.unit})
          </p>
          <ul className="mt-1 space-y-0.5">
            <li>Baseline: {forecast.baseline}</li>
            <li>P10: {forecast.p10}</li>
            <li>P50 (median): {forecast.p50}</li>
            <li>P90: {forecast.p90}</li>
            <li>Model: {model?.name ?? forecast.modelId}</li>
            <li>Sources: {sources.join(', ') || 'none'}</li>
          </ul>
        </TooltipContent>
      </Tooltip>

      <div className={cn('tabular mt-1 text-xs font-medium', TONE_TEXT[forecast.tone])}>
        <span aria-hidden="true">{TONE_GLYPH[forecast.tone]}</span> {forecast.change}
      </div>

      {/* Provenance gets its own row: the longest label (SCENARIO_ASSUMPTION)
          must never be truncated, or two classifications become ambiguous. */}
      <ClassificationBadge classification={forecast.classification} className="mt-2.5 w-fit" />

      <dl className="mt-3 space-y-1 border-t border-line-soft pt-2.5 text-[11px] text-muted">
        <div className="flex justify-between gap-2">
          <dt>P10–P90</dt>
          <dd className="tabular text-ink">{formatRange(forecast)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Baseline</dt>
          <dd className="tabular text-ink">
            {formatMetricValue({ unit: forecast.unit, p50: forecast.baseline })}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>Model</dt>
          <dd className="truncate text-ink" title={model?.name}>
            {model?.name ?? forecast.modelId}
          </dd>
        </div>
      </dl>
    </Card>
  )
}
