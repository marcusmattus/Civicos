'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AuthError, useAuth } from '@/lib/auth/context'
import { allowedDomains } from '@/lib/auth/firebase'
import { loginSchema, mfaSchema } from '@/lib/schemas'
import type { LoginInput, MfaInput } from '@/lib/schemas'
import { Button } from '../ui/button'
import { ErrorState } from '../ui/feedback'
import { FieldError, Input, Label } from '../ui/input'
import { NetworkArt } from './network-art'

type Panel = 'credentials' | 'mfa' | 'forgot' | 'request-access'

function Brand({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-civic">
          <span className="h-2 w-2 rounded-full bg-white" />
        </span>
        <span className="text-lg font-semibold tracking-[-0.01em] text-white">CivicOS</span>
      </div>
    </div>
  )
}

function SecurityFooter() {
  return (
    <>
      <div className="mt-10 flex flex-wrap gap-5 border-t border-line-hair pt-6 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Encrypted
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Auditable
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true">◇</span> Human governed
        </span>
      </div>
      <p className="mt-4 text-[11px] tracking-[0.02em] text-faint">
        SECURITY CLASSIFICATION: OFFICIAL
      </p>
    </>
  )
}

function CredentialsPanel({
  onForgot,
  onRequestAccess,
}: {
  onForgot: () => void
  onRequestAccess: () => void
}) {
  const { signIn, signInWithSso, status, lastSignOutReason } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [ssoBusy, setSsoBusy] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const domains = allowedDomains()

  async function onSubmit(values: LoginInput) {
    setFormError(null)
    try {
      await signIn(values.email, values.password)
    } catch (error) {
      setFormError(error instanceof AuthError ? error.message : 'Sign-in failed. Try again.')
    }
  }

  if (status === 'locked') {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold sm:text-[28px]">Account locked</h1>
        <ErrorState
          title="Too many failed sign-in attempts"
          description="This account has been locked to protect it. Contact your organisation administrator to unlock it, or use Government SSO if your directory account is active."
        />
        <Button className="mt-5 w-full" onClick={() => window.location.reload()}>
          Back to sign in
        </Button>
        <SecurityFooter />
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl leading-9 font-semibold sm:text-[28px]">Welcome to CivicOS</h1>
      <p className="mb-6 text-muted">
        Sign in to your government or authorised research account.
      </p>

      {lastSignOutReason === 'timeout' ? (
        <div
          role="status"
          className="mb-5 rounded-lg border border-warning-line bg-warning-tint px-4 py-2.5 text-[13px] text-warning-ink"
        >
          You were signed out after 30 minutes of inactivity.
        </div>
      ) : null}

      {formError ? (
        <div className="mb-5">
          <ErrorState title="Could not sign you in" description={formError} />
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Label htmlFor="email" className="mb-1.5">
          Government email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="name@london.gov.uk"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'email-error' : 'email-hint'}
          {...register('email')}
        />
        {errors.email ? (
          <span id="email-error">
            <FieldError>{errors.email.message}</FieldError>
          </span>
        ) : (
          <p id="email-hint" className="mt-1.5 text-xs text-muted">
            {domains.length
              ? `Authorised domains: ${domains.join(', ')}`
              : 'Authorised public-sector and research access only.'}
          </p>
        )}

        <Label htmlFor="password" className="mt-5 mb-1.5">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            className="pr-11"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-canvas hover:text-ink"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <span id="password-error">
          <FieldError>{errors.password?.message}</FieldError>
        </span>

        <div className="mt-2 mb-6 text-right">
          <button type="button" onClick={onForgot} className="text-[13px] text-civic hover:underline">
            Forgot password?
          </button>
        </div>

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-line-hair" />
        or
        <span className="h-px flex-1 bg-line-hair" />
      </div>

      <Button
        size="lg"
        className="w-full font-semibold"
        disabled={ssoBusy}
        onClick={async () => {
          setFormError(null)
          setSsoBusy(true)
          try {
            await signInWithSso()
          } catch (error) {
            setFormError(
              error instanceof AuthError ? error.message : 'Government SSO is unavailable right now.',
            )
          } finally {
            setSsoBusy(false)
          }
        }}
      >
        {ssoBusy ? 'Contacting identity provider…' : 'Continue with Government SSO'}
      </Button>

      <p className="mt-5 text-center text-[13px] text-muted">
        Don&rsquo;t have access?{' '}
        <button type="button" onClick={onRequestAccess} className="text-civic hover:underline">
          Request access
        </button>
      </p>

      <SecurityFooter />
    </div>
  )
}

function MfaPanel() {
  const { verifyMfa, cancelMfa, pendingEmail } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MfaInput>({ resolver: zodResolver(mfaSchema), defaultValues: { code: '' } })

  async function onSubmit(values: MfaInput) {
    setFormError(null)
    try {
      await verifyMfa(values.code)
    } catch (error) {
      setFormError(error instanceof AuthError ? error.message : 'Verification failed.')
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl leading-9 font-semibold sm:text-[28px]">Two-factor verification</h1>
      <p className="mb-6 text-muted">
        Enter the 6-digit code from your authenticator app for{' '}
        <span className="font-medium text-ink">{pendingEmail}</span>.
      </p>

      {formError ? (
        <div className="mb-5">
          <ErrorState title="Verification failed" description={formError} />
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Label htmlFor="code" className="mb-1.5">
          Authentication code
        </Label>
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          autoFocus
          aria-invalid={Boolean(errors.code)}
          aria-describedby="code-hint"
          className="tabular text-center text-lg tracking-[0.4em]"
          {...register('code')}
        />
        <FieldError>{errors.code?.message}</FieldError>
        <p id="code-hint" className="mt-1.5 text-xs text-muted">
          Demonstration mode: any 6-digit code is accepted except 000000.
        </p>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="mt-6 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Verifying…' : 'Verify and sign in'}
        </Button>
      </form>

      <Button variant="ghost" className="mt-3 w-full" onClick={cancelMfa}>
        Use a different account
      </Button>

      <SecurityFooter />
    </div>
  )
}

function MessagePanel({
  title,
  body,
  onBack,
}: {
  title: string
  body: string
  onBack: () => void
}) {
  return (
    <div>
      <h1 className="mb-2 text-2xl leading-9 font-semibold sm:text-[28px]">{title}</h1>
      <p className="mb-6 text-muted">{body}</p>
      <Button className="w-full" onClick={onBack}>
        Back to sign in
      </Button>
      <SecurityFooter />
    </div>
  )
}

export function LoginScreen() {
  const router = useRouter()
  const { status } = useAuth()
  const [panel, setPanel] = useState<Panel>('credentials')

  useEffect(() => {
    if (status === 'signed_in') router.replace('/command-centre')
  }, [status, router])

  useEffect(() => {
    if (status === 'mfa_required') setPanel('mfa')
    if (status === 'signed_out' && panel === 'mfa') setPanel('credentials')
  }, [status, panel])

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <Brand className="bg-midnight px-6 py-5 lg:hidden" />

      <div className="hidden w-[44%] max-w-[640px] flex-col overflow-hidden bg-midnight p-10 lg:flex">
        <Brand />
        <NetworkArt />
        <div className="flex gap-6 text-[13px] text-navy-muted">
          <a href="#" className="text-navy-muted hover:text-white">
            Help
          </a>
          <a href="#" className="text-navy-muted hover:text-white">
            Status
          </a>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center bg-surface px-6 py-12 sm:px-12 lg:px-20">
        <div className="w-full max-w-[420px] lg:mx-auto">
          {panel === 'mfa' ? (
            <MfaPanel />
          ) : panel === 'forgot' ? (
            <MessagePanel
              title="Reset your password"
              body="If an account exists for that address, your organisation administrator will send reset instructions to your government inbox. Password resets are recorded in the audit log."
              onBack={() => setPanel('credentials')}
            />
          ) : panel === 'request-access' ? (
            <MessagePanel
              title="Request access"
              body="CivicOS access is granted by your organisation's administrator. Send your name, role and the simulations you need to work on, and the request will be reviewed against the role matrix in Governance."
              onBack={() => setPanel('credentials')}
            />
          ) : (
            <CredentialsPanel
              onForgot={() => setPanel('forgot')}
              onRequestAccess={() => setPanel('request-access')}
            />
          )}
        </div>
      </div>
    </div>
  )
}
