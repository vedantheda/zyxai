import { AppLayout } from '@/components/layout/AppLayout'
export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout title="Documents">
      {children}
    </AppLayout>
  )
}
