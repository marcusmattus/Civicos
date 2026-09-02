import type { Metadata } from 'next'
import { Check, Minus } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { ACTIONS, ACTION_LABELS, can } from '@/lib/auth/permissions'
import { organisations } from '@/lib/data/catalogue'
import { ROLES, ROLE_LABELS } from '@/lib/types'

export const metadata: Metadata = { title: 'Governance & permissions' }

export default function GovernancePage() {
  const organisation = organisations[0]!

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Governance & permissions"
        description="Roles, approval policy and data residency for your organisation."
      />

      <Card className="mb-4 overflow-hidden p-0">
        <div className="border-b border-line p-5">
          <CardTitle>Role matrix</CardTitle>
          <CardDescription className="mt-0.5">
            What each role may do. Permissions are enforced on every API route, not just in the UI.
          </CardDescription>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-[13px]">
            <caption className="sr-only">
              Permissions granted to each role across platform actions.
            </caption>
            <thead>
              <tr className="bg-canvas">
                <th scope="col" className="border-b border-line px-3 py-2.5 text-left text-xs font-medium text-muted">
                  Action
                </th>
                {ROLES.map((role) => (
                  <th
                    key={role}
                    scope="col"
                    className="border-b border-line px-3 py-2.5 text-center text-xs font-medium text-muted"
                  >
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACTIONS.map((action) => (
                <tr key={action}>
                  <th scope="row" className="border-b border-line-soft px-3 py-2.5 text-left font-medium">
                    {ACTION_LABELS[action]}
                  </th>
                  {ROLES.map((role) => {
                    const allowed = can(role, action)
                    return (
                      <td key={role} className="border-b border-line-soft px-3 py-2.5 text-center">
                        {allowed ? (
                          <>
                            <Check className="inline h-4 w-4 text-teal" aria-hidden="true" />
                            <span className="sr-only">Allowed</span>
                          </>
                        ) : (
                          <>
                            <Minus className="inline h-4 w-4 text-line-strong" aria-hidden="true" />
                            <span className="sr-only">Not allowed</span>
                          </>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle>Approval policy</CardTitle>
          <p className="mt-2 text-[13px] text-ink">
            High-impact simulations and model publication require Approver sign-off before results
            can be exported or shared. A simulation counts as high-impact when it commits more than
            £15bn of public investment or sets a monthly UBI of £800 or more.
          </p>
          <div className="mt-3 rounded-lg border border-warning-line bg-warning-tint p-3.5 text-[13px] text-warning-ink">
            2 simulations currently awaiting approval.
          </div>
        </Card>

        <Card className="p-5">
          <CardTitle>Data residency and classification</CardTitle>
          <dl className="mt-2 space-y-2 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Organisation</dt>
              <dd className="text-ink">{organisation.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Clearance</dt>
              <dd className="text-ink">{organisation.clearance}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Residency</dt>
              <dd className="text-ink">{organisation.residency}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted">
            Observed and synthetic data are never combined into a single reported figure. Any metric
            with a scenario assumption in its lineage is labelled SCENARIO_ASSUMPTION.
          </p>
        </Card>
      </div>
    </div>
  )
}
