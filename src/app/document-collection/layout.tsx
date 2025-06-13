import DashboardLayout from '@/app/dashboard/layout'
export default function DocumentCollectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
