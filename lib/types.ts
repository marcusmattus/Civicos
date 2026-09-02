/**
 * CivicOS domain model.
 *
 * These types are the contract between the UI and the service layer. Swapping
 * the mock services for real FastAPI / Hugging Face / simulation endpoints
 * should require no change here — see lib/services/README or the backend
 * integration guide in docs/.
 */

/* ------------------------------------------------------------------ Provenance */

/**
 * How a number came to exist. Displayed on every forecast and dataset so an
 * auditor can tell measurement from modelling. Observed and synthetic data are
 * never silently combined — a mixed lineage is surfaced as a warning.
 */
export const DATA_CLASSIFICATIONS = [
  'OBSERVED',
  'DERIVED',
  'IMPUTED',
  'SYNTHETIC',
  'FORECAST',
  'SCENARIO_ASSUMPTION',
] as const

export type DataClassification = (typeof DATA_CLASSIFICATIONS)[number]

export type SecurityClassification = 'OFFICIAL' | 'OFFICIAL-SENSITIVE'

/* ------------------------------------------------------------------ References */

export const REFERENCE_KINDS = ['industry', 'policy', 'dataset', 'model', 'geography', 'metric'] as const
export type ReferenceKind = (typeof REFERENCE_KINDS)[number]

/**
 * A structured `@industry/transport`-style reference that can be inserted into
 * a prompt as a chip and resolved back to a catalogue entity.
 */
export type Reference = {
  id: string
  kind: ReferenceKind
  slug: string
  label: string
  description: string
}

/** `@industry/transport` → { kind: 'industry', slug: 'transport' } */
export type ParsedReference = {
  kind: ReferenceKind
  slug: string
  raw: string
  start: number
  end: number
}

/* ------------------------------------------------------------------ Catalogues */

export type Industry = {
  id: string
  slug: string
  name: string
  description: string
  models: number
  datasets: number
  activeSimulations: number
}

export type PolicyInstrument = {
  id: string
  slug: string
  name: string
  description: string
  /** Lever ids this instrument unlocks in scenario configuration. */
  levers: string[]
}

export type DatasetVersion = {
  version: string
  publishedAt: string
  note: string
}

export type DatasetField = {
  name: string
  type: string
  description: string
}

export type Dataset = {
  id: string
  name: string
  source: string
  department: string
  geography: string
  classification: DataClassification
  freshness: string
  quality: 'High' | 'Medium' | 'Low'
  modelReadiness: 'Ready' | 'Review' | 'Blocked'
  licence: string
  version: string
  sensitivity: SecurityClassification
  description: string
  schema: DatasetField[]
  provenance: string[]
  transformations: string[]
  qualityWarnings: string[]
  versionHistory: DatasetVersion[]
  usedByModelIds: string[]
}

export type ModelCard = {
  id: string
  name: string
  purpose: string
  owner: string
  version: string
  licence: string
  status: 'Validated' | 'Review pending' | 'Draft'
  trainingDatasetIds: string[]
  evaluationDatasetIds: string[]
  geographicScope: string
  limitations: string[]
  biasTests: string[]
  approvedUses: string[]
  prohibitedUses: string[]
  auditHistory: { at: string; actor: string; action: string }[]
}

export type Geography = {
  id: string
  slug: string
  name: string
  level: 'city' | 'region' | 'nation'
}

export type Metric = {
  id: string
  slug: string
  label: string
  unit: string
  /** Higher is better, lower is better, or neither. */
  direction: 'up-good' | 'down-good' | 'neutral'
}

/* -------------------------------------------------------------------- Scenarios */

export const SCENARIO_KEYS = ['conservative', 'expected', 'accelerated', 'intervention'] as const
export type ScenarioKey = (typeof SCENARIO_KEYS)[number]

export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  conservative: 'Conservative',
  expected: 'Expected',
  accelerated: 'Accelerated',
  intervention: 'Intervention',
}

export type LeverKind = 'percent' | 'currency' | 'currency-bn' | 'choice' | 'year' | 'number'

/** Definition of a tunable scenario input. */
export type LeverDef = {
  id: string
  label: string
  kind: LeverKind
  min?: number
  max?: number
  step?: number
  unit?: string
  choices?: string[]
  help: string
  /** Metric ids this lever propagates to — drives the dependency preview. */
  affects: string[]
}

export type ScenarioConfig = {
  key: ScenarioKey
  label: string
  notes: string
  /** leverId → value (number for numeric levers, string for choices). */
  values: Record<string, number | string>
}

/* ------------------------------------------------------------------ Model graph */

export type ModelNodeType =
  | 'geography'
  | 'industry'
  | 'instrument'
  | 'assumption'
  | 'metric'
  | 'outcome'

export type ModelNode = {
  id: string
  type: ModelNodeType
  label: string
  description: string
  position: { x: number; y: number }
  dataSourceIds: string[]
  modelId?: string
  assumptions: string[]
  requiredDatasetIds: string[]
  metricIds: string[]
  validation: 'valid' | 'warning' | 'invalid'
  validationNote?: string
}

export type ModelEdge = {
  id: string
  source: string
  target: string
}

export type ModelGraph = {
  nodes: ModelNode[]
  edges: ModelEdge[]
}

/* ------------------------------------------------------------------ Simulations */

export type SimulationStatus =
  | 'draft'
  | 'validated'
  | 'running'
  | 'complete'
  | 'cancelled'
  | 'failed'
  | 'awaiting_approval'

