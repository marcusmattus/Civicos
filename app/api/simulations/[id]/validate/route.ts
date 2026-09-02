import { NextResponse } from 'next/server'
import { badRequest, notFound } from '@/lib/api'
import { validateSimulation } from '@/lib/engine/validate'
import { runSchema } from '@/lib/schemas'
import { repository } from '@/lib/services'

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Context) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const parsed = runSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error)

  const simulation = await repository().getSimulation(id)
  if (!simulation) return notFound('Simulation')

  const report = validateSimulation(simulation, parsed.data.scenario)
  if (report.ok && simulation.status === 'draft') {
    await repository().updateSimulation(id, { status: 'validated' })
  }

  return NextResponse.json({ report })
}
