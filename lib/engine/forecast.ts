/**
 * Deterministic mock forecast engine.
 *
 * Given a simulation and a scenario it produces the same numbers every time —
 * no randomness — so results are reproducible, auditable and testable. The
 * relationships are illustrative, not econometric: they exist to make the
 * decision surface behave coherently when levers move.
 *
 * Replace `buildResultBundle` with a call to the real simulation service; the
 * returned `ResultBundle` shape is what the UI depends on.
 */
import { datasetById, metricById } from '../data/catalogue'
import type {
  DataClassification,
  EvidenceBundle,
  Forecast,
  ResultBundle,
  ScenarioKey,
  Simulation,
  TrajectoryPoint,
} from '../types'

/** Adult residents of Greater London used to size transfer costs. */
const ADULT_POPULATION = 6_900_000

const STRICTNESS_WEIGHT: Record<string, number> = { Low: 0.25, Medium: 0.5, High: 0.8 }
const ADOPTION_WEIGHT: Record<string, number> = { Slow: 0.7, Moderate: 1, Fast: 1.3 }

/** Scenario-level uncertainty multiplier — faster change means wider bands. */
const SCENARIO_SPREAD: Record<ScenarioKey, number> = {
  conservative: 0.85,
  expected: 1,
  accelerated: 1.35,
  intervention: 1.2,
}

export type LeverValues = {
  baselineYear: number
  endYear: number
  budget: number
  growth: number
  population: number
  inflation: number
  techAdoption: number
  cabAdoption: number
  aiHealthAdoption: number
  monthlyUbi: number
  investment: number
  strictness: number
  accessibilityQuota: number
  emptyVehicleCharge: number
  trainingBudget: number
}

