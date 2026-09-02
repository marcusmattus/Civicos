import { Link } from 'react-router-dom'
import { PageHeader, StatusPill } from '../components/ui'
import { simulations } from '../data/civic'

export default function SimulationsScreen() {
  return (
    <>
      <PageHeader title="Simulations" />
      {simulations.map((sim) => (
        <Link
          key={sim.id}
          to="/results"
          className="mb-2.5 flex flex-col justify-between gap-3 rounded-lg border border-line bg-surface px-5 py-4 text-ink no-underline hover:border-brand-ring hover:no-underline sm:flex-row sm:items-center"
        >
          <div>
            <div className="mb-0.5 text-sm font-semibold">{sim.title}</div>
            <div className="text-[13px] text-ink-muted">
              {sim.scenario} · Owner: {sim.owner}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-xs text-ink-faint">{sim.updated}</div>
            <StatusPill>{sim.status}</StatusPill>
          </div>
        </Link>
      ))}
    </>
  )
}
