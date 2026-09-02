import type { Metadata } from 'next'
import { RunScreen } from '@/components/run/run-screen'

export const metadata: Metadata = { title: 'Simulation run' }

export default function RunPage() {
  return <RunScreen />
}
