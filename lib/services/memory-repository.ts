/**
 * In-memory repository seeded with the demonstration data.
 *
 * State lives on `globalThis` so it survives Next's dev-server module reloads
 * within a single process. It is deliberately process-local: this is the mock
 * backend, not a database.
 */
import { companionSimulations, demoSimulation } from '../data/demo'
import type { AuditEntry, ResultBundle, Simulation } from '../types'
import type { Repository, SimulationPatch } from './repository'

type MemoryState = {
  simulations: Map<string, Simulation>
  results: Map<string, ResultBundle>
  audit: AuditEntry[]
}

const GLOBAL_KEY = Symbol.for('civicos.memory-state')

function seed(): MemoryState {
  const simulations = new Map<string, Simulation>()
  for (const simulation of [demoSimulation(), ...companionSimulations()]) {
    simulations.set(simulation.id, simulation)
  }

  const audit: AuditEntry[] = [
    {
      id: 'aud-1',
      at: '2026-09-02T15:04:00.000Z',
      actor: 'J. Delacroix',
      organisation: 'GLA Transport',
      action: 'Run simulation',
      subject: 'London AI Transition',
      simulationId: 'sim-london-ai-transition',
      datasetVersions: [
        { datasetId: 'ds-tfl-road', version: '2026.09' },
        { datasetId: 'ds-ons-population', version: '2026.02' },
      ],
      modelVersions: [{ modelId: 'mdl-mobility-demand', version: '2.3' }],
      decision: 'Approved',
    },
    {
      id: 'aud-2',
      at: '2026-09-02T12:20:00.000Z',
      actor: 'A. Okafor',
      organisation: 'GLA Health',
      action: 'Export policy brief',
      subject: 'Healthcare Capacity Review',
      simulationId: 'sim-healthcare-capacity',
      decision: 'Approved',
    },
    {
      id: 'aud-3',
      at: '2026-09-01T16:45:00.000Z',
      actor: 'M. Reyes',
      organisation: 'HM Treasury',
      action: 'Publish model',
      subject: 'UBI Fiscal Model v1.4',
      modelVersions: [{ modelId: 'mdl-ubi-fiscal', version: '1.4' }],
      decision: 'Pending',
    },
    {
      id: 'aud-4',
      at: '2026-09-01T11:02:00.000Z',
      actor: 'J. Delacroix',
      organisation: 'GLA Transport',
      action: 'Modify scenario',
      subject: 'London AI Transition — Intervention',
      simulationId: 'sim-london-ai-transition',
      decision: 'Recorded',
    },
    {
      id: 'aud-5',
      at: '2026-08-31T09:30:00.000Z',
      actor: 'S. Whitfield',
      organisation: 'DfT',
      action: 'Run simulation',
      subject: 'UK Housing Acceleration',
      simulationId: 'sim-uk-housing-acceleration',
      decision: 'Approved',
    },
  ]

  return { simulations, results: new Map(), audit }
}

function state(): MemoryState {
  const store = globalThis as typeof globalThis & { [GLOBAL_KEY]?: MemoryState }
  if (!store[GLOBAL_KEY]) store[GLOBAL_KEY] = seed()
  return store[GLOBAL_KEY]
}

function resultKey(simulationId: string, scenario: string) {
  return `${simulationId}::${scenario}`
}

export class MemoryRepository implements Repository {
  async listSimulations(): Promise<Simulation[]> {
    return Array.from(state().simulations.values()).sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    )
  }

  async getSimulation(id: string): Promise<Simulation | null> {
    return state().simulations.get(id) ?? null
  }

  async createSimulation(simulation: Simulation): Promise<Simulation> {
    state().simulations.set(simulation.id, simulation)
    return simulation
  }

  async updateSimulation(id: string, patch: SimulationPatch): Promise<Simulation | null> {
    const existing = state().simulations.get(id)
    if (!existing) return null
    const updated: Simulation = { ...existing, ...patch, updatedAt: new Date().toISOString() }
    state().simulations.set(id, updated)
    return updated
  }

  async deleteSimulation(id: string): Promise<boolean> {
    return state().simulations.delete(id)
  }

  async saveResults(bundle: ResultBundle): Promise<void> {
    state().results.set(resultKey(bundle.simulationId, bundle.scenario), bundle)
  }

  async getResults(simulationId: string, scenario: string): Promise<ResultBundle | null> {
    return state().results.get(resultKey(simulationId, scenario)) ?? null
  }

  async listAudit(limit = 50): Promise<AuditEntry[]> {
    return state()
      .audit.slice()
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, limit)
  }

  async appendAudit(entry: AuditEntry): Promise<AuditEntry> {
    state().audit.push(entry)
    return entry
  }
}
