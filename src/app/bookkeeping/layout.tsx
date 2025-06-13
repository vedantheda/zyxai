import { AppLayout } from '@/components/layout/AppLayout'
export default function BookkeepingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout title="Bookkeeping">
      {children}
    </AppLayout>
  )
}
