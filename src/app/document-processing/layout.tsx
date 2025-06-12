import { AppLayout } from '@/components/layout/AppLayout'

export default function DocumentProcessingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout title="Document Processing">
      {children}
    </AppLayout>
  )
}
