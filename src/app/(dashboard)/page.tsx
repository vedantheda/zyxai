import { Metadata } from 'next'
import DashboardClient from './dashboard-client'

export const metadata: Metadata = {
  title: 'Dashboard - ZyxAI',
  description: 'Voice Agent CRM Dashboard'
}

export default function DashboardPage() {
  return <DashboardClient />
}