function num(value: number | string | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function choice(value: number | string | undefined, table: Record<string, number>, fallback: number): number {
  return typeof value === 'string' && value in table ? table[value]! : fallback
}

export function resolveLevers(simulation: Simulation, scenario: ScenarioKey): LeverValues {
  const values = simulation.scenarios[scenario]?.values ?? {}
  return {
    baselineYear: num(values.baseline_year, simulation.baselineYear),
    endYear: num(values.end_year, simulation.endYear),
    budget: num(values.budget, 10),
    growth: num(values.economic_growth, 1.2),
    population: num(values.population_growth, 0.4),
    inflation: num(values.inflation, 2.2),
    techAdoption: choice(values.technology_adoption, ADOPTION_WEIGHT, 1),
    cabAdoption: num(values.autonomous_cab_adoption, 25),
    aiHealthAdoption: num(values.ai_healthcare_adoption, 35),
    monthlyUbi: num(values.monthly_ubi, 600),
    investment: num(values.public_investment, 10),
    strictness: choice(values.regulatory_strictness, STRICTNESS_WEIGHT, 0.5),
    accessibilityQuota: num(values.accessibility_quota, 15),
    emptyVehicleCharge: num(values.empty_vehicle_charge, 2),
    trainingBudget: num(values.workforce_training_budget, 0.8),
  }
}

function round(value: number, dp = 2): number {
  const f = 10 ** dp
  return Math.round(value * f) / f
}

/* ------------------------------------------------------------- Metric models */

/**
 * Central (P50) estimate for each metric at the end year, expressed in the
 * metric's own unit. Every relationship is monotone in its drivers so moving a
 * lever always moves the outcome in an explainable direction.
 */
export function centralEstimates(l: LeverValues) {
  const gross = (l.monthlyUbi * 12 * ADULT_POPULATION) / 1e9 // £bn per year, gross
  // Offsetting receipts and withdrawn benefits absorb most of the gross cost.
  const offsetRate = 0.824 + l.growth * 0.012
  const ubiGap = gross * (1 - Math.min(0.96, offsetRate))

  const congestion = -(0.3 * l.cabAdoption * l.techAdoption) - 1.5 * l.emptyVehicleCharge + 4 * l.population
  const cabFare =
    3.9 - 0.012 * l.cabAdoption + 0.05 * l.emptyVehicleCharge + 0.006 * l.accessibilityQuota + 0.4 * l.strictness

  const displaced = 1.4 * l.cabAdoption + 0.35 * l.aiHealthAdoption
  const created = 14 * l.trainingBudget + 1.1 * l.investment + 9 * l.growth
  const jobsChanged = created - displaced

  const healthcareCapacity = 0.42 * l.aiHealthAdoption * l.techAdoption + 0.35 * l.investment
  const carbon = -(0.018 * l.cabAdoption) - 0.09 * l.emptyVehicleCharge - 0.02 * l.investment
  const govSpending = l.investment + ubiGap * 0.62 + l.trainingBudget
  const serviceAccess = 61 + 0.14 * l.aiHealthAdoption + 0.12 * l.accessibilityQuota
  const fiscalImpact = -(ubiGap * 0.27) + 1.4 * l.growth + 0.02 * l.cabAdoption - 0.08 * l.investment

  return {
    'met-gov-spending': round(govSpending, 1),
    'met-fiscal-impact': round(fiscalImpact, 1),
    'met-jobs-changed': round(jobsChanged, 0),
    'met-ubi-gap': round(ubiGap, 1),
    'met-cab-fare': round(cabFare, 2),
    'met-congestion': round(congestion, 1),
    'met-healthcare-capacity': round(healthcareCapacity, 1),
    'met-carbon': round(carbon, 2),
    'met-service-access': round(serviceAccess, 1),
  } satisfies Record<string, number>
}

/** Baseline (do-nothing) values the forecasts are compared against. */
const BASELINES: Record<string, number> = {
  'met-gov-spending': 0,
  'met-fiscal-impact': 0,
  'met-jobs-changed': 0,
  'met-ubi-gap': 0,
  'met-cab-fare': 3.9,
  'met-congestion': 0,
  'met-healthcare-capacity': 0,
  'met-carbon': 0,
  'met-service-access': 61,
}

/** Relative width of the P10–P90 band for each metric. */
const METRIC_SPREAD: Record<string, number> = {
  'met-gov-spending': 0.14,
  'met-fiscal-impact': 0.32,
  'met-jobs-changed': 0.28,
  'met-ubi-gap': 0.18,
  'met-cab-fare': 0.12,
  'met-congestion': 0.24,
  'met-healthcare-capacity': 0.2,
  'met-carbon': 0.3,
  'met-service-access': 0.09,
}

const METRIC_MODEL: Record<string, string> = {
  'met-gov-spending': 'mdl-ubi-fiscal',
  'met-fiscal-impact': 'mdl-ubi-fiscal',
  'met-jobs-changed': 'mdl-employment-transition',
  'met-ubi-gap': 'mdl-ubi-fiscal',
  'met-cab-fare': 'mdl-mobility-demand',
  'met-congestion': 'mdl-mobility-demand',
  'met-healthcare-capacity': 'mdl-healthcare-demand',
  'met-carbon': 'mdl-energy-demand',
  'met-service-access': 'mdl-healthcare-demand',
}

const METRIC_SOURCES: Record<string, string[]> = {
  'met-gov-spending': ['ds-hmrc-income', 'ds-ubi-pathway'],
  'met-fiscal-impact': ['ds-hmrc-income', 'ds-ubi-pathway'],
  'met-jobs-changed': ['ds-dwp-employment'],
  'met-ubi-gap': ['ds-hmrc-income', 'ds-ons-population', 'ds-ubi-pathway'],
  'met-cab-fare': ['ds-tfl-road', 'ds-cab-adoption'],
  'met-congestion': ['ds-tfl-road', 'ds-cab-adoption'],
  'met-healthcare-capacity': ['ds-nhs-capacity', 'ds-ons-population'],
  'met-carbon': ['ds-tfl-road'],
  'met-service-access': ['ds-nhs-capacity', 'ds-synthetic-mobility'],
}

/**
 * A metric inherits the weakest provenance of its inputs: any scenario
 * assumption makes the output an assumption, any synthetic input makes it
 * synthetic. Nothing is silently upgraded to OBSERVED.
 */
export function classifyMetric(metricId: string): DataClassification {
  const sources = METRIC_SOURCES[metricId] ?? []
  const classes = sources.map((id) => datasetById.get(id)?.classification).filter(Boolean)
  if (classes.includes('SCENARIO_ASSUMPTION')) return 'SCENARIO_ASSUMPTION'
  if (classes.includes('SYNTHETIC')) return 'SYNTHETIC'
  return 'FORECAST'
}

function formatChange(metricId: string, p50: number, baseline: number): string {
  const metric = metricById.get(metricId)
  const unit = metric?.unit ?? ''
  const delta = p50 - baseline
  if (Math.abs(delta) < 0.005) return 'No change vs baseline'
  const sign = delta > 0 ? '↑' : '↓'
  if (unit === '£/journey') return `${sign} £${Math.abs(delta).toFixed(2)} vs baseline`
  if (unit.startsWith('%')) return `${sign} ${Math.abs(delta).toFixed(1)} pts vs baseline`
  if (unit === '£bn') return `${sign} £${Math.abs(delta).toFixed(1)}bn vs baseline`
  if (unit === 'K jobs') return `${sign} ${Math.abs(delta).toFixed(0)}K vs baseline`
  return `${sign} ${Math.abs(delta).toFixed(2)} ${unit} vs baseline`
}

function toneFor(metricId: string, p50: number, baseline: number): Forecast['tone'] {
  const direction = metricById.get(metricId)?.direction ?? 'neutral'
  const delta = p50 - baseline
  if (Math.abs(delta) < 0.005 || direction === 'neutral') return 'neutral'
  const good = direction === 'up-good' ? delta > 0 : delta < 0
  if (good) return 'positive'
  // A worse-than-baseline outcome is a warning unless it is materially adverse.
  const magnitude = Math.abs(delta) / Math.max(1, Math.abs(baseline) || Math.abs(p50))
  return magnitude > 0.5 ? 'negative' : 'warning'
}

export function computeForecasts(simulation: Simulation, scenario: ScenarioKey): Forecast[] {
  const levers = resolveLevers(simulation, scenario)
  const central = centralEstimates(levers)
  const scenarioSpread = SCENARIO_SPREAD[scenario]

  return Object.entries(central).map(([metricId, p50]) => {
    const metric = metricById.get(metricId)
    const baseline = BASELINES[metricId] ?? 0
    const spread = (METRIC_SPREAD[metricId] ?? 0.2) * scenarioSpread
    const magnitude = Math.max(Math.abs(p50 - baseline), Math.abs(p50) * 0.1, 0.5)
    const band = magnitude * spread

    return {
      metricId,
      label: metric?.label ?? metricId,
      unit: metric?.unit ?? '',
      baseline,
      p10: round(p50 - band, 2),
      p50: round(p50, 2),
      p90: round(p50 + band, 2),
      change: formatChange(metricId, p50, baseline),
      direction: p50 > baseline ? 'up' : p50 < baseline ? 'down' : 'flat',
      tone: toneFor(metricId, p50, baseline),
      sourceDatasetIds: METRIC_SOURCES[metricId] ?? [],
      modelId: METRIC_MODEL[metricId] ?? 'mdl-chronos-2',
      classification: classifyMetric(metricId),
    }
  })
}

/**
 * Year-by-year path to the end-year estimate, following a logistic ramp.
 * Uncertainty widens with distance from the baseline year.
 */
export function computeTrajectory(
  simulation: Simulation,
  scenario: ScenarioKey,
  metricId: string,
): TrajectoryPoint[] {
  const levers = resolveLevers(simulation, scenario)
  const forecast = computeForecasts(simulation, scenario).find((f) => f.metricId === metricId)
  if (!forecast) return []

  const startYear = levers.baselineYear
  const endYear = Math.max(levers.endYear, startYear + 1)
  const span = endYear - startYear
  const total = forecast.p50 - forecast.baseline
  const points: TrajectoryPoint[] = []

  for (let year = startYear; year <= endYear; year++) {
    const t = (year - startYear) / span
    // Logistic S-curve: slow start, steepest mid-horizon, plateau at the end.
    const ramp = 1 / (1 + Math.exp(-9 * (t - 0.45)))
    const rampAtStart = 1 / (1 + Math.exp(-9 * (0 - 0.45)))
    const rampAtEnd = 1 / (1 + Math.exp(-9 * (1 - 0.45)))
    const normalised = (ramp - rampAtStart) / (rampAtEnd - rampAtStart)
    const p50 = forecast.baseline + total * normalised
    const width = (forecast.p90 - forecast.p50) * (0.25 + 0.75 * t)

    points.push({
      year,
      baseline: round(forecast.baseline, 2),
      p10: round(p50 - width, 2),
      p50: round(p50, 2),
      p90: round(p50 + width, 2),
    })
  }

  return points
}

/* ------------------------------------------------- Narrative result sections */

function risksFor(l: LeverValues, scenario: ScenarioKey): ResultBundle['risks'] {
  const risks: ResultBundle['risks'] = []

  if (l.monthlyUbi >= 800) {
    risks.push({
      title: 'Public acceptance of UBI',
      severity: 'high',
      note: `A £${l.monthlyUbi}/month transfer is materially above trialled levels; acceptance is untested at this scale.`,
    })
  } else if (l.monthlyUbi > 0) {
    risks.push({
      title: 'Public acceptance of UBI',
      severity: 'medium',
      note: 'Transfer level is within the range of published trials.',
    })
  }

  if (l.cabAdoption > 35 && l.trainingBudget < 1.5) {
    risks.push({
      title: 'Labour market displacement',
      severity: 'high',
      note: `${l.cabAdoption}% autonomous adoption with only £${l.trainingBudget}bn of reskilling leaves a transition gap.`,
    })
  } else {
    risks.push({
      title: 'Labour market displacement',
      severity: 'medium',
      note: 'Reskilling provision is broadly proportionate to projected displacement.',
    })
  }

  risks.push({
    title: 'Data privacy and security',
    severity: 'medium',
    note: 'Journey-level and health inputs are OFFICIAL-SENSITIVE; aggregation thresholds apply.',
  })

  if (l.investment > 12 || l.monthlyUbi >= 800) {
    risks.push({
      title: 'Fiscal sustainability',
      severity: 'high',
      note: 'Combined transfer and capital commitments exceed the stated envelope in the outer years.',
    })
  } else {
    risks.push({
      title: 'Fiscal sustainability',
      severity: 'medium',
      note: 'Commitments remain within the stated envelope on central assumptions.',
    })
  }

  if (scenario === 'accelerated') {
    risks.push({
      title: 'Forecast uncertainty',
      severity: 'high',
      note: 'Accelerated adoption sits outside the observed range; confidence bands widen sharply after 2035.',
    })
  }

  return risks
}

function interventionsFor(l: LeverValues): ResultBundle['interventions'] {
  const list: ResultBundle['interventions'] = []

  if (l.monthlyUbi > 0) {
    list.push({
      title: 'Phase UBI with work incentives',
      note: 'Introduce in tranches with a taper rather than a single-step award.',
    })
  }
  if (l.trainingBudget < 1.5 && l.cabAdoption > 25) {
    list.push({
      title: 'Increase reskilling provision',
      note: `Raising the training budget above £1.5bn narrows the projected displacement gap.`,
    })
  }
  list.push({
    title: 'Strengthen data governance',
    note: 'Publish provenance and version pinning for every dataset cited in the brief.',
  })
  if (l.emptyVehicleCharge < 2.5) {
    list.push({
      title: 'Dynamic pricing for empty mileage',
      note: 'A higher empty-vehicle charge suppresses deadheading and congestion rebound.',
    })
  }
  if (l.accessibilityQuota < 20) {
    list.push({
      title: 'Raise the accessibility quota',
      note: 'Below 20% the fleet under-serves wheelchair users relative to current provision.',
    })
  }

  return list
}

function groupsFor(l: LeverValues): Pick<ResultBundle, 'positivelyAffected' | 'negativelyAffected'> {
  return {
    positivelyAffected: [
      { group: 'Low-income households', effect: `£${l.monthlyUbi}/month transfer raises net income.` },
      { group: 'Patients awaiting elective care', effect: 'AI triage releases clinician capacity.' },
      { group: 'Outer-borough commuters', effect: 'Lower fares and improved off-peak availability.' },
      ...(l.accessibilityQuota >= 20
        ? [{ group: 'Disabled travellers', effect: 'Accessibility quota expands compliant fleet supply.' }]
        : []),
    ],
    negativelyAffected: [
      { group: 'Licensed drivers', effect: `Displacement concentrated in the first ${Math.round(6 - l.trainingBudget)} years.` },
      { group: 'Private-hire operators', effect: 'Margin compression from autonomous fare competition.' },
      ...(l.emptyVehicleCharge >= 2.5
        ? [{ group: 'Fleet operators', effect: 'Empty-mileage charging raises operating cost.' }]
        : [{ group: 'Inner-city residents', effect: 'Deadheading offsets part of the congestion benefit.' }]),
    ],
  }
}

function evidenceFor(simulation: Simulation, scenario: ScenarioKey): EvidenceBundle {
  const levers = resolveLevers(simulation, scenario)
  const config = simulation.scenarios[scenario]
  const usedDatasetIds = Array.from(new Set(Object.values(METRIC_SOURCES).flat()))

  return {
    datasets: usedDatasetIds.map((id) => {
      const dataset = datasetById.get(id)
      return {
        id,
        name: dataset?.name ?? id,
        version: dataset?.version ?? 'unknown',
        classification: dataset?.classification ?? 'DERIVED',
      }
    }),
    models: Array.from(new Set(Object.values(METRIC_MODEL))).map((id) => ({
      id,
      name: id,
      version: id,
    })),
    assumptions: Object.entries(config?.values ?? {}).map(([key, value]) => ({
      label: key,
      value: String(value),
      classification: 'SCENARIO_ASSUMPTION' as const,
    })),
    parameters: [
      { label: 'Geography', value: simulation.geographySlug },
      { label: 'Horizon', value: `${levers.baselineYear}–${levers.endYear}` },
      { label: 'Budget envelope', value: `£${levers.budget}bn` },
      { label: 'Scenario', value: scenario },
    ],
    approvals: [
      { role: 'Policy reviewer', actor: 'A. Okafor', at: '2026-09-01T11:20:00.000Z', decision: 'Approved' },
      { role: 'Approver', actor: 'M. Reyes', at: '2026-09-02T09:05:00.000Z', decision: 'Pending' },
    ],
  }
}

export function buildResultBundle(
  simulation: Simulation,
  scenario: ScenarioKey,
  options: { partial?: boolean } = {},
): ResultBundle {
  const levers = resolveLevers(simulation, scenario)
  const groups = groupsFor(levers)

  return {
    simulationId: simulation.id,
    scenario,
    confidence: scenario === 'accelerated' ? 'Medium' : scenario === 'conservative' ? 'High' : 'High',
    kpis: computeForecasts(simulation, scenario),
    trajectoryMetricId: 'met-fiscal-impact',
    trajectory: computeTrajectory(simulation, scenario, 'met-fiscal-impact'),
    risks: risksFor(levers, scenario),
    positivelyAffected: groups.positivelyAffected,
    negativelyAffected: groups.negativelyAffected,
    interventions: interventionsFor(levers),
    evidence: evidenceFor(simulation, scenario),
    generatedAt: new Date().toISOString(),
    partial: options.partial ?? false,
  }
}
