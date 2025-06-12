import { AppLayout } from '@/components/layout/AppLayout'

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout title="Tasks">
      {children}
    </AppLayout>
  )
}
