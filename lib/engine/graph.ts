/**
 * Builds the model graph from the analyst's selection.
 *
 * Geography → Industries → Policy instruments → Assumptions → Metrics → Outcomes
 */
import { geographies, industries, metrics, policyInstruments } from '../data/catalogue'
import type { ModelEdge, ModelGraph, ModelNode } from '../types'

const COLUMN_X = {
  geography: 0,
  industry: 260,
  instrument: 540,
  assumption: 820,
  metric: 1060,
  outcome: 1300,
}

const ROW_HEIGHT = 110

/** Datasets and models each industry brings with it. */
const INDUSTRY_WIRING: Record<string, { datasets: string[]; model?: string; metrics: string[] }> = {
  transport: {
    datasets: ['ds-tfl-road', 'ds-cab-adoption'],
    model: 'mdl-mobility-demand',
    metrics: ['met-congestion', 'met-cab-fare', 'met-carbon'],
  },
  healthcare: {
    datasets: ['ds-nhs-capacity', 'ds-ons-population'],
    model: 'mdl-healthcare-demand',
    metrics: ['met-healthcare-capacity', 'met-service-access'],
  },
  employment: {
    datasets: ['ds-dwp-employment'],
    model: 'mdl-employment-transition',
    metrics: ['met-jobs-changed'],
  },
  'public-finance': {
    datasets: ['ds-hmrc-income'],
    model: 'mdl-ubi-fiscal',
    metrics: ['met-fiscal-impact', 'met-gov-spending'],
  },
  energy: { datasets: [], model: 'mdl-energy-demand', metrics: ['met-carbon'] },
  housing: { datasets: ['ds-ons-population'], metrics: ['met-service-access'] },
  education: { datasets: ['ds-ons-population'], metrics: ['met-service-access'] },
  agriculture: { datasets: [], metrics: ['met-carbon'] },
  'smart-cities': { datasets: ['ds-synthetic-mobility'], metrics: ['met-congestion'] },
  'social-care': { datasets: ['ds-nhs-capacity'], metrics: ['met-service-access'] },
}

const INSTRUMENT_WIRING: Record<string, { datasets: string[]; model?: string; metrics: string[] }> = {
  ubi: {
    datasets: ['ds-hmrc-income', 'ds-ubi-pathway'],
    model: 'mdl-ubi-fiscal',
    metrics: ['met-ubi-gap', 'met-fiscal-impact'],
  },
  'public-spending': { datasets: [], metrics: ['met-gov-spending'] },
  regulation: { datasets: [], metrics: ['met-congestion'] },
  licensing: { datasets: [], metrics: ['met-cab-fare', 'met-service-access'] },
  'workforce-training': { datasets: ['ds-dwp-employment'], metrics: ['met-jobs-changed'] },
  taxation: { datasets: ['ds-hmrc-income'], metrics: ['met-fiscal-impact'] },
  subsidies: { datasets: [], metrics: ['met-gov-spending'] },
  'infrastructure-investment': { datasets: [], metrics: ['met-gov-spending', 'met-congestion'] },
  procurement: { datasets: [], metrics: ['met-gov-spending'] },
  'regulatory-sandbox': { datasets: ['ds-synthetic-mobility'], metrics: ['met-congestion'] },
}

function centreY(count: number, index: number, tallest: number): number {
  const offset = ((tallest - count) * ROW_HEIGHT) / 2
  return offset + index * ROW_HEIGHT
}

