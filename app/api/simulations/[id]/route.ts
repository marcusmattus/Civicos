import { NextResponse } from 'next/server'
import { badRequest, notFound } from '@/lib/api'
import { patchSimulationSchema } from '@/lib/schemas'
import { repository } from '@/lib/services'
import type { SimulationPatch } from '@/lib/services'

type Context = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params
  const simulation = await repository().getSimulation(id)
  if (!simulation) return notFound('Simulation')
  return NextResponse.json({ simulation })
}

export async function PATCH(request: Request, { params }: Context) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = patchSimulationSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error)

  const updated = await repository().updateSimulation(id, parsed.data as SimulationPatch)
  if (!updated) return notFound('Simulation')

  await repository().appendAudit({
    id: `aud-${Date.now().toString(36)}`,
    at: new Date().toISOString(),
    actor: updated.owner,
    organisation: updated.organisation,
    action: 'Modify simulation',
    subject: updated.title,
    simulationId: updated.id,
    decision: 'Recorded',
  })

  return NextResponse.json({ simulation: updated })
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id } = await params
  const deleted = await repository().deleteSimulation(id)
  if (!deleted) return notFound('Simulation')
  return new NextResponse(null, { status: 204 })
}
