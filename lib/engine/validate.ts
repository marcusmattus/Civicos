/**
 * Model and scenario validation.
 *
 * Runs before a simulation may start. Errors block a run; warnings are shown
 * but may be accepted by the analyst.
 */
import { datasetById, leverById, policyInstruments } from '../data/catalogue'
import type { ScenarioKey, Simulation, ValidationIssue, ValidationReport } from '../types'
import { resolveLevers } from './forecast'

export function validateSimulation(simulation: Simulation, scenario: ScenarioKey): ValidationReport {
  const issues: ValidationIssue[] = []
  const levers = resolveLevers(simulation, scenario)

  /* --- Graph integrity ---------------------------------------------------- */

  const connected = new Set<string>()
  for (const edge of simulation.graph.edges) {
    connected.add(edge.source)
    connected.add(edge.target)
  }
  for (const node of simulation.graph.nodes) {
    if (!connected.has(node.id)) {
      issues.push({
        severity: 'warning',
        code: 'unconnected_node',
        message: `"${node.label}" is not connected to the model and will not affect outcomes.`,
        nodeId: node.id,
      })
    }
  }

  /* --- Datasets ----------------------------------------------------------- */

  for (const node of simulation.graph.nodes) {
    for (const datasetId of node.requiredDatasetIds) {
      const dataset = datasetById.get(datasetId)
      if (!dataset) {
        issues.push({
          severity: 'error',
          code: 'missing_dataset',
          message: `"${node.label}" requires dataset ${datasetId}, which is not in the catalogue.`,
          nodeId: node.id,
        })
        continue
      }
      if (dataset.modelReadiness === 'Blocked') {
        issues.push({
          severity: 'error',
          code: 'missing_dataset',
          message: `${dataset.name} is blocked for model use.`,
          nodeId: node.id,
        })
      }
    }

    // Observed and synthetic inputs must not feed one reported figure unmarked.
    const classes = node.dataSourceIds
      .map((id) => datasetById.get(id)?.classification)
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
    if (classes.includes('SYNTHETIC') && classes.includes('OBSERVED')) {
      issues.push({
        severity: 'warning',
        code: 'mixed_provenance',
        message: `"${node.label}" mixes observed and synthetic inputs — outputs will be labelled SYNTHETIC.`,
        nodeId: node.id,
      })
    }
  }

  /* --- Instruments -------------------------------------------------------- */

  if (simulation.instrumentSlugs.length === 0) {
    issues.push({
      severity: 'error',
      code: 'missing_instrument',
      message: 'Select at least one policy instrument before running the simulation.',
    })
  }

  // A lever only has meaning if the instrument that owns it is selected.
  const selectedLevers = new Set(
    policyInstruments
      .filter((p) => simulation.instrumentSlugs.includes(p.slug))
      .flatMap((p) => p.levers),
  )
  if (levers.monthlyUbi > 0 && !selectedLevers.has('monthly_ubi')) {
    issues.push({
      severity: 'warning',
      code: 'conflict',
      message: 'A monthly UBI value is set but the UBI instrument is not selected — the lever is ignored.',
      leverId: 'monthly_ubi',
    })
  }

  /* --- Assumptions -------------------------------------------------------- */

  if (levers.endYear <= levers.baselineYear) {
    issues.push({
      severity: 'error',
      code: 'invalid_assumption',
      message: 'End year must be later than the baseline year.',
      leverId: 'end_year',
    })
  }

  const config = simulation.scenarios[scenario]
  for (const [leverId, value] of Object.entries(config?.values ?? {})) {
    const def = leverById.get(leverId)
    if (!def) continue
    if (typeof value === 'number' && def.min !== undefined && def.max !== undefined) {
      if (value < def.min || value > def.max) {
        issues.push({
          severity: 'error',
          code: 'invalid_assumption',
          message: `${def.label} is ${value}, outside the permitted range ${def.min}–${def.max}.`,
          leverId,
        })
      }
    }
    if (typeof value === 'string' && def.choices && !def.choices.includes(value)) {
      issues.push({
        severity: 'error',
        code: 'invalid_assumption',
        message: `${def.label} is "${value}", which is not one of ${def.choices.join(', ')}.`,
        leverId,
      })
    }
  }

  // Spending the envelope twice is a conflict, not merely an odd assumption.
  if (levers.investment + levers.trainingBudget > levers.budget) {
    issues.push({
      severity: 'warning',
      code: 'conflict',
      message: `Public investment (£${levers.investment}bn) and training (£${levers.trainingBudget}bn) exceed the £${levers.budget}bn envelope.`,
      leverId: 'public_investment',
    })
  }

  if (levers.cabAdoption > 60 && levers.strictness >= 0.8) {
    issues.push({
      severity: 'warning',
      code: 'conflict',
      message: 'High regulatory strictness is unlikely to be consistent with adoption above 60%.',
      leverId: 'autonomous_cab_adoption',
    })
  }

  return {
    ok: !issues.some((i) => i.severity === 'error'),
    issues,
    checkedAt: new Date().toISOString(),
  }
}
