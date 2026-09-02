import { NextResponse } from 'next/server'
import { badRequest, jsonError, notFound } from '@/lib/api'
import { validateSimulation } from '@/lib/engine/validate'
import { runSchema } from '@/lib/schemas'
import { repository } from '@/lib/services'
import { cancelRun, getRun, startRun } from '@/lib/services/run-engine'

type Context = { params: Promise<{ id: string }> }

/** Start a run. Validation errors block it; warnings do not. */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const parsed = runSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error)

  const simulation = await repository().getSimulation(id)
  if (!simulation) return notFound('Simulation')

  const report = validateSimulation(simulation, parsed.data.scenario)
  if (!report.ok) {
    return jsonError('validation_failed', 'Fix the validation errors before running', 409, report.issues)
  }

  const run = startRun(simulation, parsed.data.scenario)
  await repository().updateSimulation(id, { status: 'running', activeScenario: parsed.data.scenario })
  await repository().appendAudit({
    id: `aud-${Date.now().toString(36)}`,
    at: new Date().toISOString(),
    actor: simulation.owner,
    organisation: simulation.organisation,
    action: 'Run simulation',
    subject: `${simulation.title} — ${parsed.data.scenario}`,
    simulationId: simulation.id,
    datasetVersions: run.datasetVersions,
    modelVersions: run.modelVersions,
    decision: 'Recorded',
  })

  return NextResponse.json({ run }, { status: 202 })
}

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  const run = getRun(id)
  if (!run) return notFound('Run')
  return NextResponse.json({ run })
}

/** Cancel an in-flight run; partial outputs are retained. */
export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params
  const run = cancelRun(id)
  if (!run) return notFound('Run')

  const simulation = await repository().getSimulation(id)
  if (simulation) {
    await repository().updateSimulation(id, { status: 'cancelled' })
    await repository().appendAudit({
      id: `aud-${Date.now().toString(36)}`,
      at: new Date().toISOString(),
      actor: simulation.owner,
      organisation: simulation.organisation,
      action: 'Cancel simulation',
      subject: simulation.title,
      simulationId: simulation.id,
      decision: 'Recorded',
    })
  }

  return NextResponse.json({ run })
}
