'use client'

import dynamic from 'next/dynamic'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LAYER_IDS, LAYER_META } from '@/lib/data/mobility-geo'
import type { LayerId } from '@/lib/data/mobility-geo'
import {
  DEFAULT_CONTROLS,
  fleetMix,
  licensingWarnings,
  simulateMobility,
} from '@/lib/engine/mobility'
import type { MobilityControls } from '@/lib/engine/mobility'
import { PageHeader } from '../page-header'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardDescription, CardTitle } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { HumanDecisionBanner, Skeleton } from '../ui/feedback'
import { Slider } from '../ui/slider'
import { cn } from '../ui/utils'

// MapLibre touches `window` at import time, so it never renders on the server.
const MobilityMap = dynamic(() => import('./mobility-map').then((m) => m.MobilityMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
})

const TONE_TEXT = {
  positive: 'text-teal',
  negative: 'text-danger',
  warning: 'text-warning',
  neutral: 'text-muted',
} as const

const TONE_GLYPH = { positive: '▲', negative: '▼', warning: '◆', neutral: '–' } as const

type NumericControl = {
  id: keyof MobilityControls
  label: string
  min: number
  max: number
  step: number
  format: (value: number) => string
  help: string
}

const NUMERIC_CONTROLS: NumericControl[] = [
  {
    id: 'fleetSize',
    label: 'Fleet size',
    min: 0,
    max: 12000,
    step: 100,
    format: (v) => `${v.toLocaleString('en-GB')} vehicles`,
    help: 'Licensed autonomous vehicles permitted in the zone.',
  },
  {
    id: 'operatingHours',
    label: 'Operating hours',
    min: 4,
    max: 24,
    step: 1,
    format: (v) => `${v} h/day`,
    help: 'Hours per day the licence permits operation.',
  },
  {
    id: 'fare',
    label: 'Base fare',
    min: 1,
    max: 10,
    step: 0.1,
    format: (v) => `£${v.toFixed(2)}`,
    help: 'Operator base fare before compliance costs.',
  },
  {
    id: 'accessibilityQuota',
    label: 'Accessibility quota',
    min: 0,
    max: 60,
    step: 1,
    format: (v) => `${v}%`,
    help: 'Minimum share of the fleet that must be wheelchair accessible.',
  },
  {
    id: 'emptyMileage',
    label: 'Empty mileage',
    min: 0,
    max: 50,
    step: 1,
    format: (v) => `${v}%`,
    help: 'Share of vehicle miles run without a passenger.',
  },
  {
    id: 'congestionCharge',
    label: 'Congestion charge',
    min: 0,
    max: 8,
    step: 0.25,
    format: (v) => `£${v.toFixed(2)}/mile`,
    help: 'Charge applied per mile inside the congestion zone.',
  },
  {
    id: 'insuranceCover',
    label: 'Insurance cover',
    min: 0,
    max: 25,
    step: 0.5,
    format: (v) => `£${v}m/vehicle`,
    help: 'Third-party cover carried per licensed vehicle.',
  },
  {
    id: 'remoteOperators',
    label: 'Remote operators',
    min: 0,
    max: 30,
    step: 1,
    format: (v) => `${v} per 100`,
    help: 'Remote supervisors on duty per 100 vehicles.',
  },
]

const CHOICE_CONTROLS = [
  {
    id: 'licensingConditions' as const,
    label: 'Licensing conditions',
    choices: ['Light', 'Standard', 'Strict'] as const,
    help: 'How tightly operators are constrained by licence conditions.',
  },
  {
    id: 'safetyRequirements' as const,
    label: 'Safety requirements',
    choices: ['Baseline', 'Enhanced', 'Full independent audit'] as const,
    help: 'Depth of safety case required before operation.',
  },
]

