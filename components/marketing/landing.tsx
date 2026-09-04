import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  Car,
  Database,
  FileText,
  GitBranch,
  Lock,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  Workflow,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DATA_CLASSIFICATIONS } from '@/lib/types'
import { agentDefs, datasets, industries, levers, modelCards, policyInstruments } from '@/lib/data/catalogue'
import { Button } from '../ui/button'

/**
 * The public front door.
 *
 * Everything quantified here is counted from the catalogue rather than typed in,
 * so the page cannot drift from the product it describes.
 */

const workflow = [
  { step: 'Sign in', detail: 'Government email, MFA and role-based access.' },
  { step: 'Command Centre', detail: 'Describe the system in prose with @-references.' },
  { step: 'Industries', detail: 'Pick the sectors and the policy instruments in play.' },
  { step: 'Model Canvas', detail: 'Wire datasets, models and levers into a graph.' },
  { step: 'Scenarios', detail: 'Configure four futures across the same levers.' },
  { step: 'Agent run', detail: 'Watch retrieval, validation and simulation live.' },
  { step: 'Results', detail: 'Forecasts with P10–P90 bands, risks and groups.' },
  { step: 'Evidence', detail: 'Trace every figure, then export the brief.' },
]

const capabilities: Array<{ icon: LucideIcon; title: string; body: string }> = [
  {
    icon: Workflow,
    title: 'Model Canvas',
    body: `Assemble a system from ${datasets.length} datasets and ${modelCards.length} registered models. Drag to rearrange, connect dependencies, inspect any node, undo anything.`,
  },
  {
    icon: SlidersHorizontal,
    title: 'Scenario configuration',
    body: `${levers.length} levers across ${policyInstruments.length} policy instruments. Levers stay locked until their instrument is in scope, and conflicts surface before you run.`,
  },
  {
    icon: Bot,
    title: 'Agent orchestration',
    body: `${agentDefs.length} agents stream their progress over SSE. They report operational activity and evidence references — never model reasoning.`,
  },
  {
    icon: Car,
    title: 'MobilitySim',
    body: 'An autonomous-transport sandbox on a live map: zones, depots, congestion, accessibility and safety, with the licence conditions your settings would breach.',
  },
  {
    icon: Database,
    title: 'DataFoundry',
    body: 'Every dataset carries its owner, refresh cadence, coverage and classification, so a figure can always be traced back to what produced it.',
  },
  {
    icon: ScrollText,
    title: 'Audit Centre',
    body: 'Runs, approvals, exports and access changes are recorded as they happen. Governance shows exactly what each role may do.',
  },
]

const classificationBlurb: Record<string, string> = {
  OBSERVED: 'Measured directly and published by the owning body.',
  DERIVED: 'Computed from observed inputs by a documented method.',
  IMPUTED: 'Filled where observation is missing, by a stated rule.',
  SYNTHETIC: 'Generated to stand in for data that cannot be shared.',
  FORECAST: 'Projected forward by a registered model.',
  SCENARIO_ASSUMPTION: 'Chosen by the analyst as an input to the scenario.',
}

function Mark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-civic">
          <span className="h-2 w-2 rounded-full bg-white" />
        </span>
        <span className="text-lg font-semibold tracking-[-0.01em] text-white">CivicOS</span>
      </span>
    </span>
  )
}

/**
 * The same system-graph motif as the sign-in panel, widened for the hero.
 * Decorative only, so it is hidden from assistive technology.
 */
