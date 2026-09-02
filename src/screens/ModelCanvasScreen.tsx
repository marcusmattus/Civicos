import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardSubtitle, CardTitle, PageHeader, cx } from '../components/ui'
import { canvasTiles, modelIndustries, pipelineNodes, policyInstruments } from '../data/civic'

export default function ModelCanvasScreen() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>(
    modelIndustries.filter((i) => i.checked).map((i) => i.label),
  )
  const [industriesOpen, setIndustriesOpen] = useState(true)

  function toggle(label: string) {
    setSelected((current) =>
      current.includes(label) ? current.filter((l) => l !== label) : [...current, label],
    )
  }

  return (
    <>
      <PageHeader title="Build the system model" subtitle="Define how systems interact and outcomes emerge." />

      {/* Pipeline — scrolls horizontally rather than wrapping on narrow screens */}
      <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max items-center gap-2">
          {pipelineNodes.map((node, i) => (
            <div key={node.label} className="flex items-center gap-2">
              <Card className="min-w-[110px] px-4.5 py-3 text-center">
                <div className="mb-0.5 text-[13px] font-semibold">{node.label}</div>
                <div className="text-[11px] text-ink-faint">{node.sub}</div>
              </Card>
              {i < pipelineNodes.length - 1 ? <div className="text-ink-faint">→</div> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-[280px_1fr_280px]">
        {industriesOpen ? (
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <CardTitle>Industries</CardTitle>
              <button
                type="button"
                aria-label="Hide industries panel"
                onClick={() => setIndustriesOpen(false)}
                className="cursor-pointer border-none bg-transparent p-0 text-ink-faint hover:text-ink"
              >
                ×
              </button>
            </div>
            <CardSubtitle className="mb-3">Select industries to include in the model.</CardSubtitle>
            {modelIndustries.map((industry) => {
              const checked = selected.includes(industry.label)
              return (
                <label
                  key={industry.label}
                  className="flex cursor-pointer items-center gap-2.5 py-1.5 text-[13px]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(industry.label)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cx(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px]',
                      checked ? 'border-brand bg-brand' : 'border-line-strong bg-surface',
                    )}
                  >
                    {checked ? (
                      <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-none stroke-white stroke-2">
                        <polyline points="2,6.5 4.5,9 10,3" />
                      </svg>
                    ) : null}
                  </span>
                  <span>{industry.label}</span>
                </label>
              )
            })}
          </Card>
        ) : (
          <Card className="flex items-center justify-between p-4">
            <CardTitle>Industries</CardTitle>
            <Button variant="ghost" onClick={() => setIndustriesOpen(true)}>
              Show
            </Button>
          </Card>
        )}

        <Card className="flex min-h-[260px] items-center justify-center p-5">
          <div className="grid w-full grid-cols-3 grid-rows-2 gap-3.5">
            {canvasTiles.map((tile, i) =>
              tile === null ? (
                <div key={i} />
              ) : tile === 'Policy instruments' ? (
                <div
                  key={i}
                  className="rounded-lg border border-brand bg-brand-tint p-3.5 text-center text-xs font-semibold text-brand-deep"
                >
                  Policy
                  <br />
                  instruments
                </div>
              ) : (
                <div
                  key={i}
                  className="rounded-md border border-line bg-canvas px-3 py-2 text-center text-xs"
                >
                  {tile}
                </div>
              ),
            )}
          </div>
        </Card>

        <Card className="p-4">
          <CardTitle className="mb-0.5">Policy instruments</CardTitle>
          <CardSubtitle className="mb-3">Selected instruments and settings.</CardSubtitle>
          {policyInstruments.map((pi) => (
            <div
              key={pi.label}
              className="flex items-center justify-between border-b border-line-soft py-2 text-[13px]"
            >
              <div>{pi.label}</div>
              <div className="text-xs font-medium text-positive">{pi.status}</div>
            </div>
          ))}
          <Button className="mt-3 h-9 w-full px-0 text-[13px]">Edit instruments</Button>
        </Card>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-end">
        <Button className="px-4.5">Save draft</Button>
        <Button className="px-4.5">Validate model</Button>
        <Button variant="primary" onClick={() => navigate('/scenarios')}>
          Continue
        </Button>
      </div>
    </>
  )
}
