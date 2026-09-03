import type { Metadata } from 'next'
import { MobilityScreen } from '@/components/mobility/mobility-screen'

export const metadata: Metadata = { title: 'MobilitySim' }

export default function MobilityPage() {
  return <MobilityScreen />
}
