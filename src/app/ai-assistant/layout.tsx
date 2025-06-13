import { AppLayout } from '@/components/layout/AppLayout'
export default function AIAssistantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout title="AI Assistant">
      {children}
    </AppLayout>
  )
}
