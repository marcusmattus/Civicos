import { describe, expect, it } from 'vitest'
import {
  buildResultBundle,
  centralEstimates,
  classifyMetric,
  computeForecasts,
  computeTrajectory,
  resolveLevers,
} from '@/lib/engine/forecast'
import { demoSimulation } from '@/lib/data/demo'
import type { Simulation } from '@/lib/types'

function withLever(base: Simulation, leverId: string, value: number | string): Simulation {
  return {
    ...base,
    scenarios: {
      ...base.scenarios,
      expected: {
        ...base.scenarios.expected,
        values: { ...base.scenarios.expected.values, [leverId]: value },
      },
    },
  }
}

describe('forecast engine', () => {
  const simulation = demoSimulation()

  it('is deterministic — the same inputs give the same numbers', () => {
    const first = computeForecasts(simulation, 'expected')
    const second = computeForecasts(simulation, 'expected')
    expect(first).toEqual(second)
  })

  it('orders the confidence band P10 ≤ P50 ≤ P90 for every metric', () => {
    for (const scenario of ['conservative', 'expected', 'accelerated', 'intervention'] as const) {
      for (const forecast of computeForecasts(simulation, scenario)) {
        expect(forecast.p10).toBeLessThanOrEqual(forecast.p50)
        expect(forecast.p50).toBeLessThanOrEqual(forecast.p90)
      }
    }
  })

  it('widens the band for the accelerated scenario', () => {
    const expected = computeForecasts(simulation, 'expected').find(
      (f) => f.metricId === 'met-congestion',
    )!
    const accelerated = computeForecasts(simulation, 'accelerated').find(
      (f) => f.metricId === 'met-congestion',
    )!

    const expectedWidth = expected.p90 - expected.p10
    const acceleratedWidth = accelerated.p90 - accelerated.p10
    expect(acceleratedWidth).toBeGreaterThan(expectedWidth)
  })

  it('moves congestion down as autonomous adoption rises', () => {
    const low = centralEstimates(resolveLevers(withLever(simulation, 'autonomous_cab_adoption', 10), 'expected'))
    const high = centralEstimates(resolveLevers(withLever(simulation, 'autonomous_cab_adoption', 70), 'expected'))
    expect(high['met-congestion']).toBeLessThan(low['met-congestion']!)
  })

  it('grows the UBI funding gap monotonically with the transfer level', () => {
    const gaps = [200, 600, 1000].map(
      (ubi) => centralEstimates(resolveLevers(withLever(simulation, 'monthly_ubi', ubi), 'expected'))['met-ubi-gap']!,
    )
    expect(gaps[0]).toBeLessThan(gaps[1]!)
    expect(gaps[1]).toBeLessThan(gaps[2]!)
  })

  it('raises net jobs as the training budget increases', () => {
    const small = centralEstimates(resolveLevers(withLever(simulation, 'workforce_training_budget', 0.2), 'expected'))
    const large = centralEstimates(resolveLevers(withLever(simulation, 'workforce_training_budget', 4), 'expected'))
    expect(large['met-jobs-changed']).toBeGreaterThan(small['met-jobs-changed']!)
  })
})

describe('provenance classification', () => {
  it('marks a metric fed by a scenario assumption as SCENARIO_ASSUMPTION', () => {
    expect(classifyMetric('met-ubi-gap')).toBe('SCENARIO_ASSUMPTION')
  })

  it('marks a metric fed by synthetic data as SYNTHETIC, never OBSERVED', () => {
    expect(classifyMetric('met-service-access')).toBe('SYNTHETIC')
  })

  it('falls back to FORECAST for purely observed inputs', () => {
    expect(classifyMetric('met-carbon')).toBe('FORECAST')
  })
})

describe('trajectory', () => {
  const simulation = demoSimulation()

  it('covers every year of the horizon inclusive', () => {
    const points = computeTrajectory(simulation, 'expected', 'met-fiscal-impact')
    expect(points).toHaveLength(simulation.endYear - simulation.baselineYear + 1)
    expect(points[0]!.year).toBe(simulation.baselineYear)
    expect(points[points.length - 1]!.year).toBe(simulation.endYear)
  })

  it('starts at the baseline and ends at the end-year median', () => {
    const forecast = computeForecasts(simulation, 'expected').find(
      (f) => f.metricId === 'met-fiscal-impact',
    )!
    const points = computeTrajectory(simulation, 'expected', 'met-fiscal-impact')

    expect(points[0]!.p50).toBeCloseTo(forecast.baseline, 1)
    expect(points[points.length - 1]!.p50).toBeCloseTo(forecast.p50, 1)
  })

  it('widens uncertainty with distance from the baseline year', () => {
    const points = computeTrajectory(simulation, 'expected', 'met-fiscal-impact')
    const firstWidth = points[0]!.p90 - points[0]!.p10
    const lastWidth = points[points.length - 1]!.p90 - points[points.length - 1]!.p10
    expect(lastWidth).toBeGreaterThan(firstWidth)
  })
})

describe('result bundle', () => {
  it('includes evidence for every reported metric', () => {
    const bundle = buildResultBundle(demoSimulation(), 'expected')
    expect(bundle.kpis.length).toBeGreaterThan(0)
    expect(bundle.evidence.datasets.length).toBeGreaterThan(0)
    expect(bundle.evidence.assumptions.every((a) => a.classification === 'SCENARIO_ASSUMPTION')).toBe(
      true,
    )
  })

  it('flags a partial bundle when the run did not finish', () => {
    expect(buildResultBundle(demoSimulation(), 'expected', { partial: true }).partial).toBe(true)
  })

  it('raises fiscal-sustainability risk severity for high-commitment scenarios', () => {
    const intervention = buildResultBundle(demoSimulation(), 'intervention')
    const risk = intervention.risks.find((r) => r.title === 'Fiscal sustainability')
    expect(risk?.severity).toBe('high')
  })
})
