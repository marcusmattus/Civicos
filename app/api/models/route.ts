import { NextResponse } from 'next/server'
import { modelCards } from '@/lib/data/catalogue'

export async function GET() {
  return NextResponse.json({ models: modelCards })
}
