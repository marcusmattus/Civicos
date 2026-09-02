import { Button, Card, CardTitle } from '../components/ui'
import { evidenceSummary, interventions, kpis, risks, trajectoryYears } from '../data/civic'

const toneClass = {
  positive: 'text-positive',
  negative: 'text-negative',
  warning: 'text-warning',
} as const

/** P10–P90 uncertainty band and the P50 median line, as drawn in the design. */
const BAND_POINTS =
  '0,150 60,148 120,140 180,135 240,120 300,110 360,95 420,85 480,70 540,60 600,45 660,35 720,20 760,10 760,190 720,175 660,165 600,155 540,150 480,145 420,150 360,155 300,160 240,165 180,170 120,175 60,178 0,180'
const MEDIAN_POINTS =
  '0,165 60,163 120,158 180,155 240,145 300,138 360,128 420,120 480,110 540,105 600,95 660,88 720,78 760,70'

function TrajectoryChart() {
  return (
    <svg viewBox="0 0 760 260" className="h-60 w-full" role="img" aria-label="Outcome trajectories, 2027 to 2040">
      <line x1="0" y1="130" x2="760" y2="130" stroke="#e5e9f0" />
      <polygon points={BAND_POINTS} fill="#2563eb" opacity="0.12" />
      <polyline points={MEDIAN_POINTS} fill="none" stroke="#2563eb" strokeWidth="2.5" />
      <polyline points="0,130 760,130" fill="none" stroke="#98a2b3" strokeWidth="1" strokeDasharray="4,4" />
    </svg>
  )
}

export default function ResultsScreen() {
  return (
    <>
      <div className="mb-5 flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
        <div>
          <h1 className="mb-1 text-2xl font-semibold sm:text-[28px] sm:leading-9">London AI Transition</h1>
          <div className="text-[13px] text-ink-muted">Expected scenario · Model confidence: High</div>
        </div>
        <div className="rounded-lg border border-warning-line bg-warning-tint px-4 py-2.5 text-[13px] font-medium text-warning-ink">
          Modelled outcomes — human decision required.
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-3.5">
            <div className="mb-2 text-xs text-ink-muted">
              {kpi.label} ({kpi.year})
            </div>
            <div className="tabular mb-1 text-xl font-bold">{kpi.value}</div>
            <div className={`tabular text-xs font-medium ${toneClass[kpi.tone]}`}>{kpi.change}</div>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <div className="mb-3 flex flex-col justify-between gap-1 sm:flex-row">
            <CardTitle>Outcome trajectories</CardTitle>
            <div className="text-xs text-ink-faint">
              All values shown as deviation from baseline · P10 · P50 (median) · P90
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              <TrajectoryChart />
              <div className="tabular mt-1 flex justify-between text-[11px] text-ink-faint">
                {trajectoryYears.map((year) => (
                  <div key={year}>{year}</div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <CardTitle className="mb-3">Key risks</CardTitle>
          {risks.map((risk) => (
            <div
              key={risk}
              className="flex gap-2 border-b border-line-softer py-[7px] text-[13px]"
            >
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
              <div>{risk}</div>
            </div>
          ))}
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <Card className="p-5">
          <CardTitle className="mb-3">Recommended interventions</CardTitle>
          {interventions.map((intervention) => (
            <div key={intervention} className="border-b border-line-softer py-[7px] text-[13px]">
              {intervention}
            </div>
          ))}
        </Card>

        <Card className="p-5">
          <CardTitle className="mb-3">Evidence summary</CardTitle>
          <div className="grid grid-cols-2 gap-2.5">
            {evidenceSummary.map((item) => (
              <div
                key={item.label}
                className="rounded-md border border-[#eef0f4] bg-canvas p-2.5 text-center"
              >
                <div className="tabular text-lg font-bold">{item.n}</div>
                <div className="text-[11px] text-ink-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end">
        <Button className="px-4.5">Compare</Button>
        <Button className="px-4.5">View evidence</Button>
        <Button variant="primary">Export brief</Button>
      </div>
    </>
  )
}
