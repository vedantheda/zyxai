import { AppLayout } from '@/components/layout/AppLayout'

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout title="Reports">
      {children}
    </AppLayout>
  )
}
