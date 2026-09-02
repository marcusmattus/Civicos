'use client'

import type {
  AuditEntry,
  Dataset,
  EvidenceBundle,
  ModelCard,
  ResultBundle,
  RunState,
  ScenarioKey,
  Simulation,
  ValidationReport,
} from '../types'
import type { CreateSimulationInput, ExportInput } from '../schemas'

export class ApiError extends Error {
  status: number
  code: string
  details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
    this.name = 'ApiError'
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(input, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    // fetch only rejects on network failure — surface it as such.
    throw new ApiError(0, 'network_error', 'Could not reach the CivicOS API. Check your connection.')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string; code?: string; details?: unknown }
      | null
    throw new ApiError(
      response.status,
      body?.code ?? 'request_failed',
      body?.error ?? `Request failed with status ${response.status}`,
      body?.details,
    )
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  listSimulations: () =>
    request<{ simulations: Simulation[] }>('/api/simulations').then((r) => r.simulations),

  getSimulation: (id: string) =>
    request<{ simulation: Simulation }>(`/api/simulations/${id}`).then((r) => r.simulation),

  createSimulation: (input: CreateSimulationInput) =>
    request<{ simulation: Simulation }>('/api/simulations', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((r) => r.simulation),

  patchSimulation: (id: string, patch: Record<string, unknown>) =>
    request<{ simulation: Simulation }>(`/api/simulations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then((r) => r.simulation),

  validate: (id: string, scenario: ScenarioKey) =>
    request<{ report: ValidationReport }>(`/api/simulations/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    }).then((r) => r.report),

  startRun: (id: string, scenario: ScenarioKey) =>
    request<{ run: RunState }>(`/api/simulations/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    }).then((r) => r.run),

  getRun: (id: string) => request<{ run: RunState }>(`/api/simulations/${id}/run`).then((r) => r.run),

  cancelRun: (id: string) =>
    request<{ run: RunState }>(`/api/simulations/${id}/run`, { method: 'DELETE' }).then((r) => r.run),

  getResults: (id: string, scenario: ScenarioKey) =>
    request<{ results: ResultBundle; approvalRequired: boolean }>(
      `/api/simulations/${id}/results?scenario=${scenario}`,
    ),

  getEvidence: (id: string, scenario: ScenarioKey) =>
    request<{ evidence: EvidenceBundle; runId: string | null; generatedAt: string }>(
      `/api/simulations/${id}/evidence?scenario=${scenario}`,
    ),

  approve: (id: string, decision: 'Approved' | 'Denied', note?: string) =>
    request<{ simulation: Simulation }>(`/api/simulations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    }).then((r) => r.simulation),

  listDatasets: () => request<{ datasets: Dataset[] }>('/api/datasets').then((r) => r.datasets),

  listModels: () => request<{ models: ModelCard[] }>('/api/models').then((r) => r.models),

  listAudit: (limit = 50) =>
    request<{ entries: AuditEntry[] }>(`/api/audit?limit=${limit}`).then((r) => r.entries),
}

/**
 * Exports are downloads, not JSON: fetch the blob and hand it to the browser.
 * PDF exports return a print-ready document, opened in a new tab to print.
 */
export async function exportReport(simulationId: string, input: ExportInput): Promise<void> {
  const response = await fetch(`/api/simulations/${simulationId}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string; code?: string } | null
    throw new ApiError(
      response.status,
      body?.code ?? 'export_failed',
      body?.error ?? 'The export could not be generated.',
    )
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)

  if (input.format === 'pdf') {
    const printWindow = window.open(url, '_blank')
    printWindow?.addEventListener('load', () => printWindow.print())
    // Give the new window time to load before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
    return
  }

  const link = document.createElement('a')
  link.href = url
  link.download = `${simulationId}-${input.reportType}-${input.scenario}.${input.format}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
