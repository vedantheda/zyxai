import { AppLayout } from '@/components/layout/AppLayout'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout title="Onboarding">
      {children}
    </AppLayout>
  )
}
