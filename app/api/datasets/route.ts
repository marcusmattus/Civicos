import { NextResponse } from 'next/server'
import { jsonError } from '@/lib/api'
import { datasets } from '@/lib/data/catalogue'

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.toLowerCase().trim()
  const filtered = query
    ? datasets.filter((d) =>
        `${d.name} ${d.source} ${d.department} ${d.classification}`.toLowerCase().includes(query),
      )
    : datasets
  return NextResponse.json({ datasets: filtered })
}

/**
 * Dataset registration is a Data steward action against the governed
 * catalogue; it is not available while the catalogue is served from static
 * demonstration data.
 */
export async function POST() {
  return jsonError(
    'not_implemented',
    'Dataset registration requires the governed catalogue service. Set CIVICOS_PERSISTENCE=firestore and connect the catalogue backend.',
    501,
  )
}
