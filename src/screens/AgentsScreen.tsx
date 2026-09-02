import { Card, PageHeader } from '../components/ui'
import { agentCatalog } from '../data/civic'

export default function AgentsScreen() {
  return (
    <>
      <PageHeader
        title="Agents"
        subtitle="Specialised agents available to orchestrate a simulation run."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agentCatalog.map((agent) => (
          <Card key={agent.name} className="p-4.5">
            <div className="mb-2 flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-positive" />
              <div className="text-sm font-semibold">{agent.name}</div>
            </div>
            <div className="text-[13px] text-ink-muted">{agent.desc}</div>
          </Card>
        ))}
      </div>
    </>
  )
}
