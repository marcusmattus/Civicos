import type { Metadata } from 'next'
import { ScenariosScreen } from '@/components/scenarios/scenarios-screen'

export const metadata: Metadata = { title: 'Scenarios' }

export default function ScenariosPage() {
  return <ScenariosScreen />
}
