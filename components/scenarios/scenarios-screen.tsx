'use client'

import { AlertTriangle, CheckCircle2, Play, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { datasetById, levers, metricById, policyInstruments } from '@/lib/data/catalogue'
import { api, ApiError } from '@/lib/client/api'
import { validateSimulation } from '@/lib/engine/validate'
import { buildGraphFromSelection } from '@/lib/engine/graph'
import { useWorkspace, workspaceToSimulation } from '@/lib/store/workspace'
import { SCENARIO_KEYS, SCENARIO_LABELS } from '@/lib/types'
import type { ScenarioKey, Simulation } from '@/lib/types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardDescription, CardTitle } from '../ui/card'
import { ErrorState } from '../ui/feedback'
import { Textarea } from '../ui/input'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { cn } from '../ui/utils'
import { LeverControl } from './lever-control'

const GROUPS: { title: string; leverIds: string[] }[] = [
  { title: 'Horizon and envelope', leverIds: ['baseline_year', 'end_year', 'budget'] },
  { title: 'Economy', leverIds: ['economic_growth', 'population_growth', 'inflation'] },
  {
    title: 'Technology adoption',
    leverIds: ['technology_adoption', 'autonomous_cab_adoption', 'ai_healthcare_adoption'],
  },
  {
    title: 'Policy levers',
    leverIds: [
      'monthly_ubi',
      'public_investment',
      'regulatory_strictness',
      'accessibility_quota',
      'empty_vehicle_charge',
      'workforce_training_budget',
    ],
  },
]

export function ScenariosScreen() {
  const router = useRouter()
  const workspace = useWorkspace()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const active = workspace.activeScenario
  const config = workspace.scenarios[active]

  // Levers only bite when the instrument that owns them is selected.
  const unlockedLevers = useMemo(() => {
    const unlocked = new Set(
      policyInstruments
        .filter((p) => workspace.instrumentSlugs.includes(p.slug))
        .flatMap((p) => p.levers),
    )
    // Horizon, envelope and economic assumptions are always in play.
    for (const id of [
      'baseline_year',
      'end_year',
      'budget',
      'economic_growth',
      'population_growth',
      'inflation',
      'technology_adoption',
      'autonomous_cab_adoption',
      'ai_healthcare_adoption',
    ]) {
      unlocked.add(id)
    }
    return unlocked
  }, [workspace.instrumentSlugs])

  const simulation = useMemo(
    () =>
      ({
        ...workspaceToSimulation(workspace),
        graph:
          workspace.graph ??
          buildGraphFromSelection(
            workspace.geographySlug,
            workspace.industrySlugs,
            workspace.instrumentSlugs,
          ),
        status: 'draft',
        owner: '',
        organisation: '',
        createdAt: '',
        updatedAt: '',
        demo: false,
      }) as Simulation,
    [workspace],
  )

  const report = useMemo(() => validateSimulation(simulation, active), [simulation, active])
  const errors = report.issues.filter((i) => i.severity === 'error')
  const warnings = report.issues.filter((i) => i.severity === 'warning')

  // Datasets required by the model that are not model-ready.
  const missingDatasets = useMemo(
    () =>
      Array.from(new Set(simulation.graph.nodes.flatMap((n) => n.requiredDatasetIds)))
        .map((id) => datasetById.get(id))
        .filter((d) => d && d.modelReadiness !== 'Ready'),
    [simulation],
  )

  const affectedMetrics = useMemo(() => {
    const ids = new Set(
      levers
        .filter((l) => unlockedLevers.has(l.id))
        .flatMap((l) => l.affects),
    )
    return Array.from(ids).map((id) => metricById.get(id)?.label ?? id)
  }, [unlockedLevers])

  async function runSimulation() {
    setStarting(true)
    setError(null)
    try {
      // Persist the working state, then start the run against the API.
      await api.patchSimulation(workspace.simulationId, {
        scenarios: workspace.scenarios,
        activeScenario: active,
        industrySlugs: workspace.industrySlugs,
        instrumentSlugs: workspace.instrumentSlugs,
        graph: simulation.graph,
        prompt: workspace.prompt,
      })
      await api.startRun(workspace.simulationId, active)
      workspace.markSaved()
      router.push('/run')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'validation_failed') {
        setError('Validation failed on the server. Fix the errors listed below and try again.')
      } else {
        setError(err instanceof ApiError ? err.message : 'The simulation could not be started.')
      }
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold sm:text-[28px] sm:leading-9">Configure scenarios</h1>
        <p className="mt-1 text-muted">
          Adjust assumptions and levers for each scenario. Every value here is a scenario assumption,
          not an observation.
        </p>
      </div>

      <Tabs value={active} onValueChange={(v) => workspace.setActiveScenario(v as ScenarioKey)}>
        <TabsList className="mb-6" aria-label="Scenario">
          {SCENARIO_KEYS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {SCENARIO_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {error ? (
        <div className="mb-4">
          <ErrorState description={error} onRetry={runSimulation} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {GROUPS.map((group) => (
            <Card key={group.title} className="p-5">
              <CardTitle>{group.title}</CardTitle>
              <CardDescription className="mt-0.5 mb-2">
                {group.title === 'Policy levers'
                  ? 'Levers are active only when their instrument is selected.'
                  : `Assumptions for the ${SCENARIO_LABELS[active]} scenario.`}
              </CardDescription>
              <div className="divide-y divide-line-soft">
                {group.leverIds.map((leverId) => {
                  const lever = levers.find((l) => l.id === leverId)
                  if (!lever) return null
                  const issue = report.issues.find(
                    (i) => i.leverId === leverId && i.severity === 'error',
                  )
                  return (
                    <LeverControl
                      key={lever.id}
                      lever={lever}
                      value={config.values[lever.id] ?? 0}
                      locked={!unlockedLevers.has(lever.id)}
                      invalid={issue?.message}
                      onChange={(value) => workspace.setLeverValue(active, lever.id, value)}
                    />
                  )
                })}
              </div>
            </Card>
          ))}

          <Card className="p-5">
            <CardTitle>Scenario notes</CardTitle>
            <CardDescription className="mt-0.5 mb-2">
              Recorded in the audit trail alongside the run.
            </CardDescription>
            <Textarea
              value={config.notes}
              onChange={(e) => workspace.setScenarioNotes(active, e.target.value)}
              placeholder="Why these assumptions? Note the source of any figure that is not a default."
              className="h-24"
              aria-label="Scenario notes"
            />
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 gap-1.5"
              onClick={() => workspace.resetScenario(active)}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset to defaults
            </Button>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-0 xl:self-start">
          <Card
            className={cn(
              'p-4',
              errors.length
                ? 'border-danger-line bg-danger-tint'
                : warnings.length
                  ? 'border-warning-line bg-warning-tint'
                  : 'border-teal-line bg-teal-tint',
            )}
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              {errors.length || warnings.length ? (
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-teal" aria-hidden="true" />
              )}
              {errors.length
                ? `${errors.length} error${errors.length === 1 ? '' : 's'}`
                : warnings.length
                  ? `${warnings.length} warning${warnings.length === 1 ? '' : 's'}`
                  : 'No issues detected'}
            </div>
            {report.issues.length === 0 ? (
              <p className="mt-1 text-[13px]">All required inputs are valid.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-[13px]">
                {report.issues.map((issue, i) => (
                  <li key={`${issue.code}-${i}`}>
                    <span className="font-medium">
                      {issue.severity === 'error' ? 'Error' : 'Warning'}:
                    </span>{' '}
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {missingDatasets.length > 0 ? (
            <Card className="border-warning-line bg-warning-tint p-4">
              <CardTitle>Datasets needing review</CardTitle>
              <ul className="mt-2 space-y-1 text-[13px] text-warning-ink">
                {missingDatasets.map((dataset) => (
                  <li key={dataset!.id}>
                    {dataset!.name} — {dataset!.modelReadiness}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="p-4">
            <CardTitle>Dependency preview</CardTitle>
            <CardDescription className="mt-1">
              Active levers influence {affectedMetrics.length} metrics:
            </CardDescription>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {affectedMetrics.slice(0, 6).map((label) => (
                <li key={label}>
                  <Badge tone="muted">{label}</Badge>
                </li>
              ))}
              {affectedMetrics.length > 6 ? (
                <li>
                  <Badge tone="muted">+{affectedMetrics.length - 6} more</Badge>
                </li>
              ) : null}
            </ul>
          </Card>

          <Button
            variant="primary"
            size="lg"
            className="w-full gap-2"
            disabled={errors.length > 0 || starting}
            onClick={runSimulation}
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {starting ? 'Starting run…' : 'Run simulation'}
          </Button>

          {errors.length > 0 ? (
            <p role="status" className="text-[13px] text-danger">
              Fix {errors.length} error{errors.length === 1 ? '' : 's'} before running.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
