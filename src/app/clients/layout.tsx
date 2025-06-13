import { AppLayout } from '@/components/layout/AppLayout'
export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout title="Clients">
      {children}
    </AppLayout>
  )
}
