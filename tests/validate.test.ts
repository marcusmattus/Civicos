import { describe, expect, it } from 'vitest'
import { demoSimulation } from '@/lib/data/demo'
import { validateSimulation } from '@/lib/engine/validate'
import type { Simulation } from '@/lib/types'

function withValues(base: Simulation, values: Record<string, number | string>): Simulation {
  return {
    ...base,
    scenarios: {
      ...base.scenarios,
      expected: {
        ...base.scenarios.expected,
        values: { ...base.scenarios.expected.values, ...values },
      },
    },
  }
}

describe('validateSimulation', () => {
  it('passes the seeded demonstration simulation', () => {
    const report = validateSimulation(demoSimulation(), 'expected')
    expect(report.ok).toBe(true)
    expect(report.issues.filter((i) => i.severity === 'error')).toHaveLength(0)
  })

  it('rejects an end year that is not after the baseline year', () => {
    const report = validateSimulation(withValues(demoSimulation(), { end_year: 2027 }), 'expected')
    expect(report.ok).toBe(false)
    expect(report.issues.some((i) => i.code === 'invalid_assumption' && i.leverId === 'end_year')).toBe(
      true,
    )
  })

  it('rejects a lever outside its permitted range', () => {
    const report = validateSimulation(
      withValues(demoSimulation(), { autonomous_cab_adoption: 250 }),
      'expected',
    )
    expect(report.ok).toBe(false)
    expect(report.issues.some((i) => i.leverId === 'autonomous_cab_adoption')).toBe(true)
  })

  it('errors when no policy instrument is selected', () => {
    const report = validateSimulation({ ...demoSimulation(), instrumentSlugs: [] }, 'expected')
    expect(report.ok).toBe(false)
    expect(report.issues.some((i) => i.code === 'missing_instrument')).toBe(true)
  })

  it('warns — but does not block — when commitments exceed the envelope', () => {
    const report = validateSimulation(
      withValues(demoSimulation(), { public_investment: 20, budget: 10 }),
      'expected',
    )
    expect(report.ok).toBe(true)
    expect(report.issues.some((i) => i.code === 'conflict' && i.severity === 'warning')).toBe(true)
  })

  it('warns about an unconnected node rather than failing the run', () => {
    const base = demoSimulation()
    const simulation: Simulation = {
      ...base,
      graph: {
        ...base.graph,
        nodes: [
          ...base.graph.nodes,
          {
            id: 'n-orphan',
            type: 'metric',
            label: 'Orphan metric',
            description: 'Not connected to anything.',
            position: { x: 0, y: 0 },
            dataSourceIds: [],
            assumptions: [],
            requiredDatasetIds: [],
            metricIds: [],
            validation: 'warning',
          },
        ],
      },
    }

    const report = validateSimulation(simulation, 'expected')
    expect(report.ok).toBe(true)
    expect(report.issues.some((i) => i.code === 'unconnected_node' && i.nodeId === 'n-orphan')).toBe(
      true,
    )
  })

  it('warns when observed and synthetic data feed one node', () => {
    const base = demoSimulation()
    const simulation: Simulation = {
      ...base,
      graph: {
        ...base.graph,
        nodes: base.graph.nodes.map((node) =>
          node.id === 'n-ind-transport'
            ? { ...node, dataSourceIds: ['ds-tfl-road', 'ds-synthetic-mobility'] }
            : node,
        ),
      },
    }

    const report = validateSimulation(simulation, 'expected')
    expect(report.issues.some((i) => i.code === 'mixed_provenance')).toBe(true)
  })
})