export function buildGraphFromSelection(
  geographySlug: string,
  industrySlugs: string[],
  instrumentSlugs: string[],
): ModelGraph {
  const selectedIndustries = industries.filter((i) => industrySlugs.includes(i.slug))
  const selectedInstruments = policyInstruments.filter((p) => instrumentSlugs.includes(p.slug))
  const geography = geographies.find((g) => g.slug === geographySlug)
  const tallest = Math.max(selectedIndustries.length, selectedInstruments.length, 1)

  const nodes: ModelNode[] = []
  const edges: ModelEdge[] = []

  const geographyNode: ModelNode = {
    id: 'n-geo',
    type: 'geography',
    label: geography?.name ?? geographySlug,
    description: `Modelled area for every downstream estimate.`,
    position: { x: COLUMN_X.geography, y: centreY(1, 0, tallest) },
    dataSourceIds: ['ds-ons-population'],
    assumptions: ['Boundaries fixed across the horizon'],
    requiredDatasetIds: ['ds-ons-population'],
    metricIds: [],
    validation: 'valid',
  }
  nodes.push(geographyNode)

  selectedIndustries.forEach((industry, i) => {
    const wiring = INDUSTRY_WIRING[industry.slug] ?? { datasets: [], metrics: [] }
    const id = `n-ind-${industry.slug}`
    nodes.push({
      id,
      type: 'industry',
      label: industry.name,
      description: industry.description,
      position: { x: COLUMN_X.industry, y: centreY(selectedIndustries.length, i, tallest) },
      dataSourceIds: wiring.datasets,
      modelId: wiring.model,
      assumptions: [],
      requiredDatasetIds: wiring.datasets.slice(0, 1),
      metricIds: wiring.metrics,
      validation: wiring.model ? 'valid' : 'warning',
      validationNote: wiring.model ? undefined : 'No approved model is registered for this sector.',
    })
    edges.push({ id: `e-geo-${industry.slug}`, source: 'n-geo', target: id })
  })

  selectedInstruments.forEach((instrument, i) => {
    const wiring = INSTRUMENT_WIRING[instrument.slug] ?? { datasets: [], metrics: [] }
    const id = `n-pi-${instrument.slug}`
    nodes.push({
      id,
      type: 'instrument',
      label: instrument.name,
      description: instrument.description,
      position: { x: COLUMN_X.instrument, y: centreY(selectedInstruments.length, i, tallest) },
      dataSourceIds: wiring.datasets,
      modelId: wiring.model,
      assumptions: [],
      requiredDatasetIds: [],
      metricIds: wiring.metrics,
      validation: 'valid',
    })

    // Attach each instrument to the industry it most plausibly acts on.
    const host = selectedIndustries[Math.min(i, Math.max(0, selectedIndustries.length - 1))]
    if (host) {
      edges.push({ id: `e-${host.slug}-${instrument.slug}`, source: `n-ind-${host.slug}`, target: id })
    } else {
      edges.push({ id: `e-geo-${instrument.slug}`, source: 'n-geo', target: id })
    }
  })

  const assumptionsNode: ModelNode = {
    id: 'n-assumptions',
    type: 'assumption',
    label: 'Scenario assumptions',
    description: 'Growth, inflation, population and adoption assumptions per scenario.',
    position: { x: COLUMN_X.assumption, y: centreY(1, 0, tallest) },
    dataSourceIds: ['ds-ubi-pathway'],
    assumptions: ['Assumptions are inputs, not observations'],
    requiredDatasetIds: [],
    metricIds: [],
    validation: 'valid',
  }
  nodes.push(assumptionsNode)
  for (const instrument of selectedInstruments) {
    edges.push({
      id: `e-${instrument.slug}-assumptions`,
      source: `n-pi-${instrument.slug}`,
      target: 'n-assumptions',
    })
  }
  if (selectedInstruments.length === 0) {
    edges.push({ id: 'e-geo-assumptions', source: 'n-geo', target: 'n-assumptions' })
  }

  const metricIds = Array.from(
    new Set(
      [...selectedIndustries, ...selectedInstruments].flatMap((entity) => {
        const wiring =
          INDUSTRY_WIRING[entity.slug] ?? INSTRUMENT_WIRING[entity.slug] ?? { metrics: [] }
        return wiring.metrics
      }),
    ),
  )

  nodes.push({
    id: 'n-metrics',
    type: 'metric',
    label: 'Metrics',
    description: `${metricIds.length || metrics.length} reported metrics with confidence bands.`,
    position: { x: COLUMN_X.metric, y: centreY(1, 0, tallest) },
    dataSourceIds: [],
    assumptions: [],
    requiredDatasetIds: [],
    metricIds: metricIds.length ? metricIds : metrics.map((m) => m.id),
    validation: 'valid',
  })
  edges.push({ id: 'e-assumptions-metrics', source: 'n-assumptions', target: 'n-metrics' })

  nodes.push({
    id: 'n-outcomes',
    type: 'outcome',
    label: 'Outcomes',
    description: 'Decision-ready outcomes with evidence references.',
    position: { x: COLUMN_X.outcome, y: centreY(1, 0, tallest) },
    dataSourceIds: [],
    assumptions: [],
    requiredDatasetIds: [],
    metricIds: [],
    validation: 'valid',
  })
  edges.push({ id: 'e-metrics-outcomes', source: 'n-metrics', target: 'n-outcomes' })

  return { nodes, edges }
}
