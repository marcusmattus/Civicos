import { NextResponse } from 'next/server'
import { badRequest, forbidden, notFound } from '@/lib/api'
import { datasetById, modelById } from '@/lib/data/catalogue'
import { buildResultBundle } from '@/lib/engine/forecast'
import { formatMetricValue } from '@/lib/format'
import { exportSchema } from '@/lib/schemas'
import { repository } from '@/lib/services'
import { getRun } from '@/lib/services/run-engine'
import { REPORT_LABELS } from '@/lib/types'
import type { ResultBundle, Simulation } from '@/lib/types'

type Context = { params: Promise<{ id: string }> }

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function toCsv(bundle: ResultBundle): string {
  const header = [
    'metric',
    'unit',
    'baseline',
    'p10',
    'p50',
    'p90',
    'change',
    'model',
    'classification',
    'sources',
  ]
  const rows = bundle.kpis.map((kpi) => [
    kpi.label,
    kpi.unit,
    String(kpi.baseline),
    String(kpi.p10),
    String(kpi.p50),
    String(kpi.p90),
    kpi.change,
    modelById.get(kpi.modelId)?.name ?? kpi.modelId,
    kpi.classification,
    kpi.sourceDatasetIds.map((id) => datasetById.get(id)?.name ?? id).join('; '),
  ])
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
}

/**
 * Print-ready HTML brief. The client opens it and prints to PDF, which keeps
 * the export server-side dependency-free; swap in a PDF renderer here when one
 * is available.
 */
function toPrintableHtml(
  simulation: Simulation,
  bundle: ResultBundle,
  reportLabel: string,
): string {
  const rows = bundle.kpis
    .map(
      (kpi) => `<tr>
        <td>${kpi.label}</td>
        <td class="num">${formatMetricValue(kpi)}</td>
        <td class="num">${formatMetricValue({ unit: kpi.unit, p50: kpi.p10 })} – ${formatMetricValue({ unit: kpi.unit, p50: kpi.p90 })}</td>
        <td>${kpi.classification}</td>
        <td>${modelById.get(kpi.modelId)?.name ?? kpi.modelId}</td>
      </tr>`,
    )
    .join('')

  const risks = bundle.risks.map((r) => `<li><strong>${r.title}</strong> — ${r.note}</li>`).join('')
  const interventions = bundle.interventions
    .map((i) => `<li><strong>${i.title}</strong> — ${i.note}</li>`)
    .join('')
  const datasets = bundle.evidence.datasets
    .map((d) => `<li>${d.name} · v${d.version} · ${d.classification}</li>`)
    .join('')

  return `<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8">
<title>${reportLabel} — ${simulation.title}</title>
<style>
  body { font-family: Inter, system-ui, sans-serif; color: #152033; margin: 40px; line-height: 1.5; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  h2 { font-size: 15px; margin: 28px 0 8px; }
  .meta { color: #667085; font-size: 13px; }
  .banner { background: #fffbeb; border: 1px solid #fbe4ac; color: #92600a;
            padding: 10px 14px; border-radius: 8px; font-size: 13px; margin: 16px 0; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; }
  th, td { text-align: left; border-bottom: 1px solid #e5e9f0; padding: 8px 10px; }
  th { background: #f6f8fb; font-weight: 600; }
  td.num { font-variant-numeric: tabular-nums; }
  ul { margin: 0; padding-left: 18px; font-size: 13px; }
  footer { margin-top: 32px; color: #98a2b3; font-size: 11px; }
  @media print { body { margin: 12mm; } }
</style></head>
<body>
  <h1>${reportLabel}: ${simulation.title}</h1>
  <div class="meta">${simulation.organisation} · ${bundle.scenario} scenario · ${simulation.baselineYear}–${simulation.endYear} · Generated ${new Date(bundle.generatedAt).toUTCString()}</div>
  <div class="banner">Modelled outcomes — human decision required.${simulation.demo ? ' All figures in this document are illustrative demonstration data.' : ''}${bundle.partial ? ' Results are partial: the run did not complete.' : ''}</div>

  <h2>Prompt</h2>
  <p>${simulation.prompt}</p>

  <h2>Forecast metrics</h2>
  <table>
    <thead><tr><th>Metric</th><th>P50</th><th>P10 – P90</th><th>Classification</th><th>Model</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <h2>Key risks</h2><ul>${risks}</ul>
  <h2>Recommended interventions</h2><ul>${interventions}</ul>
  <h2>Evidence — datasets</h2><ul>${datasets}</ul>

  <footer>CivicOS · SECURITY CLASSIFICATION: OFFICIAL · Every figure carries a provenance classification; scenario assumptions are inputs, not observations.</footer>
</body></html>`
}

export async function POST(request: Request, { params }: Context) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = exportSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error)

  const simulation = await repository().getSimulation(id)
  if (!simulation) return notFound('Simulation')

  const run = getRun(id)
  if (run?.status === 'awaiting_approval' || simulation.status === 'awaiting_approval') {
    return forbidden('This simulation is awaiting approver sign-off and cannot be exported yet')
  }

  const { scenario, format, reportType } = parsed.data
  const bundle = buildResultBundle(simulation, scenario, { partial: run?.partial ?? false })
  const label = REPORT_LABELS[reportType]
  const filename = `${simulation.id}-${reportType}-${scenario}`

  await repository().appendAudit({
    id: `aud-${Date.now().toString(36)}`,
    at: new Date().toISOString(),
    actor: simulation.owner,
    organisation: simulation.organisation,
    action: `Export ${label.toLowerCase()} (${format.toUpperCase()})`,
    subject: simulation.title,
    simulationId: simulation.id,
    decision: 'Recorded',
  })

  if (format === 'csv') {
    return new NextResponse(toCsv(bundle), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    })
  }

  if (format === 'pdf') {
    return new NextResponse(toPrintableHtml(simulation, bundle, label), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}.html"`,
      },
    })
  }

  return new NextResponse(
    JSON.stringify({ report: label, simulation, results: bundle }, null, 2),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    },
  )
}
