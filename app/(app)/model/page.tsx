import type { Metadata } from 'next'
import { ModelCanvas } from '@/components/canvas/model-canvas'

export const metadata: Metadata = { title: 'Model Canvas' }

export default function ModelPage() {
  return (
    <div className="h-[calc(100dvh-9rem)]">
      <ModelCanvas />
    </div>
  )
}
