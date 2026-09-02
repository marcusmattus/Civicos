import { NextResponse } from 'next/server'
import { notFound } from '@/lib/api'
import { datasetById, modelById } from '@/lib/data/catalogue'
import { buildResultBundle } from '@/lib/engine/forecast'
import { scenarioKeySchema } from '@/lib/schemas'
import { repository } from '@/lib/services'
import { getRun } from '@/lib/services/run-engine'

type Context = { params: Promise<{ id: string }> }

/**
 * The evidence drawer: every dataset version, model version, assumption and
 * parameter that produced the current results, resolved to display names.
 */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params
  const simulation = await repository().getSimulation(id)
  if (!simulation) return notFound('Simulation')

  const requested = new URL(request.url).searchParams.get('scenario')
  const scenario = scenarioKeySchema.safeParse(requested).success
    ? scenarioKeySchema.parse(requested)
    : simulation.activeScenario

  const bundle = buildResultBundle(simulation, scenario)
  const run = getRun(id)

  return NextResponse.json({
    evidence: {
      ...bundle.evidence,
      datasets: bundle.evidence.datasets.map((d) => ({
        ...d,
        source: datasetById.get(d.id)?.source ?? 'Unknown',
        licence: datasetById.get(d.id)?.licence ?? 'Unknown',
        qualityWarnings: datasetById.get(d.id)?.qualityWarnings ?? [],
      })),
      models: bundle.evidence.models.map((m) => ({
        ...m,
        name: modelById.get(m.id)?.name ?? m.id,
        version: modelById.get(m.id)?.version ?? m.version,
        status: modelById.get(m.id)?.status ?? 'Draft',
        limitations: modelById.get(m.id)?.limitations ?? [],
      })),
    },
    runId: run?.runId ?? null,
    generatedAt: bundle.generatedAt,
  })
}
