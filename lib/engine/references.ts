/**
 * Structured `@kind/slug` references used in the prompt composer.
 *
 * A prompt stays plain text — references are parsed out of it, so the prompt
 * can be stored, diffed and audited without a rich-text format.
 */
import { referenceByKindSlug, references } from '../data/catalogue'
import { REFERENCE_KINDS } from '../types'
import type { ParsedReference, Reference, ReferenceKind } from '../types'

const REFERENCE_PATTERN = /@([a-z]+)\/([a-z0-9-]+)/g

export function parseReferences(text: string): ParsedReference[] {
  const found: ParsedReference[] = []
  for (const match of text.matchAll(REFERENCE_PATTERN)) {
    const [raw, kind, slug] = match
    if (!kind || !slug) continue
    if (!(REFERENCE_KINDS as readonly string[]).includes(kind)) continue
    found.push({
      kind: kind as ReferenceKind,
      slug,
      raw,
      start: match.index,
      end: match.index + raw.length,
    })
  }
  return found
}

/** Resolves parsed references against the catalogue, dropping unknown ones. */
export function resolveReferences(text: string): Reference[] {
  const seen = new Set<string>()
  const resolved: Reference[] = []
  for (const parsed of parseReferences(text)) {
    const key = `${parsed.kind}/${parsed.slug}`
    if (seen.has(key)) continue
    const reference = referenceByKindSlug.get(key)
    if (reference) {
      seen.add(key)
      resolved.push(reference)
    }
  }
  return resolved
}

/** References written in the prompt that don't exist in the catalogue. */
export function unknownReferences(text: string): string[] {
  return parseReferences(text)
    .filter((p) => !referenceByKindSlug.has(`${p.kind}/${p.slug}`))
    .map((p) => p.raw)
}

/**
 * Detects an in-progress `@…` token at the caret so the reference menu can be
 * opened and filtered as the user types.
 */
export function activeReferenceQuery(
  text: string,
  caret: number,
): { query: string; start: number } | null {
  const before = text.slice(0, caret)
  const at = before.lastIndexOf('@')
  if (at === -1) return null

  const token = before.slice(at + 1)
  // A space (outside the kind/slug form) ends the token.
  if (/\s/.test(token)) return null
  // Must be preceded by start-of-text or whitespace, not mid-word (e-mail).
  const preceding = at === 0 ? '' : before[at - 1]!
  if (preceding && !/\s/.test(preceding)) return null

  return { query: token, start: at }
}

export function searchReferences(query: string, limit = 8): Reference[] {
  const q = query.trim().toLowerCase()
  if (!q) return references.slice(0, limit)

  const [kindPart, slugPart] = q.includes('/') ? q.split('/', 2) : [q, undefined]

  const scored = references
    .map((reference) => {
      const kind = reference.kind
      const haystack = `${kind}/${reference.slug} ${reference.label}`.toLowerCase()

      let score = 0
      if (slugPart !== undefined) {
        // "industry/tra" — kind must match, then rank by slug prefix.
        if (!kind.startsWith(kindPart!)) return null
        if (!slugPart) score = 60
        else if (reference.slug.startsWith(slugPart)) score = 100
        else if (reference.slug.includes(slugPart)) score = 70
        else if (reference.label.toLowerCase().includes(slugPart)) score = 50
        else return null
      } else {
        if (kind.startsWith(q)) score = 90
        else if (reference.slug.startsWith(q)) score = 85
        else if (reference.label.toLowerCase().startsWith(q)) score = 80
        else if (haystack.includes(q)) score = 40
        else return null
      }

      return { reference, score }
    })
    .filter((entry): entry is { reference: Reference; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score || a.reference.label.localeCompare(b.reference.label))

  return scored.slice(0, limit).map((entry) => entry.reference)
}

export function referenceToken(reference: Reference): string {
  return `@${reference.kind}/${reference.slug}`
}

/**
 * Replaces the in-progress token at `start` with a complete reference and
 * returns the new text plus the caret position that should follow it.
 */
export function insertReference(
  text: string,
  start: number,
  caret: number,
  reference: Reference,
): { text: string; caret: number } {
  const token = `${referenceToken(reference)} `
  const next = text.slice(0, start) + token + text.slice(caret)
  return { text: next, caret: start + token.length }
}

/** Industries/instruments implied by the references written into a prompt. */
export function selectionsFromPrompt(text: string): {
  industrySlugs: string[]
  instrumentSlugs: string[]
  geographySlug?: string
} {
  const resolved = resolveReferences(text)
  return {
    industrySlugs: resolved.filter((r) => r.kind === 'industry').map((r) => r.slug),
    instrumentSlugs: resolved.filter((r) => r.kind === 'policy').map((r) => r.slug),
    geographySlug: resolved.find((r) => r.kind === 'geography')?.slug,
  }
}
