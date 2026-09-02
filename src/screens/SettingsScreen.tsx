import { useNavigate } from 'react-router-dom'
import { useSession } from '../app/session'
import { Button, Card, CardTitle, PageHeader } from '../components/ui'
import { organisation } from '../data/civic'

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { signOut } = useSession()

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle className="mb-3">Organisation</CardTitle>
          <div className="mb-2 text-[13px] text-ink-muted">{organisation.name}</div>
          <div className="text-[13px] text-ink-muted">{organisation.residency}</div>
        </Card>

        <Card className="p-5">
          <CardTitle className="mb-3">Security</CardTitle>
          <div className="mb-2 text-[13px] text-ink-muted">
            Multi-factor authentication: Enabled
          </div>
          <div className="mb-4 text-[13px] text-ink-muted">Session timeout: 30 minutes</div>
          <Button
            onClick={() => {
              signOut()
              navigate('/login')
            }}
          >
            Sign out
          </Button>
        </Card>
      </div>
    </>
  )
}
