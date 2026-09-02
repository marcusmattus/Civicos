import { NextResponse } from 'next/server'
import { badRequest, jsonError } from '@/lib/api'
import { loginSchema } from '@/lib/schemas'

/**
 * Demo-mode credential check.
 *
 * When Firebase Auth is configured the browser authenticates directly against
 * Firebase and this route is unused. It exists so the workflow is exercisable
 * without credentials, and so the login contract is documented.
 *
 * Rules: any password of 8+ characters is accepted; an address on an allowed
 * government domain (NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS) is required, and the
 * reserved address below demonstrates the locked-account state.
 */
const LOCKED_ACCOUNT = 'locked@gov.uk'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error)

  const email = parsed.data.email.toLowerCase()

  if (email === LOCKED_ACCOUNT) {
    return jsonError(
      'account_locked',
      'This account is locked after repeated failed sign-in attempts. Contact your organisation administrator.',
      423,
    )
  }

  const allowed = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)

  if (allowed.length > 0 && !allowed.some((domain) => email.endsWith(`@${domain}`) || email.endsWith(`.${domain}`))) {
    return jsonError(
      'domain_not_permitted',
      `Sign-in is restricted to authorised public-sector and research domains (${allowed.join(', ')}).`,
      403,
    )
  }

  return NextResponse.json({
    mfaRequired: true,
    user: {
      email,
      name: email.split('@')[0]!.replace(/[._]/g, ' '),
    },
  })
}
