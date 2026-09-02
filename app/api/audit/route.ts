import { NextResponse } from 'next/server'
import { repository } from '@/lib/services'

export async function GET(request: Request) {
  const limitParam = Number(new URL(request.url).searchParams.get('limit'))
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50
  const entries = await repository().listAudit(limit)
  return NextResponse.json({ entries })
}
