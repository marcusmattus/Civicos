import type { Metadata } from 'next'
import { CommandCentre } from '@/components/command-centre/command-centre'

export const metadata: Metadata = { title: 'Command Centre' }

export default function CommandCentrePage() {
  return <CommandCentre />
}
