import type { Metadata } from 'next'
import { Landing } from '@/components/marketing/landing'

export const metadata: Metadata = {
  title: 'CivicOS — model the consequences before the decision',
  description:
    'Government decision-intelligence platform for modelling public spending, regulation, industries and infrastructure before decisions are taken.',
}

export default function LandingPage() {
  return <Landing />
}
