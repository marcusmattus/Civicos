import { Card, PageHeader, TableScroll, cx } from '../components/ui'
import { auditRows } from '../data/civic'
import type { AuditRow } from '../data/civic'

const COLUMNS = 'grid-cols-[1.2fr_1fr_1.4fr_1.6fr_1fr_1fr]'

/**
 * The prototype bound the approval cell's colour to the status text itself
 * (`color: Approved`), which no browser resolves — approvals are mapped to real
 * tokens here.
 */
function approvalClass(status: AuditRow['status']) {
  return status === 'Approved' ? 'text-positive' : 'text-warning'
}

export default function AuditScreen() {
  return (
    <>
      <PageHeader title="Audit Centre" subtitle="Immutable record of user actions across the platform." />

      <Card className="hidden overflow-hidden md:block">
        <TableScroll>
          <div
            className={cx(
              'grid border-b border-line bg-canvas px-5 py-3 text-xs text-ink-muted',
              COLUMNS,
            )}
          >
            <div>User</div>
            <div>Organisation</div>
            <div>Action</div>
            <div>Subject</div>
            <div>When</div>
            <div>Approval</div>
          </div>
          {auditRows.map((row, i) => (
            <div
              key={`${row.user}-${row.subject}-${i}`}
              className={cx(
                'grid items-center border-b border-line-soft px-5 py-3 text-[13px] last:border-b-0',
                COLUMNS,
              )}
            >
              <div className="font-medium">{row.user}</div>
              <div className="text-ink-muted">{row.org}</div>
              <div className="text-ink-muted">{row.action}</div>
              <div className="text-ink-muted">{row.subject}</div>
              <div className="text-ink-faint">{row.when}</div>
              <div className={cx('font-medium', approvalClass(row.status))}>{row.status}</div>
            </div>
          ))}
        </TableScroll>
      </Card>

      <div className="md:hidden">
        {auditRows.map((row, i) => (
          <Card key={`${row.user}-${row.subject}-${i}`} className="mb-2.5 p-4">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="text-sm font-semibold">{row.action}</div>
              <div className={cx('shrink-0 text-xs font-medium', approvalClass(row.status))}>
                {row.status}
              </div>
            </div>
            <div className="mb-1 text-[13px] text-ink-muted">{row.subject}</div>
            <div className="text-xs text-ink-faint">
              {row.user} · {row.org} · {row.when}
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
