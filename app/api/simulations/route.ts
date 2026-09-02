import { NextResponse } from 'next/server'
import { badRequest } from '@/lib/api'
import { demoGraph, demoScenarios } from '@/lib/data/demo'
import { selectionsFromPrompt } from '@/lib/engine/references'
import { createSimulationSchema } from '@/lib/schemas'
import { repository } from '@/lib/services'
import type { Simulation } from '@/lib/types'

export async function GET() {
  const simulations = await repository().listSimulations()
  return NextResponse.json({ simulations })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = createSimulationSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error)

  const input = parsed.data
  // References written into the prompt seed the initial selection.
  const fromPrompt = selectionsFromPrompt(input.prompt)
  const now = new Date().toISOString()

  const simulation: Simulation = {
    id: `sim-${Date.now().toString(36)}`,
    title: input.title,
    prompt: input.prompt,
    geographySlug: fromPrompt.geographySlug ?? input.geographySlug,
    budgetGbp: input.budgetGbp,
    baselineYear: input.baselineYear,
    endYear: input.endYear,
    industrySlugs: input.industrySlugs.length ? input.industrySlugs : fromPrompt.industrySlugs,
    instrumentSlugs: input.instrumentSlugs.length ? input.instrumentSlugs : fromPrompt.instrumentSlugs,
    graph: demoGraph(),
    scenarios: demoScenarios(),
    activeScenario: 'expected',
    status: 'draft',
    owner: 'J. Delacroix',
    organisation: 'Greater London Authority',
    createdAt: now,
    updatedAt: now,
    demo: false,
  }

  const created = await repository().createSimulation(simulation)
  await repository().appendAudit({
    id: `aud-${Date.now().toString(36)}`,
    at: now,
    actor: created.owner,
    organisation: created.organisation,
    action: 'Create simulation',
    subject: created.title,
    simulationId: created.id,
    decision: 'Recorded',
  })

  return NextResponse.json({ simulation: created }, { status: 201 })
}
