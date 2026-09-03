import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONTROLS,
  fleetMix,
  licensingWarnings,
  simulateMobility,
} from '@/lib/engine/mobility'
import type { MobilityControls } from '@/lib/engine/mobility'

function withControls(patch: Partial<MobilityControls>): MobilityControls {
  return { ...DEFAULT_CONTROLS, ...patch }
}

function outcome(controls: MobilityControls, id: string) {
  const found = simulateMobility(controls).find((o) => o.id === id)
  if (!found) throw new Error(`no outcome ${id}`)
  return found
}

describe('mobility model', () => {
  it('is deterministic', () => {
    expect(simulateMobility(DEFAULT_CONTROLS)).toEqual(simulateMobility(DEFAULT_CONTROLS))
  })

  it('reports all eight outcomes', () => {
    expect(simulateMobility(DEFAULT_CONTROLS).map((o) => o.id)).toEqual([
      'wait-time',
      'fare',
      'congestion',
      'empty-mileage',
      'employment',
      'public-transport',
      'energy',
      'safety',
    ])
  })

  it('shortens wait times as the fleet grows', () => {
    const small = outcome(withControls({ fleetSize: 500 }), 'wait-time').value
    const large = outcome(withControls({ fleetSize: 9000 }), 'wait-time').value
    expect(large).toBeLessThan(small)
  })

  it('never drops wait time below the modelled floor', () => {
    expect(outcome(withControls({ fleetSize: 12000, operatingHours: 24 }), 'wait-time').value)
      .toBeGreaterThanOrEqual(1.6)
  })

  it('suppresses congestion and empty running as the empty-vehicle charge rises', () => {
    const cheap = withControls({ congestionCharge: 0 })
    const dear = withControls({ congestionCharge: 6 })
    expect(outcome(dear, 'congestion').value).toBeLessThan(outcome(cheap, 'congestion').value)
    expect(outcome(dear, 'empty-mileage').value).toBeLessThan(outcome(cheap, 'empty-mileage').value)
  })

  it('keeps empty mileage physically plausible', () => {
    expect(outcome(withControls({ emptyMileage: 0, congestionCharge: 8 }), 'empty-mileage').value)
      .toBeGreaterThanOrEqual(3)
  })

  it('raises fares when compliance costs rise', () => {
    const light = withControls({ licensingConditions: 'Light', insuranceCover: 1 })
    const strict = withControls({ licensingConditions: 'Strict', insuranceCover: 20 })
    expect(outcome(strict, 'fare').value).toBeGreaterThan(outcome(light, 'fare').value)
  })

  it('improves safety outcomes with a deeper safety case', () => {
    const baseline = withControls({ safetyRequirements: 'Baseline' })
    const audited = withControls({ safetyRequirements: 'Full independent audit' })
    expect(outcome(audited, 'safety').value).toBeLessThan(outcome(baseline, 'safety').value)
  })

  it('costs licensed-driver jobs as the autonomous fleet grows', () => {
    const small = outcome(withControls({ fleetSize: 500 }), 'employment').value
    const large = outcome(withControls({ fleetSize: 10000 }), 'employment').value
    expect(large).toBeLessThan(small)
  })
})

describe('fleet mix', () => {
  it('shares sum to about 100%', () => {
    const total = fleetMix(DEFAULT_CONTROLS).reduce((sum, entry) => sum + entry.share, 0)
    expect(total).toBeGreaterThan(99.4)
    expect(total).toBeLessThan(100.6)
  })

  it('displaces conventional classes as autonomous supply grows', () => {
    const cabsSmall = fleetMix(withControls({ fleetSize: 500 })).find((e) => e.vehicleClass === 'black-cab')!
    const cabsLarge = fleetMix(withControls({ fleetSize: 10000 })).find((e) => e.vehicleClass === 'black-cab')!
    expect(cabsLarge.vehicles).toBeLessThan(cabsSmall.vehicles)
  })

  it('never displaces a class entirely', () => {
    for (const entry of fleetMix(withControls({ fleetSize: 12000 }))) {
      expect(entry.vehicles).toBeGreaterThan(0)
    }
  })
})

describe('licensing warnings', () => {
  it('accepts the default sandbox settings', () => {
    expect(licensingWarnings(DEFAULT_CONTROLS)).toEqual([])
  })

  it('flags an accessibility quota below the licensed-taxi standard', () => {
    expect(licensingWarnings(withControls({ accessibilityQuota: 5 })).join(' ')).toMatch(
      /accessibility quota/i,
    )
  })

  it('flags thin remote supervision on a baseline safety case', () => {
    expect(
      licensingWarnings(withControls({ remoteOperators: 1, safetyRequirements: 'Baseline' })).join(' '),
    ).toMatch(/remote operators/i)
  })

  it('flags sub-statutory insurance cover', () => {
    expect(licensingWarnings(withControls({ insuranceCover: 1 })).join(' ')).toMatch(/insurance/i)
  })
})
