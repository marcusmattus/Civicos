/**
 * Mock agent orchestration engine.
 *
 * Advances a run through weighted agent stages, emitting concise operational
 * events that the UI streams over Server-Sent Events. It reports *activity and
 * evidence references only* — never model reasoning.
 *
 * To use a real orchestrator, replace `startRun` with a call that returns a
 * run id and forward the upstream event stream through `publish`.
 */
import 'server-only'
import { agentDefs, datasetById, modelById } from '../data/catalogue'
import { buildResultBundle } from '../engine/forecast'
import type { AgentRunState, AgentStatus, RunEvent, RunState, ScenarioKey, Simulation } from '../types'
import { resolveLevers } from '../engine/forecast'

type Listener = (state: RunState) => void

type EngineState = {
  runs: Map<string, RunState>
  timers: Map<string, ReturnType<typeof setInterval>>
  listeners: Map<string, Set<Listener>>
}

const GLOBAL_KEY = Symbol.for('civicos.run-engine')

function engine(): EngineState {
  const store = globalThis as typeof globalThis & { [GLOBAL_KEY]?: EngineState }
  if (!store[GLOBAL_KEY]) {
    store[GLOBAL_KEY] = { runs: new Map(), timers: new Map(), listeners: new Map() }
  }
  return store[GLOBAL_KEY]
}

function tickMs(): number {
  const configured = Number(process.env.CIVICOS_RUN_TICK_MS)
  return Number.isFinite(configured) && configured >= 50 ? configured : 350
}

const TOTAL_WEIGHT = agentDefs.reduce((sum, a) => sum + a.weight, 0)

/** Cumulative progress boundary at which each agent starts and finishes. */
function agentBands() {
  let cursor = 0
  return agentDefs.map((agent) => {
    const start = (cursor / TOTAL_WEIGHT) * 100
    cursor += agent.weight
    const end = (cursor / TOTAL_WEIGHT) * 100
    return { agent, start, end }
  })
}

/** Stage an agent moves through as its own band fills. */
function stageFor(fraction: number): AgentStatus {
  if (fraction <= 0) return 'queued'
  if (fraction < 0.25) return 'retrieving'
  if (fraction < 0.5) return 'validating'
  if (fraction < 1) return 'running'
  return 'complete'
}

const STAGE_MESSAGE: Partial<Record<AgentStatus, string>> = {
  retrieving: 'requesting source datasets',
  validating: 'checking schema, freshness and provenance',
  running: 'executing model pass',
  complete: 'outputs written to evidence store',
}

function newEvent(agentId: string, message: string, level: RunEvent['level'] = 'info', ref?: string): RunEvent {
  return {
    id: `evt-${Date.now()}-${Math.round(performance.now() * 1000) % 100000}-${agentId}`,
    at: new Date().toISOString(),
    agentId,
    message,
    level,
    evidenceRef: ref,
  }
}

function publish(simulationId: string) {
  const state = engine().runs.get(simulationId)
  if (!state) return
  for (const listener of engine().listeners.get(simulationId) ?? []) {
    // A listener throwing (a disconnected stream) must not stop the run.
    try {
      listener(state)
    } catch {
      /* stream already closed */
    }
  }
}

function stop(simulationId: string) {
  const timer = engine().timers.get(simulationId)
  if (timer) {
    clearInterval(timer)
    engine().timers.delete(simulationId)
  }
}

export function getRun(simulationId: string): RunState | null {
  return engine().runs.get(simulationId) ?? null
}

export function subscribe(simulationId: string, listener: Listener): () => void {
  const listeners = engine().listeners.get(simulationId) ?? new Set<Listener>()
  listeners.add(listener)
  engine().listeners.set(simulationId, listeners)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) engine().listeners.delete(simulationId)
  }
}

export function cancelRun(simulationId: string): RunState | null {
  const state = engine().runs.get(simulationId)
  if (!state || state.status !== 'running') return state ?? null

  stop(simulationId)
  const cancelled: RunState = {
    ...state,
    status: 'cancelled',
    partial: true,
    finishedAt: new Date().toISOString(),
    agents: state.agents.map((a) =>
      a.status === 'complete' ? a : { ...a, status: 'failed', note: 'Cancelled by user' },
    ),
    events: [
      newEvent('agt-audit', 'Run cancelled by user; partial outputs retained for audit', 'warning'),
      ...state.events,
    ],
  }
  engine().runs.set(simulationId, cancelled)
  publish(simulationId)
  return cancelled
}

