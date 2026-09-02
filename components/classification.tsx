'use client'

import { CLASSIFICATION_GLYPH, CLASSIFICATION_HELP } from '@/lib/format'
import type { DataClassification } from '@/lib/types'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

const TONE: Record<DataClassification, 'info' | 'neutral' | 'warning' | 'muted'> = {
  OBSERVED: 'info',
  DERIVED: 'neutral',
  IMPUTED: 'neutral',
  SYNTHETIC: 'warning',
  FORECAST: 'muted',
  SCENARIO_ASSUMPTION: 'warning',
}

/**
 * Provenance marker. Carries a glyph as well as colour so the distinction
 * survives greyscale printing and colour-blind viewing.
 */
export function ClassificationBadge({
  classification,
  className,
}: {
  classification: DataClassification
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge tone={TONE[classification]} className={className}>
          <span aria-hidden="true">{CLASSIFICATION_GLYPH[classification]}</span>
          {classification}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{CLASSIFICATION_HELP[classification]}</TooltipContent>
    </Tooltip>
  )
}
