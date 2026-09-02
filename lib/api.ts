import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

export type ApiError = {
  error: string
  code: string
  details?: unknown
}

export function jsonError(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json<ApiError>({ error: message, code, details }, { status })
}

export function notFound(what: string) {
  return jsonError('not_found', `${what} not found`, 404)
}

export function badRequest(error: ZodError) {
  return jsonError('invalid_request', 'Request body failed validation', 422, error.issues)
}

export function forbidden(message = 'Your role does not permit this action') {
  return jsonError('forbidden', message, 403)
}