export function MobilityScreen() {
  const [controls, setControls] = useState<MobilityControls>(DEFAULT_CONTROLS)
  const [selected, setSelected] = useState<{ title: string; detail: string } | null>(null)
  const [visible, setVisible] = useState<Record<LayerId, boolean>>(
    () => Object.fromEntries(LAYER_IDS.map((id) => [id, true])) as Record<LayerId, boolean>,
  )

  const outcomes = useMemo(() => simulateMobility(controls), [controls])
  const mix = useMemo(() => fleetMix(controls), [controls])
  const warnings = useMemo(() => licensingWarnings(controls), [controls])

  function setNumeric(id: keyof MobilityControls, value: number) {
    setControls((current) => ({ ...current, [id]: value }))
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        title="MobilitySim"
        description="Autonomous-transport sandbox for Greater London. Adjust licence conditions and see the modelled effect on passengers, congestion, employment and safety."
        actions={
          <Button className="gap-1.5" onClick={() => setControls(DEFAULT_CONTROLS)}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset controls
          </Button>
        }
      />

      <HumanDecisionBanner
        className="mb-4"
        note="Zones and incidents are illustrative, not official boundaries."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        <section aria-labelledby="controls-heading" className="space-y-4">
          <Card className="p-5">
            <CardTitle id="controls-heading">Operating controls</CardTitle>
            <CardDescription className="mt-0.5 mb-3">
              Every value here is a licence condition, not an observation.
            </CardDescription>

            <div className="divide-y divide-line-soft">
              {NUMERIC_CONTROLS.map((control) => {
                const value = controls[control.id] as number
                return (
                  <div key={control.id} className="py-3">
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <label htmlFor={`mc-${control.id}`} className="text-[13px] text-ink">
                        {control.label}
                      </label>
                      <span className="tabular text-[13px] font-semibold">
                        {control.format(value)}
                      </span>
                    </div>
                    <Slider
                      id={`mc-${control.id}`}
                      value={[value]}
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      aria-label={control.label}
                      onValueChange={([next]) => setNumeric(control.id, next ?? 0)}
                    />
                    <p className="mt-1 text-xs text-muted">{control.help}</p>
                  </div>
                )
              })}

              {CHOICE_CONTROLS.map((control) => (
                <div key={control.id} className="py-3">
                  <div className="mb-1.5 text-[13px] text-ink">{control.label}</div>
                  <div role="radiogroup" aria-label={control.label} className="flex flex-wrap gap-1.5">
                    {control.choices.map((choice) => {
                      const active = controls[control.id] === choice
                      return (
                        <button
                          key={choice}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() =>
                            setControls((current) => ({ ...current, [control.id]: choice }))
                          }
                          className={cn(
                            'rounded-md border px-2.5 py-2 text-[13px]',
                            active
                              ? 'border-civic bg-civic-tint font-medium text-civic-deep'
                              : 'border-line bg-surface text-ink hover:bg-canvas',
                          )}
                        >
                          {choice}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-1 text-xs text-muted">{control.help}</p>
                </div>
              ))}
            </div>
          </Card>

          {warnings.length > 0 ? (
            <Card className="border-warning-line bg-warning-tint p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-warning-ink">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {warnings.length} licensing {warnings.length === 1 ? 'concern' : 'concerns'}
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-warning-ink">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </Card>
          ) : (
            <Card className="border-teal-line bg-teal-tint p-4 text-[13px] text-teal">
              ✓ No licensing concerns at these settings.
            </Card>
          )}
        </section>

        <section aria-labelledby="map-heading" className="space-y-4">
          <Card className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-4">
              <CardTitle id="map-heading">Zone map</CardTitle>
              <CardDescription>
                Click a zone or marker for detail. Layers below toggle what is drawn.
              </CardDescription>
            </div>
            <div className="h-[460px] w-full sm:h-[560px]">
              <MobilityMap visible={visible} onSelect={setSelected} />
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
            <Card className="p-4">
              <CardTitle>Map layers</CardTitle>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {LAYER_IDS.map((id) => {
                  const meta = LAYER_META[id]
                  return (
                    <li key={id}>
                      <label className="flex cursor-pointer items-start gap-2.5">
                        <Checkbox
                          checked={visible[id]}
                          onCheckedChange={(next) =>
                            setVisible((current) => ({ ...current, [id]: next === true }))
                          }
                          aria-label={meta.label}
                        />
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                            <span
                              aria-hidden="true"
                              className={cn(
                                'inline-block h-2.5 w-2.5 shrink-0 border',
                                meta.shape === 'area' ? 'rounded-[2px]' : 'rounded-full',
                              )}
                              style={{ background: `${meta.swatch}33`, borderColor: meta.swatch }}
                            />
                            {meta.label}
                          </span>
                          <span className="block text-xs text-muted">{meta.description}</span>
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </Card>

            <Card className="p-4">
              <CardTitle>Selected feature</CardTitle>
              {selected ? (
                <div className="mt-2">
                  <div className="text-[13px] font-medium text-ink">{selected.title}</div>
                  <p className="mt-1 text-xs text-muted">{selected.detail}</p>
                </div>
              ) : (
                <p className="mt-2 text-[13px] text-faint">
                  Nothing selected. Click a zone or marker on the map.
                </p>
              )}
            </Card>
          </div>
        </section>
      </div>

      <section aria-labelledby="outcomes-heading" className="mt-6">
        <h2 id="outcomes-heading" className="mb-3 text-base font-semibold">
          Modelled outcomes
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {outcomes.map((outcome) => (
            <Card key={outcome.id} className="p-4">
              <div className="text-xs text-muted">{outcome.label}</div>
              <div className="tabular mt-1 text-xl font-bold text-ink">{outcome.display}</div>
              <div className={cn('tabular mt-1 text-xs font-medium', TONE_TEXT[outcome.tone])}>
                <span aria-hidden="true">{TONE_GLYPH[outcome.tone]}</span> {outcome.change}
              </div>
              <p className="mt-2 border-t border-line-soft pt-2 text-[11px] text-muted">
                {outcome.note}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="fleet-heading" className="mt-6">
        <Card className="p-5">
          <CardTitle id="fleet-heading">Fleet composition</CardTitle>
          <CardDescription className="mt-0.5 mb-3">
            Implied mix at {controls.fleetSize.toLocaleString('en-GB')} licensed autonomous vehicles.
          </CardDescription>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-[13px]">
              <caption className="sr-only">
                Vehicle classes with implied vehicle counts and share of the total fleet.
              </caption>
              <thead>
                <tr className="bg-canvas">
                  <th scope="col" className="border-b border-line px-3 py-2 text-left text-xs font-medium text-muted">
                    Vehicle class
                  </th>
                  <th scope="col" className="border-b border-line px-3 py-2 text-right text-xs font-medium text-muted">
                    Vehicles
                  </th>
                  <th scope="col" className="border-b border-line px-3 py-2 text-right text-xs font-medium text-muted">
                    Share
                  </th>
                  <th scope="col" className="border-b border-line px-3 py-2 text-left text-xs font-medium text-muted">
                    Relative size
                  </th>
                </tr>
              </thead>
              <tbody>
                {mix.map((entry) => (
                  <tr key={entry.vehicleClass}>
                    <th scope="row" className="border-b border-line-soft px-3 py-2 text-left font-medium">
                      {entry.label}
                    </th>
                    <td className="tabular border-b border-line-soft px-3 py-2 text-right">
                      {entry.vehicles.toLocaleString('en-GB')}
                    </td>
                    <td className="tabular border-b border-line-soft px-3 py-2 text-right">
                      {entry.share}%
                    </td>
                    <td className="border-b border-line-soft px-3 py-2">
                      <span
                        aria-hidden="true"
                        className="block h-1.5 rounded-full bg-civic"
                        style={{ width: `${Math.max(1, Math.min(100, entry.share))}%` }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="muted">Illustrative demonstration data</Badge>
            <Badge tone="muted">Deterministic model — same controls, same outcomes</Badge>
          </div>
        </Card>
      </section>
    </div>
  )
}
