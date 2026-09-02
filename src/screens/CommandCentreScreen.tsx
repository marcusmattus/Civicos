import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, Chip } from '../components/ui'
import { defaultPrompt, promptChips, recentSimulations, starterPrompts } from '../data/civic'

const promptActions = ['Attach data', 'Add policy', 'Add constraint', 'Voice']

export default function CommandCentreScreen() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState(defaultPrompt)

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold sm:text-[28px] sm:leading-9">
        What public system do you want to model?
      </h1>

      <div className="mb-6 rounded-lg border border-brand-ring bg-surface p-5 shadow-[0_0_0_3px_rgba(37,99,235,0.08)]">
        <label htmlFor="prompt" className="sr-only">
          Describe the public system to model
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="h-[70px] w-full resize-none border-none text-base leading-relaxed outline-none"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {promptActions.map((action) => (
              <button
                key={action}
                type="button"
                className="cursor-pointer rounded-md border border-line bg-surface px-3 py-1.5 text-[13px] text-ink hover:bg-canvas"
              >
                {action}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label="Submit prompt"
            onClick={() => navigate('/model')}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border-none bg-brand hover:bg-brand-deep"
          >
            <span className="h-0 w-0 border-r-[6px] border-b-[9px] border-l-[6px] border-r-transparent border-b-white border-l-transparent" />
          </button>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2.5">
        {promptChips.map((chip) => (
          <Chip key={chip}>{chip}</Chip>
        ))}
        <button
          type="button"
          onClick={() => navigate('/model')}
          className="ml-auto h-10 cursor-pointer rounded-md border-none bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-deep"
        >
          Create simulation
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section>
          <h2 className="mb-3 text-base font-semibold">Recent simulations</h2>
          {recentSimulations.map((sim) => (
            <Link
              key={sim.id}
              to="/results"
              className="mb-2.5 flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4 text-ink no-underline hover:border-brand-ring hover:no-underline"
            >
              <div>
                <div className="mb-0.5 text-sm font-semibold">{sim.title}</div>
                <div className="text-[13px] text-ink-muted">{sim.scenario}</div>
              </div>
              <div className="shrink-0 text-xs text-ink-faint">{sim.updated}</div>
            </Link>
          ))}
          <Link to="/simulations" className="text-[13px]">
            View all simulations →
          </Link>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Starter prompts</h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {starterPrompts.map((sp) => (
              <Card key={sp.title} className="cursor-pointer p-3.5 hover:border-brand-ring">
                <button
                  type="button"
                  onClick={() => setPrompt(sp.title)}
                  className="block w-full cursor-pointer border-none bg-transparent p-0 text-left"
                >
                  <div className="mb-1.5 text-[13px] font-medium">{sp.title}</div>
                  <div className="text-xs text-ink-faint">{sp.years}</div>
                </button>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
