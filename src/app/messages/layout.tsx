import { AppLayout } from '@/components/layout/AppLayout'

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout title="Messages">
      {children}
    </AppLayout>
  )
}
