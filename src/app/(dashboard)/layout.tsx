import { DashboardNav } from '@/components/layout/DashboardNav'
import { GlobalTopBar } from '@/components/layout/GlobalTopBar'
import { DashboardAuthGuard } from '@/components/auth/AuthGuard'
import { ConnectionToast } from '@/components/ui/ConnectionStatus'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardAuthGuard>
      <div className="min-h-screen bg-background">
        <GlobalTopBar />
        <div className="flex">
          <DashboardNav />
          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </div>
        <ConnectionToast />
      </div>
    </DashboardAuthGuard>
  )
}