export type Simulation = {
  id: string
  title: string
  prompt: string
  geographySlug: string
  budgetGbp: number
  baselineYear: number
  endYear: number
  industrySlugs: string[]
  instrumentSlugs: string[]
  graph: ModelGraph
  scenarios: Record<ScenarioKey, ScenarioConfig>
  activeScenario: ScenarioKey
  status: SimulationStatus
  owner: string
  organisation: string
  createdAt: string
  updatedAt: string
  /** True for the seeded walkthrough — surfaced in the UI as illustrative. */
  demo: boolean
}

export type ValidationIssue = {
  severity: 'error' | 'warning'
  code:
    | 'missing_dataset'
    | 'invalid_assumption'
    | 'conflict'
    | 'unconnected_node'
    | 'mixed_provenance'
    | 'missing_instrument'
  message: string
  nodeId?: string
  leverId?: string
}

export type ValidationReport = {
  ok: boolean
  issues: ValidationIssue[]
  checkedAt: string
}

/* -------------------------------------------------------------------------- Run */

export const AGENT_STATUSES = [
  'queued',
  'retrieving',
  'validating',
  'running',
  'complete',
  'warning',
  'failed',
  'awaiting_approval',
] as const
export type AgentStatus = (typeof AGENT_STATUSES)[number]

export type AgentDef = {
  id: string
  name: string
  description: string
  /** Fraction of the overall run this agent occupies. */
  weight: number
}

export type AgentRunState = {
  id: string
  name: string
  status: AgentStatus
  progress: number
  note?: string
}

export type RunEvent = {
  id: string
  at: string
  agentId: string
  /** Concise operational activity only — never model reasoning. */
  message: string
  level: 'info' | 'warning' | 'error'
  evidenceRef?: string
}

export type RunState = {
  simulationId: string
  runId: string
  status: 'idle' | 'running' | 'complete' | 'cancelled' | 'failed' | 'awaiting_approval'
  progress: number
  startedAt: string | null
  finishedAt: string | null
  etaSeconds: number
  agents: AgentRunState[]
  events: RunEvent[]
  datasetVersions: { datasetId: string; version: string }[]
  modelVersions: { modelId: string; version: string }[]
  /** Set when the run stopped early — partial results may still be present. */
  partial: boolean
}

/* ---------------------------------------------------------------------- Results */

export type Forecast = {
  metricId: string
  label: string
  unit: string
  baseline: number
  p10: number
  p50: number
  p90: number
  /** Change against baseline, already formatted for display. */
  change: string
  direction: 'up' | 'down' | 'flat'
  tone: 'positive' | 'negative' | 'warning' | 'neutral'
  sourceDatasetIds: string[]
  modelId: string
  classification: DataClassification
}

export type TrajectoryPoint = {
  year: number
  p10: number
  p50: number
  p90: number
  baseline: number
}

export type AffectedGroup = {
  group: string
  effect: string
}

export type ResultBundle = {
  simulationId: string
  scenario: ScenarioKey
  confidence: 'High' | 'Medium' | 'Low'
  kpis: Forecast[]
  trajectoryMetricId: string
  trajectory: TrajectoryPoint[]
  risks: { title: string; severity: 'high' | 'medium' | 'low'; note: string }[]
  positivelyAffected: AffectedGroup[]
  negativelyAffected: AffectedGroup[]
  interventions: { title: string; note: string }[]
  evidence: EvidenceBundle
  generatedAt: string
  /** True when the run was cancelled or an agent failed. */
  partial: boolean
}

export type EvidenceBundle = {
  datasets: { id: string; name: string; version: string; classification: DataClassification }[]
  models: { id: string; name: string; version: string }[]
  assumptions: { label: string; value: string; classification: DataClassification }[]
  parameters: { label: string; value: string }[]
  approvals: { role: string; actor: string; at: string; decision: 'Approved' | 'Pending' }[]
}

/* ----------------------------------------------------------- Audit & governance */

export const ROLES = [
  'analyst',
  'data_steward',
  'model_developer',
  'policy_reviewer',
  'approver',
  'auditor',
  'administrator',
] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  analyst: 'Analyst',
  data_steward: 'Data steward',
  model_developer: 'Model developer',
  policy_reviewer: 'Policy reviewer',
  approver: 'Approver',
  auditor: 'Auditor',
  administrator: 'Administrator',
}

export type AuditEntry = {
  id: string
  at: string
  actor: string
  organisation: string
  action: string
  subject: string
  simulationId?: string
  datasetVersions?: { datasetId: string; version: string }[]
  modelVersions?: { modelId: string; version: string }[]
  decision: 'Approved' | 'Pending' | 'Recorded' | 'Denied'
}

export type Organisation = {
  id: string
  name: string
  clearance: SecurityClassification
  residency: string
}

export type User = {
  id: string
  email: string
  name: string
  initials: string
  role: Role
  organisationId: string
  mfaEnabled: boolean
}

/* ------------------------------------------------------------------- Reporting */

export const REPORT_TYPES = [
  'policy_brief',
  'regulatory_impact_assessment',
  'spending_options_paper',
  'dataset_quality_report',
  'model_evaluation_report',
  'mobility_sandbox_report',
  'audit_package',
] as const
export type ReportType = (typeof REPORT_TYPES)[number]

export const REPORT_LABELS: Record<ReportType, string> = {
  policy_brief: 'Policy brief',
  regulatory_impact_assessment: 'Regulatory-impact assessment',
  spending_options_paper: 'Spending options paper',
  dataset_quality_report: 'Dataset-quality report',
  model_evaluation_report: 'Model-evaluation report',
  mobility_sandbox_report: 'Autonomous-mobility sandbox report',
  audit_package: 'Complete audit package',
}

export type ExportFormat = 'pdf' | 'csv' | 'json'
