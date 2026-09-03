'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, FileSearch, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { agentDefs, datasetById, modelById } from '@/lib/data/catalogue'
import { api, ApiError } from '@/lib/client/api'
import { useRunStream } from '@/lib/client/use-run-stream'
import { formatTime } from '@/lib/format'
import { useWorkspace } from '@/lib/store/workspace'
import { SCENARIO_LABELS } from '@/lib/types'
import type { RunState } from '@/lib/types'
import { EvidenceDrawer } from '../evidence/evidence-drawer'
import { AgentStatusBadge, StatusDot } from '../status'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardDescription, CardTitle } from '../ui/card'
import { EmptyState, ErrorState, HumanDecisionBanner, Skeleton } from '../ui/feedback'
import { cn } from '../ui/utils'

function ProgressRing({ progress }: { progress: number }) {
  const reduceMotion = useReducedMotion()
  return (
    <div
      role="progressbar"
      aria-label="Overall run progress"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="flex h-28 w-28 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(var(--color-cyan) ${progress}%, #eef0f4 0)` }}
    >
      <motion.div
        initial={false}
        animate={reduceMotion ? {} : { scale: progress >= 100 ? [1, 1.04, 1] : 1 }}
        transition={{ duration: 0.4 }}
        className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-surface"
      >
        <span className="tabular text-xl font-bold">{progress}%</span>
        <span className="text-[10px] text-faint">Complete</span>
      </motion.div>
    </div>
  )
}

function AgentRow({ agent }: { agent: RunState['agents'][number] }) {
  const definition = agentDefs.find((a) => a.id === agent.id)
  return (
    <li className="flex items-center gap-3 border-b border-line-softer py-2.5 last:border-b-0">
      <StatusDot status={agent.status} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-ink">{agent.name}</div>
        <div className="hidden truncate text-xs text-muted sm:block">
          {agent.note ?? definition?.description}
        </div>
      </div>
      <AgentStatusBadge status={agent.status} className="hidden sm:inline-flex" />
      <span className="tabular w-11 shrink-0 text-right text-xs text-muted">{agent.progress}%</span>
    </li>
  )
}

