import { describe, expect, it } from 'vitest'
import {
  activeReferenceQuery,
  insertReference,
  parseReferences,
  resolveReferences,
  searchReferences,
  selectionsFromPrompt,
  unknownReferences,
} from '@/lib/engine/references'
import { referenceByKindSlug } from '@/lib/data/catalogue'

describe('parseReferences', () => {
  it('finds every structured reference with its offsets', () => {
    const text = 'Model @industry/transport and @policy/ubi in @geography/greater-london.'
    const parsed = parseReferences(text)

    expect(parsed.map((p) => `${p.kind}/${p.slug}`)).toEqual([
      'industry/transport',
      'policy/ubi',
      'geography/greater-london',
    ])
    expect(text.slice(parsed[0]!.start, parsed[0]!.end)).toBe('@industry/transport')
  })

  it('ignores tokens whose kind is not a reference kind', () => {
    expect(parseReferences('email @someone/else and @nonsense/thing')).toEqual([])
  })
})

describe('resolveReferences', () => {
  it('resolves known references and de-duplicates repeats', () => {
    const resolved = resolveReferences('@industry/transport @industry/transport @policy/licensing')
    expect(resolved).toHaveLength(2)
    expect(resolved[0]!.label).toBe('Transport')
  })

  it('drops references that are not in the catalogue', () => {
    expect(resolveReferences('@industry/teleportation')).toEqual([])
    expect(unknownReferences('@industry/teleportation')).toEqual(['@industry/teleportation'])
  })
})

describe('activeReferenceQuery', () => {
  it('detects an in-progress token at the caret', () => {
    const text = 'Model @indu'
    expect(activeReferenceQuery(text, text.length)).toEqual({ query: 'indu', start: 6 })
  })

  it('keeps matching once a slash is typed', () => {
    const text = 'Model @industry/tra'
    expect(activeReferenceQuery(text, text.length)?.query).toBe('industry/tra')
  })

  it('does not fire mid-word, so email addresses are left alone', () => {
    const text = 'name@london.gov.uk'
    expect(activeReferenceQuery(text, text.length)).toBeNull()
  })

  it('closes the menu once the token is followed by a space', () => {
    const text = 'Model @industry/transport and'
    expect(activeReferenceQuery(text, text.length)).toBeNull()
  })
})

describe('searchReferences', () => {
  it('ranks slug prefix matches above substring matches', () => {
    const results = searchReferences('industry/tra')
    expect(results[0]!.slug).toBe('transport')
  })

  it('returns nothing for a kind that does not exist', () => {
    expect(searchReferences('nonsense/thing')).toEqual([])
  })
})

describe('insertReference', () => {
  it('replaces the in-progress token and reports the new caret', () => {
    const reference = referenceByKindSlug.get('industry/transport')!
    const text = 'Model @indu'
    const result = insertReference(text, 6, text.length, reference)

    expect(result.text).toBe('Model @industry/transport ')
    expect(result.caret).toBe(result.text.length)
  })
})

describe('selectionsFromPrompt', () => {
  it('extracts industries, instruments and geography from a prompt', () => {
    const selection = selectionsFromPrompt(
      'Assess @policy/ubi across @industry/employment and @industry/healthcare in @geography/greater-london',
    )

    expect(selection.industrySlugs).toEqual(['employment', 'healthcare'])
    expect(selection.instrumentSlugs).toEqual(['ubi'])
    expect(selection.geographySlug).toBe('greater-london')
  })
})
