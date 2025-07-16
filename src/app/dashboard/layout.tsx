import { DashboardNav } from '@/components/layout/DashboardNav'
import { DashboardAuthGuard } from '@/components/auth/AuthGuard'
import { ConnectionToast } from '@/components/ui/ConnectionStatus'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardAuthGuard>
      <div className="flex min-h-screen bg-background">
        <DashboardNav />
        <main className="flex-1">
          {children}
        </main>
        <ConnectionToast />
      </div>
    </DashboardAuthGuard>
  )
}
