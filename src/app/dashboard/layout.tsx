import { DashboardNav } from '@/components/layout/DashboardNav'




export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
