/**
 * Persistence contract.
 *
 * Two implementations ship: an in-memory store seeded with the demonstration
 * data (default, zero configuration) and a Firestore store used when Firebase
 * service-account credentials are present. Route handlers only ever talk to
 * this interface, so a third implementation — a real FastAPI backend, say —
 * slots in without touching the UI.
 */
import type { AuditEntry, ResultBundle, Simulation } from '../types'

export type SimulationPatch = Partial<
  Pick<
    Simulation,
    | 'title'
    | 'prompt'
    | 'geographySlug'
    | 'budgetGbp'
    | 'baselineYear'
    | 'endYear'
    | 'industrySlugs'
    | 'instrumentSlugs'
    | 'graph'
    | 'scenarios'
    | 'activeScenario'
    | 'status'
  >
>

export interface Repository {
  listSimulations(): Promise<Simulation[]>
  getSimulation(id: string): Promise<Simulation | null>
  createSimulation(simulation: Simulation): Promise<Simulation>
  updateSimulation(id: string, patch: SimulationPatch): Promise<Simulation | null>
  deleteSimulation(id: string): Promise<boolean>

  saveResults(bundle: ResultBundle): Promise<void>
  getResults(simulationId: string, scenario: string): Promise<ResultBundle | null>

  listAudit(limit?: number): Promise<AuditEntry[]>
  appendAudit(entry: AuditEntry): Promise<AuditEntry>
}

export type PersistenceMode = 'memory' | 'firestore'

export function configuredPersistence(): PersistenceMode {
  const mode = process.env.CIVICOS_PERSISTENCE?.trim().toLowerCase()
  if (mode === 'firestore') return 'firestore'
  return 'memory'
}

export function firebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY,
  )
}
