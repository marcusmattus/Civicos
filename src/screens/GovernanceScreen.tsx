import { Card, CardTitle, PageHeader } from '../components/ui'
import { governanceRoles } from '../data/civic'

export default function GovernanceScreen() {
  return (
    <>
      <PageHeader
        title="Governance & permissions"
        subtitle="Roles, approval policies and data residency."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle className="mb-3">Roles</CardTitle>
          {governanceRoles.map((role) => (
            <div
              key={role.role}
              className="flex flex-col justify-between gap-0.5 border-b border-line-soft py-2 text-[13px] sm:flex-row sm:gap-4"
            >
              <div className="font-medium">{role.role}</div>
              <div className="text-ink-muted sm:text-right">{role.desc}</div>
            </div>
          ))}
        </Card>

        <Card className="p-5">
          <CardTitle className="mb-3">Approval policy</CardTitle>
          <div className="mb-2.5 text-[13px] text-ink">
            High-impact simulations and model publication require Approver sign-off before results
            can be exported or shared.
          </div>
          <div className="rounded-lg border border-warning-line bg-warning-tint p-3.5 text-[13px] text-warning-ink">
            2 simulations currently awaiting approval.
          </div>
        </Card>
      </div>
    </>
  )
}
