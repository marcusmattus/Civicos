import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { agentDefs } from '@/lib/data/catalogue'

export const metadata: Metadata = { title: 'Agents' }

export default function AgentsPage() {
  const total = agentDefs.reduce((sum, agent) => sum + agent.weight, 0)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Agents"
        description="Specialised agents that orchestrate a simulation run. Each reports operational activity and evidence references only — never model reasoning."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agentDefs.map((agent) => (
          <Card key={agent.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold">{agent.name}</h2>
              <Badge tone="muted">{Math.round((agent.weight / total) * 100)}% of run</Badge>
            </div>
            <p className="mt-1.5 text-[13px] text-muted">{agent.description}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
