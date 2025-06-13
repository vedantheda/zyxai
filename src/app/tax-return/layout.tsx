import DashboardLayout from '@/app/dashboard/layout'
export default function TaxReturnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}
