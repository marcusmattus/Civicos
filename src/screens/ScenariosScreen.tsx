import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRun } from '../app/run'
import { Button, Card, CardSubtitle, CardTitle, PageHeader, cx } from '../components/ui'
import { assumptions, dependencyPreview, levers, scenarioTabs } from '../data/civic'
import type { ScenarioTab } from '../data/civic'

export default function ScenariosScreen() {
  const navigate = useNavigate()
  const { start } = useRun()
  const [activeTab, setActiveTab] = useState<ScenarioTab>('Expected')

  function runSimulation() {
    start()
    navigate('/run')
  }

  return (
    <>
      <PageHeader title="Configure scenarios" subtitle="Adjust assumptions and levers for each scenario." />

      <div
        role="tablist"
        aria-label="Scenario"
        className="mb-6 flex gap-1 overflow-x-auto border-b border-line"
      >
        {scenarioTabs.map((tab) => {
          const active = tab === activeTab
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cx(
                'cursor-pointer border-none bg-transparent px-4.5 py-2.5 text-sm font-medium whitespace-nowrap',
                active
                  ? 'border-b-2 border-brand text-ink'
                  : 'border-b-2 border-transparent text-ink-faint hover:text-ink-muted',
              )}
            >
              {tab}
            </button>
          )
        })}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle className="mb-0.5">Scenario assumptions</CardTitle>
          <CardSubtitle className="mb-4">
            Edit key assumptions for the {activeTab} scenario.
          </CardSubtitle>
          {assumptions.map((a) => (
            <div
              key={a.label}
              className="flex items-center justify-between gap-3 border-b border-line-soft py-2"
            >
              <div className="text-[13px] text-ink">{a.label}</div>
              <div className="tabular min-w-[70px] rounded-md border border-line bg-canvas px-2.5 py-1 text-right text-[13px] font-medium">
                {a.value}
              </div>
            </div>
          ))}
          <Button variant="ghost" className="mt-3.5 text-[13px]">
            Reset to defaults
          </Button>
        </Card>

        <Card className="p-5">
          <CardTitle className="mb-0.5">Key levers</CardTitle>
          <CardSubtitle className="mb-4">Adjust the main drivers for this scenario.</CardSubtitle>
          {levers.map((lever) => (
            <div key={lever.label} className="mb-4">
              <div className="mb-1.5 flex justify-between gap-3 text-[13px]">
                <div>{lever.label}</div>
                <div className="tabular font-semibold">{lever.display}</div>
              </div>
              <div
                role="meter"
                aria-label={lever.label}
                aria-valuenow={lever.pct}
                aria-valuemin={0}
                aria-valuemax={100}
                className="relative h-1.5 rounded-full bg-[#eef0f4]"
              >
                <div
                  className="absolute top-0 left-0 h-1.5 rounded-full bg-brand"
                  style={{ width: `${lever.pct}%` }}
                />
              </div>
            </div>
          ))}
          <div className="mt-1.5">
            <label htmlFor="scenario-notes" className="mb-2 block text-[13px] font-semibold">
              Scenario notes
            </label>
            <textarea
              id="scenario-notes"
              placeholder="Add notes for this scenario..."
              className="h-14 w-full resize-none rounded-md border border-line p-2.5 text-[13px] outline-none focus:border-brand-ring"
            />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card className="px-5 py-4">
          <CardTitle className="mb-1.5">Dependency preview</CardTitle>
          <CardSubtitle>{dependencyPreview}</CardSubtitle>
        </Card>
        <div>
          <div className="mb-4 rounded-lg border border-positive-line bg-positive-tint px-5 py-4">
            <div className="mb-0.5 text-[13px] font-semibold text-positive">✓ No issues detected</div>
            <div className="text-xs text-positive">All required inputs are valid.</div>
          </div>
          <button
            type="button"
            onClick={runSimulation}
            className="h-11 w-full cursor-pointer rounded-md border-none bg-brand text-[15px] font-semibold text-white hover:bg-brand-deep"
          >
            Run simulation
          </button>
        </div>
      </div>
    </>
  )
}
