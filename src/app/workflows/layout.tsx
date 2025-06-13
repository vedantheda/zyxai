import { AppLayout } from '@/components/layout/AppLayout'
export default function WorkflowsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout title="Workflows">
      {children}
    </AppLayout>
  )
}
