import { AppLayout } from '@/components/layout/AppLayout'

export default function PipelineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout title="Pipeline">
      {children}
    </AppLayout>
  )
}
