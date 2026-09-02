import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../app/session'

const edges: Array<[number, number, number, number]> = [
  [80, 120, 200, 220],
  [200, 220, 330, 180],
  [330, 180, 460, 260],
  [200, 220, 240, 340],
  [240, 340, 150, 420],
  [240, 340, 360, 400],
  [360, 400, 460, 260],
  [360, 400, 420, 500],
  [150, 420, 120, 540],
  [420, 500, 330, 560],
  [330, 560, 150, 420],
]

const nodes: Array<[number, number, number]> = [
  [80, 120, 4],
  [200, 220, 6],
  [330, 180, 4],
  [460, 260, 5],
  [240, 340, 7],
  [150, 420, 4],
  [360, 400, 5],
  [120, 540, 4],
  [420, 500, 4],
  [330, 560, 5],
]

/** Decorative system-graph artwork on the navy half of the sign-in screen. */
function NetworkArt() {
  return (
    <div className="relative mt-10 flex-1">
      <svg viewBox="0 0 560 640" className="absolute inset-0 h-full w-full opacity-90" aria-hidden="true">
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

      <div className="absolute top-[30px] right-10 flex h-9 w-9 items-center justify-center rounded-lg border border-brand/40 bg-brand/15">
        <div className="h-3.5 w-3.5 rounded-[3px] border-2 border-cyan" />
      </div>
      <div className="absolute bottom-[140px] left-[60px] flex h-9 w-9 items-center justify-center rounded-lg border border-brand/40 bg-brand/15">
        <div className="h-3.5 w-3.5 rounded-full border-2 border-positive" />
      </div>
      <div className="absolute right-20 bottom-[60px] flex h-9 w-9 items-center justify-center rounded-lg border border-brand/40 bg-brand/15">
        <div className="h-2.5 w-3.5 rounded-[2px] border-2 border-brand" />
      </div>
    </div>
  )
}

function Brand({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand">
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
        <div className="text-lg font-semibold tracking-[-0.01em] text-white">CivicOS</div>
      </div>
    </div>
  )
}

export default function LoginScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signedIn, signIn } = useSession()

  // Return the user to the screen they were trying to reach, if any.
  const destination = (location.state as { from?: string } | null)?.from ?? '/'

  function handleSignIn(event?: FormEvent) {
    event?.preventDefault()
    signIn()
    navigate(destination, { replace: true })
  }

  if (signedIn) return <Navigate to={destination} replace />

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* Compact navy band on small screens, full artwork panel from lg up */}
      <Brand className="bg-navy-900 px-6 py-5 lg:hidden" />

      <div className="hidden w-[44%] max-w-[640px] flex-col overflow-hidden bg-navy-900 p-10 lg:flex">
        <Brand />
        <NetworkArt />
        <div className="flex gap-6 text-[13px] text-navy-200">
          <a href="#" className="text-navy-200 hover:text-white">
            Help
          </a>
          <a href="#" className="text-navy-200 hover:text-white">
            Status
          </a>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center bg-surface px-6 py-12 sm:px-12 lg:px-20">
        <form onSubmit={handleSignIn} className="w-full max-w-[420px] lg:mx-auto">
          <h1 className="mb-2 text-2xl leading-9 font-semibold sm:text-[28px]">Welcome to CivicOS</h1>
          <p className="mb-8 text-ink-muted">
            Sign in to your government or authorised research account.
          </p>

          <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-ink">
            Government email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="name@government.gov.uk"
            className="mb-5 h-11 w-full rounded-md border border-line px-3.5 text-[15px] outline-none focus:border-brand"
          />

          <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-ink">
            Password
          </label>
          <div className="relative mb-2">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className="h-11 w-full rounded-md border border-line pr-10 pl-3.5 text-[15px] outline-none focus:border-brand"
            />
            <div className="pointer-events-none absolute top-[14px] right-3.5 h-4 w-4 rounded-full border-[1.5px] border-ink-muted" />
          </div>
          <div className="mb-6 text-right">
            <a href="#" className="text-[13px]">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="mb-4 h-11 w-full cursor-pointer rounded-md border-none bg-brand text-[15px] font-semibold text-white hover:bg-brand-deep"
          >
            Sign in
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-ink-faint">
            <div className="h-px flex-1 bg-line-hairline" />
            or
            <div className="h-px flex-1 bg-line-hairline" />
          </div>

          <button
            type="button"
            onClick={() => handleSignIn()}
            className="mb-5 h-11 w-full cursor-pointer rounded-md border border-line bg-surface text-sm font-semibold text-ink hover:bg-canvas"
          >
            Continue with Government SSO
          </button>

          <div className="text-center text-[13px] text-ink-muted">
            Don&rsquo;t have access? <a href="#">Request access</a>
          </div>

          <div className="mt-10 flex gap-5 border-t border-[#eef1f5] pt-6 text-xs text-ink-muted">
            <div>Encrypted</div>
            <div>Auditable</div>
            <div>Human governed</div>
          </div>
          <div className="mt-4 text-[11px] tracking-[0.02em] text-ink-faint">
            SECURITY CLASSIFICATION: OFFICIAL
          </div>
        </form>
      </div>
    </div>
  )
}
