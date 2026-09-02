'use client'

import { Download, FileText } from 'lucide-react'
import { useState } from 'react'
import { ApiError, exportReport } from '@/lib/client/api'
import { useWorkspace } from '@/lib/store/workspace'
import { REPORT_LABELS, REPORT_TYPES } from '@/lib/types'
import type { ExportFormat, ReportType } from '@/lib/types'
import { PageHeader } from '../page-header'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { ErrorState } from '../ui/feedback'

const DESCRIPTIONS: Record<ReportType, string> = {
  policy_brief: 'Decision-ready summary with forecasts, risks and recommended interventions.',
  regulatory_impact_assessment: 'Assessment of regulatory options against modelled outcomes.',
  spending_options_paper: 'Comparison of spending allocations within the stated envelope.',
  dataset_quality_report: 'Provenance, freshness and quality warnings for every dataset used.',
  model_evaluation_report: 'Model versions, limitations, bias tests and approved uses.',
  mobility_sandbox_report: 'Autonomous-mobility pilot conditions, monitoring and outcomes.',
  audit_package: 'Complete evidence bundle: parameters, versions, approvals and exports.',
}

export function ReportsScreen() {
  const workspace = useWorkspace()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate(reportType: ReportType, format: ExportFormat) {
    setBusy(`${reportType}-${format}`)
    setError(null)
    try {
      await exportReport(workspace.simulationId, {
        reportType,
        format,
        scenario: workspace.activeScenario,
      })
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'The report could not be generated. Try again in a moment.',
      )
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Reports"
        description={`Governed, exportable documents for ${workspace.title} (${workspace.activeScenario} scenario). Every export is recorded in the audit log.`}
      />

      {error ? (
        <div className="mb-4">
          <ErrorState description={error} />
        </div>
      ) : null}

      <ul className="space-y-3">
        {REPORT_TYPES.map((reportType) => (
          <li key={reportType}>
            <Card className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-medium">{REPORT_LABELS[reportType]}</h2>
                  <p className="mt-0.5 text-xs text-muted">{DESCRIPTIONS[reportType]}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {(['pdf', 'csv', 'json'] as ExportFormat[]).map((format) => (
                  <Button
                    key={format}
                    size="sm"
                    className="gap-1.5 uppercase"
                    disabled={busy !== null}
                    onClick={() => generate(reportType, format)}
                  >
                    <Download className="h-3 w-3" aria-hidden="true" />
                    {busy === `${reportType}-${format}` ? '…' : format}
                  </Button>
                ))}
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-muted">
        PDF exports open a print-ready brief in a new tab. All figures are illustrative
        demonstration data and are labelled as such in every export.
      </p>
    </div>
  )
}
