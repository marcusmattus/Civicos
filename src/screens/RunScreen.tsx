import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRun } from '../app/run'
import type { AgentStatus } from '../app/run'
import { Button, Card, CardTitle } from '../components/ui'
import { dataSources, runEvents, simulationId } from '../data/civic'

const statusStyles: Record<AgentStatus, { text: string; dot: string }> = {
  Complete: { text: 'text-positive', dot: 'bg-positive' },
  Running: { text: 'text-brand', dot: 'bg-brand' },
  Queued: { text: 'text-ink-faint', dot: 'bg-line-strong' },
}

export default function RunScreen() {
  const navigate = useNavigate()
  const { progress, complete, started, etaMinutes, agents, start } = useRun()

  // Entering the run screen directly (deep link, refresh) kicks off the run so
  // it never sits at 0% waiting for a click that already happened elsewhere.
  useEffect(() => {
    if (!started) start()
  }, [started, start])

  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-baseline">
        <div>
          <h1 className="mb-1 text-2xl font-semibold sm:text-[28px] sm:leading-9">
            Simulation in progress
          </h1>
          <p className="text-ink-muted">Agents are running the model and generating insights.</p>
        </div>
        <div className="text-[13px] text-ink-faint sm:text-right">
          <div>Simulation ID: {simulationId}</div>
          <Link to="/model" className="text-[13px]">
            View details
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
        <Card className="flex flex-col items-center justify-center p-5">
          <div className="mb-3 text-[13px] text-ink-muted">Progress</div>
          <div
            role="progressbar"
            aria-label="Simulation progress"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="flex h-[110px] w-[110px] items-center justify-center rounded-full"
            style={{ background: `conic-gradient(var(--color-cyan) ${progress}%, #eef0f4 0)` }}
          >
            <div className="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full bg-surface">
              <div className="tabular text-xl font-bold">{progress}%</div>
              <div className="text-[10px] text-ink-faint">Complete</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-ink-faint">Est. {etaMinutes} min remaining</div>
        </Card>

        <Card className="p-5">
          <CardTitle className="mb-3">Agent orchestration</CardTitle>
          {agents.map((agent) => {
            const style = statusStyles[agent.status]
            return (
              <div
                key={agent.name}
                className="flex items-center gap-2.5 border-b border-line-softer py-[7px] text-[13px]"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                <div className="min-w-0 flex-1 truncate">{agent.name}</div>
                <div className={`w-[110px] shrink-0 text-xs font-medium ${style.text}`}>
                  {agent.status}
                </div>
                <div className="tabular w-11 shrink-0 text-right text-ink-faint">{agent.pct}%</div>
              </div>
            )
          })}
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle className="mb-3">Live event stream</CardTitle>
          {runEvents.map((event) => (
            <div key={event.time} className="flex gap-2.5 py-[5px] text-xs">
              <div className="tabular shrink-0 text-ink-faint">{event.time}</div>
              <div className="text-ink">{event.text}</div>
            </div>
          ))}
          <Link to="/audit" className="text-[13px]">
            View all events →
          </Link>
        </Card>

        <Card className="p-5">
          <CardTitle className="mb-3">Official data sources</CardTitle>
          {dataSources.map((source) => (
            <div
              key={source.name}
              className="flex justify-between gap-3 border-b border-line-softer py-[7px] text-[13px]"
            >
              <div className="min-w-0 truncate">{source.name}</div>
              <div className="shrink-0 text-xs text-ink-faint">{source.count}</div>
            </div>
          ))}
          <Link to="/datasets" className="text-[13px]">
            View all sources →
          </Link>
        </Card>
      </div>

      <Card className="p-5 text-center">
        <CardTitle className="mb-1">Evidence</CardTitle>
        <div className="mb-3.5 text-xs text-ink-muted">
          Evidence and intermediate outputs are attached for audit.
        </div>
        {complete ? (
          <Button variant="primary" onClick={() => navigate('/results')}>
            View results →
          </Button>
        ) : (
          <Button>Open evidence drawer</Button>
        )}
      </Card>
    </>
  )
}