export function RunScreen() {
  const router = useRouter()
  const workspace = useWorkspace()
  const simulationId = workspace.simulationId
  const { run: streamed, status: streamStatus } = useRunStream(
    simulationId,
    workspace.activeScenario,
  )
  const [fallback, setFallback] = useState<RunState | null>(null)
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const run = streamed ?? fallback

  // If the stream cannot connect, fall back to polling the run endpoint.
  useEffect(() => {
    if (streamStatus !== 'error') return
    let active = true
    const poll = async () => {
      try {
        const state = await api.getRun(simulationId)
        if (active) setFallback(state)
      } catch {
        /* run may not exist yet */
      }
    }
    void poll()
    const timer = setInterval(poll, 2000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [streamStatus, simulationId])

  async function cancel() {
    setCancelling(true)
    setError(null)
    try {
      const state = await api.cancelRun(simulationId)
      setFallback(state)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The run could not be cancelled.')
    } finally {
      setCancelling(false)
    }
  }

  async function startAgain() {
    setError(null)
    try {
      await api.startRun(simulationId, workspace.activeScenario)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The run could not be started.')
    }
  }

  if (!run) {
    if (streamStatus === 'connecting' || streamStatus === 'idle') {
      return (
        <div className="mx-auto max-w-5xl space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title="No run in progress"
          description="Configure a scenario and start a run to watch agent orchestration live."
          action={
            <div className="flex gap-2">
              <Button variant="primary" onClick={startAgain}>
                Start a run
              </Button>
              <Button onClick={() => router.push('/scenarios')}>Back to scenarios</Button>
            </div>
          }
        />
      </div>
    )
  }

  const terminal = run.status !== 'running'
  const failedAgents = run.agents.filter((a) => a.status === 'failed')
  const warningAgents = run.agents.filter((a) => a.status === 'warning')

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-2xl font-semibold sm:text-[28px] sm:leading-9">
            {terminal ? 'Simulation run' : 'Simulation in progress'}
          </h1>
          <p className="mt-1 text-muted">
            {terminal
              ? 'Agents have finished. Review the evidence before acting on the results.'
              : 'Agents are running the model and generating insights.'}
          </p>
        </div>
        <div className="text-[13px] text-muted lg:text-right">
          <div>
            Run ID: <span className="font-mono text-ink">{run.runId}</span>
          </div>
          <div>Scenario: {SCENARIO_LABELS[workspace.activeScenario]}</div>
          {streamStatus === 'error' ? (
            <Badge tone="warning" className="mt-1">
              Live stream unavailable — polling
            </Badge>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-4">
          <ErrorState description={error} />
        </div>
      ) : null}

      {run.status === 'cancelled' ? (
        <div className="mb-4 rounded-lg border border-warning-line bg-warning-tint px-4 py-3 text-[13px] text-warning-ink">
          Run cancelled. Partial outputs have been retained for audit; results are incomplete and
          must not be used for a decision.
        </div>
      ) : null}

      {run.status === 'awaiting_approval' ? (
        <div className="mb-4 rounded-lg border border-warning-line bg-warning-tint px-4 py-3 text-[13px] text-warning-ink">
          This run met the high-impact threshold. An Approver must sign off before results can be
          exported or shared.
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
        <Card className="flex flex-col items-center self-start p-5">
          <CardDescription className="mb-3">Progress</CardDescription>
          <ProgressRing progress={run.progress} />
          <p className="mt-3 text-xs text-faint">
            {terminal ? 'Run finished' : `Est. ${run.etaSeconds}s remaining`}
          </p>
          {!terminal ? (
            <Button size="sm" className="mt-3 gap-1.5" onClick={cancel} disabled={cancelling}>
              <Square className="h-3 w-3" aria-hidden="true" />
              {cancelling ? 'Cancelling…' : 'Cancel simulation'}
            </Button>
          ) : null}
        </Card>

        <Card className="p-5">
          <div className="flex items-baseline justify-between">
            <CardTitle>Agent orchestration</CardTitle>
            <span className="text-xs text-muted">
              {run.agents.filter((a) => a.status === 'complete').length} of {run.agents.length}{' '}
              complete
            </span>
          </div>
          <ul className="mt-3">
            {run.agents.map((agent) => (
              <AgentRow key={agent.id} agent={agent} />
            ))}
          </ul>
          {warningAgents.length || failedAgents.length ? (
            <p className="mt-3 text-xs text-warning-ink">
              {warningAgents.length} agent{warningAgents.length === 1 ? '' : 's'} completed with
              warnings
              {failedAgents.length ? `, ${failedAgents.length} failed` : ''}. See the event stream
              for detail.
            </p>
          ) : null}
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle>Live event stream</CardTitle>
          <CardDescription className="mt-0.5">
            Operational activity and evidence references only.
          </CardDescription>
          <ul className="mt-3 max-h-80 space-y-1.5 overflow-y-auto" aria-live="polite">
            {run.events.map((event) => (
              <li key={event.id} className="flex gap-2.5 text-xs">
                <span className="tabular shrink-0 text-faint">{formatTime(event.at)}</span>
                <span
                  className={cn(
                    event.level === 'warning'
                      ? 'text-warning-ink'
                      : event.level === 'error'
                        ? 'text-danger'
                        : 'text-ink',
                  )}
                >
                  {event.level === 'warning' ? '⚠ ' : ''}
                  {event.message}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <CardTitle>Official data sources</CardTitle>
            <ul className="mt-3 space-y-2">
              {run.datasetVersions.slice(0, 6).map((entry) => {
                const dataset = datasetById.get(entry.datasetId)
                return (
                  <li
                    key={entry.datasetId}
                    className="flex items-center justify-between gap-3 border-b border-line-softer pb-2 text-[13px] last:border-b-0 last:pb-0"
                  >
                    <span className="min-w-0 truncate">{dataset?.name ?? entry.datasetId}</span>
                    <span className="tabular shrink-0 text-xs text-muted">v{entry.version}</span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card className="p-5">
            <CardTitle>Model versions</CardTitle>
            <ul className="mt-3 space-y-2">
              {run.modelVersions.slice(0, 5).map((entry) => {
                const model = modelById.get(entry.modelId)
                return (
                  <li
                    key={entry.modelId}
                    className="flex items-center justify-between gap-3 border-b border-line-softer pb-2 text-[13px] last:border-b-0 last:pb-0"
                  >
                    <span className="min-w-0 truncate">{model?.name ?? entry.modelId}</span>
                    <Badge tone={model?.status === 'Validated' ? 'positive' : 'warning'}>
                      v{entry.version}
                    </Badge>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="flex flex-col items-center gap-3 p-5 text-center">
        <div>
          <CardTitle>Evidence</CardTitle>
          <CardDescription className="mt-1">
            Datasets, model versions, assumptions and approvals are attached for audit.
          </CardDescription>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button className="gap-1.5" onClick={() => setEvidenceOpen(true)}>
            <FileSearch className="h-4 w-4" aria-hidden="true" />
            Open evidence drawer
          </Button>
          {terminal ? (
            <Button variant="primary" className="gap-1.5" onClick={() => router.push('/results')}>
              View results
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </Card>

      <HumanDecisionBanner className="mt-6" note="All figures shown are illustrative demonstration data." />

      <EvidenceDrawer
        simulationId={simulationId}
        scenario={workspace.activeScenario}
        open={evidenceOpen}
        onOpenChange={setEvidenceOpen}
      />
    </div>
  )
}
