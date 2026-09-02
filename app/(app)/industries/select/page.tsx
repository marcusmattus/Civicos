import type { Metadata } from 'next'
import { SelectionScreen } from '@/components/selection/selection-screen'

export const metadata: Metadata = { title: 'Industries & instruments' }

export default function SelectionPage() {
  return <SelectionScreen />
}
