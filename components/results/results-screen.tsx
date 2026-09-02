'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Download, FileSearch, GitCompare, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { api, ApiError, exportReport } from '@/lib/client/api'
import { useWorkspace } from '@/lib/store/workspace'
import { SCENARIO_KEYS, SCENARIO_LABELS } from '@/lib/types'
import type { ExportFormat, ReportType, ScenarioKey } from '@/lib/types'
import { TrajectoryChart } from '../charts/trajectory-chart'
import { EvidenceDrawer } from '../evidence/evidence-drawer'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardDescription, CardTitle } from '../ui/card'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
import { ErrorState, HumanDecisionBanner, Skeleton } from '../ui/feedback'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { CompareDialog } from './compare-dialog'
import { KpiCard } from './kpi-card'

const SEVERITY_TONE = { high: 'danger', medium: 'warning', low: 'muted' } as const

function ExportDialog({
  simulationId,
  scenario,
  open,
  onOpenChange,
}: {
  simulationId: string
  scenario: ScenarioKey
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [reportType, setReportType] = useState<ReportType>('policy_brief')
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const reports: { value: ReportType; label: string }[] = [
    { value: 'policy_brief', label: 'Policy brief' },
    { value: 'regulatory_impact_assessment', label: 'Regulatory-impact assessment' },
    { value: 'spending_options_paper', label: 'Spending options paper' },
    { value: 'model_evaluation_report', label: 'Model-evaluation report' },
    { value: 'audit_package', label: 'Complete audit package' },
  ]

  async function run() {
    setBusy(true)
    setError(null)
    try {
      await exportReport(simulationId, { reportType, format, scenario })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The export could not be generated.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="text-lg font-semibold">Export</DialogTitle>
        <DialogDescription className="mt-1 text-[13px] text-muted">
          Exports are recorded in the audit log with the dataset and model versions used.
        </DialogDescription>

        {error ? (
          <div className="mt-4">
            <ErrorState description={error} />
          </div>
        ) : null}

        <fieldset className="mt-4">
          <legend className="mb-2 text-[13px] font-medium">Report</legend>
          <div className="space-y-1.5">
            {reports.map((report) => (
              <label key={report.value} className="flex items-center gap-2.5 text-[13px]">
                <input
                  type="radio"
                  name="report"
                  value={report.value}
                  checked={reportType === report.value}
                  onChange={() => setReportType(report.value)}
                />
                {report.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="mb-2 text-[13px] font-medium">Format</legend>
          <div className="flex gap-4">
            {(['pdf', 'csv', 'json'] as ExportFormat[]).map((value) => (
              <label key={value} className="flex items-center gap-2 text-[13px] uppercase">
                <input
                  type="radio"
                  name="format"
                  value={value}
                  checked={format === value}
                  onChange={() => setFormat(value)}
                />
                {value}
              </label>
            ))}
          </div>
          {format === 'pdf' ? (
            <p className="mt-2 text-xs text-muted">
              PDF opens a print-ready brief in a new tab — print or save as PDF from there.
            </p>
          ) : null}
        </fieldset>

        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={run} disabled={busy}>
            {busy ? 'Generating…' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ResultsScreen() {
  const workspace = useWorkspace()
  const queryClient = useQueryClient()
  const simulationId = workspace.simulationId
  const [scenario, setScenario] = useState<ScenarioKey>(workspace.activeScenario)
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['results', simulationId, scenario],
    queryFn: () => api.getResults(simulationId, scenario),
  })

  const approve = useMutation({
    mutationFn: () => api.approve(simulationId, 'Approved', 'Approved from the results screen'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['results', simulationId] })
      void queryClient.invalidateQueries({ queryKey: ['audit'] })
    },
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          description={
            error instanceof ApiError ? error.message : 'Results could not be loaded for this run.'
          }
          onRetry={() => void refetch()}
          offline={error instanceof ApiError && error.code === 'network_error'}
        />
      </div>
    )
  }

  const results = data.results

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <h1 className="text-2xl font-semibold sm:text-[28px] sm:leading-9">{workspace.title}</h1>
          <p className="mt-1 text-[13px] text-muted">
            {SCENARIO_LABELS[scenario]} scenario · Model confidence: {results.confidence} ·{' '}
            {workspace.baselineYear}–{workspace.endYear}
          </p>
        </div>
        <HumanDecisionBanner note="All figures are illustrative demonstration data." />
      </div>

      {results.partial ? (
        <div className="mb-4 rounded-lg border border-warning-line bg-warning-tint px-4 py-3 text-[13px] text-warning-ink">
          Partial results: the run did not complete. These figures must not be used for a decision.
        </div>
      ) : null}

      {data.approvalRequired ? (
        <Card className="mb-4 flex flex-col justify-between gap-3 border-warning-line bg-warning-tint p-4 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Approver sign-off required</CardTitle>
            <CardDescription className="mt-0.5 text-warning-ink">
              This is a high-impact simulation. Results cannot be exported or shared until an
              Approver signs off.
            </CardDescription>
          </div>
          <Button
            variant="primary"
            className="shrink-0 gap-1.5"
            onClick={() => approve.mutate()}
            disabled={approve.isPending}
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {approve.isPending ? 'Recording…' : 'Request approval'}
          </Button>
        </Card>
      ) : null}

      <Tabs value={scenario} onValueChange={(v) => setScenario(v as ScenarioKey)}>
        <TabsList className="mb-5" aria-label="Scenario">
          {SCENARIO_KEYS.map((key) => (
            <TabsTrigger key={key} value={key}>
              {SCENARIO_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <section aria-labelledby="kpi-heading" className="mb-6">
        <h2 id="kpi-heading" className="sr-only">
          Forecast metrics
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {results.kpis.map((kpi) => (
            <KpiCard key={kpi.metricId} forecast={kpi} />
          ))}
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <div className="mb-2 flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
            <CardTitle>Outcome trajectory</CardTitle>
            <CardDescription>
              Deviation from baseline · P10 · P50 (median) · P90
            </CardDescription>
          </div>
          <TrajectoryChart points={results.trajectory} metricId={results.trajectoryMetricId} />
        </Card>

        <Card className="p-5">
          <CardTitle>Key risks</CardTitle>
          <ul className="mt-3 space-y-3">
            {results.risks.map((risk) => (
              <li key={risk.title} className="border-b border-line-softer pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-medium text-ink">{risk.title}</span>
                  <Badge tone={SEVERITY_TONE[risk.severity]}>{risk.severity}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{risk.note}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle>Positively affected groups</CardTitle>
          <ul className="mt-3 space-y-2">
            {results.positivelyAffected.map((group) => (
              <li key={group.group} className="border-b border-line-softer pb-2 text-[13px] last:border-b-0 last:pb-0">
                <span className="font-medium text-ink">{group.group}</span>
                <span className="block text-xs text-muted">{group.effect}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <CardTitle>Negatively affected groups</CardTitle>
          <ul className="mt-3 space-y-2">
            {results.negativelyAffected.map((group) => (
              <li key={group.group} className="border-b border-line-softer pb-2 text-[13px] last:border-b-0 last:pb-0">
                <span className="font-medium text-ink">{group.group}</span>
                <span className="block text-xs text-muted">{group.effect}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <CardTitle>Recommended interventions</CardTitle>
          <CardDescription className="mt-0.5">
            Options for consideration — not decisions.
          </CardDescription>
          <ul className="mt-3 space-y-2">
            {results.interventions.map((intervention) => (
              <li
                key={intervention.title}
                className="border-b border-line-softer pb-2 text-[13px] last:border-b-0 last:pb-0"
              >
                <span className="font-medium text-ink">{intervention.title}</span>
                <span className="block text-xs text-muted">{intervention.note}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <CardTitle>Evidence summary</CardTitle>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {[
              { n: results.evidence.datasets.length, label: 'Datasets' },
              { n: results.evidence.models.length, label: 'Models' },
              { n: results.evidence.assumptions.length, label: 'Assumptions' },
              { n: results.evidence.approvals.length, label: 'Approvals' },
            ].map((item) => (
              <div key={item.label} className="rounded-md border border-line-soft bg-canvas p-3 text-center">
                <div className="tabular text-lg font-bold">{item.n}</div>
                <div className="text-[11px] text-muted">{item.label}</div>
              </div>
            ))}
          </div>
          <Button className="mt-3 w-full gap-1.5" onClick={() => setEvidenceOpen(true)}>
            <FileSearch className="h-4 w-4" aria-hidden="true" />
            View evidence
          </Button>
        </Card>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button className="gap-1.5" onClick={() => setCompareOpen(true)}>
          <GitCompare className="h-4 w-4" aria-hidden="true" />
          Compare scenarios
        </Button>
        <Button className="gap-1.5" onClick={() => workspace.markSaved()}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Duplicate simulation
        </Button>
        <Button
          variant="primary"
          className="gap-1.5"
          disabled={data.approvalRequired}
          title={data.approvalRequired ? 'Awaiting approver sign-off' : undefined}
          onClick={() => setExportOpen(true)}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export policy brief
        </Button>
      </div>

      <EvidenceDrawer
        simulationId={simulationId}
        scenario={scenario}
        open={evidenceOpen}
        onOpenChange={setEvidenceOpen}
      />
      <CompareDialog
        simulationId={simulationId}
        activeScenario={scenario}
        open={compareOpen}
        onOpenChange={setCompareOpen}
      />
      <ExportDialog
        simulationId={simulationId}
        scenario={scenario}
        open={exportOpen}
        onOpenChange={setExportOpen}
      />
    </div>
  )
}
