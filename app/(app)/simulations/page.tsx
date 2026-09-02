import type { Metadata } from 'next'
import { SimulationsScreen } from '@/components/simulations/simulations-screen'

export const metadata: Metadata = { title: 'Simulations' }

export default function SimulationsPage() {
  return <SimulationsScreen />
}
