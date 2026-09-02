'use client'

import { useQueries } from '@tanstack/react-query'
import { api } from '@/lib/client/api'
import { formatMetricValue } from '@/lib/format'
import { SCENARIO_KEYS, SCENARIO_LABELS } from '@/lib/types'
import type { ScenarioKey } from '@/lib/types'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
import { LoadingBlock } from '../ui/feedback'

/** Side-by-side median outcomes across all four scenarios. */
export function CompareDialog({
  simulationId,
  open,
  onOpenChange,
  activeScenario,
}: {
  simulationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  activeScenario: ScenarioKey
}) {
  const queries = useQueries({
    queries: SCENARIO_KEYS.map((scenario) => ({
      queryKey: ['results', simulationId, scenario],
      queryFn: () => api.getResults(simulationId, scenario),
      enabled: open,
    })),
  })

  const loading = queries.some((q) => q.isLoading)
  const bundles = queries.map((q) => q.data?.results)
  const metrics = bundles.find(Boolean)?.kpis ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogTitle className="text-lg font-semibold">Compare scenarios</DialogTitle>
        <DialogDescription className="mt-1 text-[13px] text-muted">
          Median (P50) outcome for each metric across all four scenarios.
        </DialogDescription>

        {loading ? (
          <LoadingBlock label="Running each scenario" />
        ) : (
          <div className="mt-4 max-h-[60vh] overflow-auto">
            <table className="w-full border-collapse text-[13px]">
              <caption className="sr-only">
                Median outcomes by metric and scenario. Figures are illustrative demonstration data.
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky top-0 border-b border-line bg-canvas p-2 text-left font-semibold">
                    Metric
                  </th>
                  {SCENARIO_KEYS.map((scenario) => (
                    <th
                      key={scenario}
                      scope="col"
                      className="sticky top-0 border-b border-line bg-canvas p-2 text-right font-semibold"
                    >
                      {SCENARIO_LABELS[scenario]}
                      {scenario === activeScenario ? (
                        <span className="ml-1 text-xs font-normal text-civic">(current)</span>
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric) => (
                  <tr key={metric.metricId}>
                    <th scope="row" className="border-b border-line-soft p-2 text-left font-medium">
                      {metric.label}
                      <span className="ml-1 text-xs font-normal text-muted">({metric.unit})</span>
                    </th>
                    {SCENARIO_KEYS.map((scenario, i) => {
                      const value = bundles[i]?.kpis.find((k) => k.metricId === metric.metricId)
                      return (
                        <td
                          key={scenario}
                          className="tabular border-b border-line-soft p-2 text-right"
                        >
                          {value ? formatMetricValue(value) : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
