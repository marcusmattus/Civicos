import { NextResponse } from 'next/server'
import { badRequest, notFound } from '@/lib/api'
import { approveSchema } from '@/lib/schemas'
import { repository } from '@/lib/services'

type Context = { params: Promise<{ id: string }> }

/**
 * Approver sign-off. High-impact simulations cannot be exported or shared
 * until this records an Approved decision.
 */
export async function POST(request: Request, { params }: Context) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = approveSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error)

  const simulation = await repository().getSimulation(id)
  if (!simulation) return notFound('Simulation')

  const approved = parsed.data.decision === 'Approved'
  const updated = await repository().updateSimulation(id, {
    status: approved ? 'complete' : 'awaiting_approval',
  })

  const entry = await repository().appendAudit({
    id: `aud-${Date.now().toString(36)}`,
    at: new Date().toISOString(),
    actor: 'M. Reyes',
    organisation: 'HM Treasury',
    action: approved ? 'Approve simulation' : 'Deny approval',
    subject: `${simulation.title}${parsed.data.note ? ` — ${parsed.data.note}` : ''}`,
    simulationId: simulation.id,
    decision: approved ? 'Approved' : 'Denied',
  })

  return NextResponse.json({ simulation: updated, audit: entry })
}
