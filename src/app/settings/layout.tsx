import { AppLayout } from '@/components/layout/AppLayout'
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout title="Settings">
      {children}
    </AppLayout>
  )
}
