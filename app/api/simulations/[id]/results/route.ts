import { NextResponse } from 'next/server'
import { notFound } from '@/lib/api'
import { buildResultBundle } from '@/lib/engine/forecast'
import { scenarioKeySchema } from '@/lib/schemas'
import { repository } from '@/lib/services'
import { getRun } from '@/lib/services/run-engine'

type Context = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Context) {
  const { id } = await params
  const simulation = await repository().getSimulation(id)
  if (!simulation) return notFound('Simulation')

  const requested = new URL(request.url).searchParams.get('scenario')
  const scenario = scenarioKeySchema.safeParse(requested).success
    ? scenarioKeySchema.parse(requested)
    : simulation.activeScenario

  const run = getRun(id)
  const bundle = buildResultBundle(simulation, scenario, { partial: run?.partial ?? false })
  await repository().saveResults(bundle)

  return NextResponse.json({
    results: bundle,
    // Results stay gated until an approver signs off on a high-impact run.
    approvalRequired: run?.status === 'awaiting_approval' || simulation.status === 'awaiting_approval',
  })
}