/**
 * Starts (or restarts) a run. High-impact simulations finish in
 * `awaiting_approval` rather than `complete` — results stay gated until an
 * Approver signs off.
 */
export function startRun(simulation: Simulation, scenario: ScenarioKey): RunState {
  stop(simulation.id)

  const bands = agentBands()
  const levers = resolveLevers(simulation, scenario)
  const highImpact = levers.monthlyUbi >= 800 || levers.investment >= 15

  const initial: RunState = {
    simulationId: simulation.id,
    runId: `run-${Date.now().toString(36)}`,
    status: 'running',
    progress: 0,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    etaSeconds: Math.round((100 / 7) * (tickMs() / 1000)),
    agents: agentDefs.map<AgentRunState>((a) => ({
      id: a.id,
      name: a.name,
      status: 'queued',
      progress: 0,
    })),
    events: [
      newEvent('agt-audit', `Run parameters recorded for scenario "${scenario}"`, 'info', 'evidence/parameters'),
    ],
    datasetVersions: Array.from(datasetById.values()).map((d) => ({
      datasetId: d.id,
      version: d.version,
    })),
    modelVersions: Array.from(modelById.values()).map((m) => ({ modelId: m.id, version: m.version })),
    partial: false,
  }

  engine().runs.set(simulation.id, initial)
  publish(simulation.id)

  const timer = setInterval(() => {
    const current = engine().runs.get(simulation.id)
    if (!current || current.status !== 'running') {
      stop(simulation.id)
      return
    }

    const progress = Math.min(100, current.progress + 7)
    const events: RunEvent[] = []

    const agents = current.agents.map((agentState, i) => {
      const band = bands[i]!
      const fraction = Math.max(0, Math.min(1, (progress - band.start) / (band.end - band.start)))
      let status = stageFor(fraction)

      // The employment model is pending approver review — surfaced, not hidden.
      if (status === 'complete' && agentState.id === 'agt-employment') {
        status = 'warning'
      }

      if (status !== agentState.status) {
        const message = STAGE_MESSAGE[status]
        if (status === 'warning') {
          events.push(
            newEvent(
              agentState.id,
              `${agentState.name}: completed with a warning — Employment Transition Model v1.1 is pending approver review`,
              'warning',
              'evidence/models/mdl-employment-transition',
            ),
          )
        } else if (message) {
          events.push(
            newEvent(
              agentState.id,
              `${agentState.name}: ${message}`,
              'info',
              status === 'complete' ? `evidence/agents/${agentState.id}` : undefined,
            ),
          )
        }
      }

      return {
        ...agentState,
        status,
        progress: Math.round(fraction * 100),
        note: status === 'warning' ? 'Model pending approver review' : agentState.note,
      }
    })

    const done = progress >= 100
    const next: RunState = {
      ...current,
      progress,
      agents,
      etaSeconds: Math.max(0, Math.round(((100 - progress) / 7) * (tickMs() / 1000))),
      events: [...events.reverse(), ...current.events].slice(0, 200),
      status: done ? (highImpact ? 'awaiting_approval' : 'complete') : 'running',
      finishedAt: done ? new Date().toISOString() : null,
    }

    if (done) {
      next.events = [
        newEvent(
          'agt-audit',
          highImpact
            ? 'Run complete — high-impact thresholds met, approver sign-off required before export'
            : 'Run complete — results and evidence written',
          highImpact ? 'warning' : 'info',
          'evidence/summary',
        ),
        ...next.events,
      ]
      stop(simulation.id)
    }

    engine().runs.set(simulation.id, next)
    publish(simulation.id)
  }, tickMs())

  engine().timers.set(simulation.id, timer)
  return initial
}

/** Result bundle for a finished run, marked partial if the run was cut short. */
export function resultsForRun(simulation: Simulation, scenario: ScenarioKey) {
  const run = getRun(simulation.id)
  return buildResultBundle(simulation, scenario, { partial: run?.partial ?? false })
}