function HeroGraph() {
  const edges: Array<[number, number, number, number]> = [
    [60, 150, 190, 90],
    [190, 90, 320, 160],
    [320, 160, 450, 110],
    [190, 90, 230, 250],
    [230, 250, 110, 320],
    [230, 250, 360, 300],
    [360, 300, 450, 110],
    [360, 300, 470, 380],
    [110, 320, 90, 430],
    [470, 380, 350, 440],
    [350, 440, 110, 320],
  ]
  const nodes: Array<[number, number, number]> = [
    [60, 150, 4],
    [190, 90, 6],
    [320, 160, 4],
    [450, 110, 5],
    [230, 250, 7],
    [110, 320, 4],
    [360, 300, 5],
    [90, 430, 4],
    [470, 380, 4],
    [350, 440, 5],
  ]

  return (
    <svg
      viewBox="0 0 540 500"
      className="h-full w-full"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="#2563eb" strokeWidth="1" opacity="0.5">
        {edges.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      <g fill="#06b6d4">
        {nodes.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
    </svg>
  )
}

function DemoNotice() {
  return (
    <p className="text-[13px] text-navy-muted">
      Every figure in CivicOS is illustrative demonstration data from a deterministic mock engine.
      Nothing here is an official statistic.
    </p>
  )
}

export function Landing() {
  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#main"
        className="sr-only-focusable absolute top-2 left-2 z-50 rounded-md bg-civic px-3 py-2 text-sm text-white"
      >
        Skip to main content
      </a>

      {/* ---- Dark band: header + hero ---------------------------------- */}
      <div className="bg-midnight">
        <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:px-8">
          <Mark />
          <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-2">
            <a
              href="#workflow"
              className="hidden rounded-md px-3 py-2 text-sm text-navy-soft no-underline hover:bg-navy hover:text-white hover:no-underline sm:inline-block"
            >
              How it works
            </a>
            <a
              href="#provenance"
              className="hidden rounded-md px-3 py-2 text-sm text-navy-soft no-underline hover:bg-navy hover:text-white hover:no-underline sm:inline-block"
            >
              Provenance
            </a>
            <Button asChild variant="primary" size="sm" className="ml-1">
              <Link href="/login" className="no-underline hover:no-underline">
                Sign in
              </Link>
            </Button>
          </nav>
        </header>

        <main id="main">
          <section className="mx-auto grid max-w-6xl gap-12 px-5 pt-12 pb-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-8 lg:pt-20 lg:pb-24">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-navy-line bg-navy px-3 py-1 text-xs font-medium text-navy-soft">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Decision intelligence for the public sector
              </span>

              <h1 className="mt-6 text-4xl leading-[1.1] font-semibold tracking-[-0.02em] text-white sm:text-5xl lg:text-[56px]">
                Model the consequences before the decision.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-navy-soft">
                CivicOS simulates public spending, regulation, industries and infrastructure across
                whole systems — so the trade-offs, the affected groups and the uncertainty are on the
                table while there is still a choice to make.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild variant="primary" size="lg">
                  <Link href="/login" className="no-underline hover:no-underline">
                    Open the platform
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <a
                  href="#workflow"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-navy-line px-5 text-[15px] font-medium text-navy-soft no-underline hover:border-navy-dim hover:text-white hover:no-underline"
                >
                  See the workflow
                </a>
              </div>

              <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-navy-line pt-8 sm:grid-cols-4">
                {[
                  ['Industries', industries.length],
                  ['Policy instruments', policyInstruments.length],
                  ['Registered models', modelCards.length],
                  ['Agents', agentDefs.length],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <dt className="text-[13px] text-navy-muted">{label}</dt>
                    <dd className="tabular mt-1 text-2xl font-semibold text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div
              className="relative hidden min-h-[420px] rounded-card border border-navy-line bg-navy/40 lg:block"
              aria-hidden="true"
            >
              <HeroGraph />
              <div className="absolute top-8 right-10 flex h-9 w-9 items-center justify-center rounded-lg border border-civic/40 bg-civic/15">
                <div className="h-3.5 w-3.5 rounded-[3px] border-2 border-cyan" />
              </div>
              <div className="absolute bottom-32 left-12 flex h-9 w-9 items-center justify-center rounded-lg border border-civic/40 bg-civic/15">
                <div className="h-3.5 w-3.5 rounded-full border-2 border-teal" />
              </div>
              <div className="absolute right-16 bottom-14 flex h-9 w-9 items-center justify-center rounded-lg border border-civic/40 bg-civic/15">
                <div className="h-2.5 w-3.5 rounded-[2px] border-2 border-civic" />
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* ---- Workflow -------------------------------------------------- */}
      <section id="workflow" className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
        <h2 className="text-3xl font-semibold tracking-[-0.015em] text-ink">
          One path, from question to signed-off brief
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted">
          Each step hands the next one a complete, inspectable object. Nothing is inferred behind
          your back, and you can stop at any stage and look at what has been built so far.
        </p>

        <ol className="mt-10 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {workflow.map((item, i) => (
            <li key={item.step} className="bg-surface p-5">
              <span className="tabular text-xs font-semibold text-civic">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-[15px] font-semibold text-ink">{item.step}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-muted">{item.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---- Provenance ------------------------------------------------ */}
      <section id="provenance" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-civic-ring bg-civic-tint px-3 py-1 text-xs font-medium text-civic-deep">
                <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                Provenance is a first-class concept
              </span>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.015em] text-ink">
                Every number says where it came from
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-muted">
                A metric inherits the <strong className="font-semibold text-ink">weakest</strong>{' '}
                provenance of its inputs. A scenario assumption anywhere in the lineage makes the
                output a scenario assumption; synthetic input makes it synthetic.
              </p>
              <p className="mt-4 text-[15px] leading-7 text-muted">
                Observed and synthetic data are never silently combined — the validator raises the
                mismatch and the badge on the figure changes. Each classification carries a glyph as
                well as a colour, so the distinction survives greyscale and colour-blind viewing.
              </p>
            </div>

            <dl className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
              {DATA_CLASSIFICATIONS.map((classification) => (
                <div key={classification} className="bg-surface p-5">
                  <dt className="text-[13px] font-semibold tracking-[0.02em] text-ink">
                    {classification.replace(/_/g, ' ')}
                  </dt>
                  <dd className="mt-1.5 text-[13px] leading-6 text-muted">
                    {classificationBlurb[classification]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ---- Capabilities ---------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
        <h2 className="text-3xl font-semibold tracking-[-0.015em] text-ink">
          What you get once you are inside
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-card border border-line bg-surface p-5 shadow-card"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-civic-ring bg-civic-tint text-civic-deep">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-ink">{title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Governance ------------------------------------------------ */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.015em] text-ink">
                Built to be answerable
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-muted">
                A model that shapes public spending has to survive scrutiny long after the decision.
                CivicOS keeps the paper trail as a product feature rather than an afterthought.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Lock,
                  title: 'Access',
                  body: 'Government email domains, MFA, SSO and a role matrix enforced server-side.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Approval',
                  body: 'High-impact runs finish awaiting approval, and export is blocked until an approver signs off.',
                },
                {
                  icon: ScrollText,
                  title: 'Audit',
                  body: 'Runs, approvals, exports and access changes are recorded with actor and timestamp.',
                },
                {
                  icon: FileText,
                  title: 'Evidence',
                  body: 'Each brief carries the datasets, model versions and assumptions that produced it.',
                },
              ].map(({ icon: Icon, title, body }) => (
                <li key={title} className="rounded-card border border-line bg-canvas p-5">
                  <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                    <Icon className="h-4 w-4 text-civic" aria-hidden="true" />
                    {title}
                  </span>
                  <p className="mt-2 text-[13px] leading-6 text-muted">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---- Close ------------------------------------------------------ */}
      <section className="bg-midnight">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.015em] text-white">
            Try the full workflow on a worked example
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-navy-soft">
            The demonstration signs in with any government email, an eight-character password and any
            six-digit code, then drops you into a London autonomous-mobility simulation with the
            catalogue already populated.
          </p>
          <div className="mt-8">
            <Button asChild variant="primary" size="lg">
              <Link href="/login" className="no-underline hover:no-underline">
                Sign in to CivicOS
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 border-t border-navy-line pt-6">
            <DemoNotice />
          </div>
        </div>
      </section>

      <footer className="bg-midnight">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-navy-line px-5 py-6 text-[11px] tracking-[0.02em] text-navy-muted sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <span>SECURITY CLASSIFICATION: OFFICIAL</span>
          <span>Demonstration data — all figures are illustrative</span>
        </div>
      </footer>
    </div>
  )
}
