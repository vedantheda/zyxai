'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Bell, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import NotificationCenter from '@/components/notifications/NotificationCenter'
import GlobalSearch from '@/components/search/GlobalSearch'
import { ClientLayoutContent } from '@/components/client/ClientLayoutContent'
import { GlobalSidebar } from '@/components/layout/GlobalSidebar'




function Header({ userRole }: { userRole?: 'admin' | 'client' }) {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center space-x-4">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <GlobalSidebar userRole={userRole} />
          </SheetContent>
        </Sheet>

        {/* Search */}
        <div className="hidden md:block">
          <GlobalSearch className="w-64" />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Quick Actions - Admin Only */}
        {userRole === 'admin' && (
          <Button size="sm" className="hidden md:flex">
            <Plus className="w-4 h-4 mr-2" />
            Add New Client
          </Button>
        )}

        {/* Notifications */}
        <NotificationCenter showAsDropdown={true} />
      </div>
    </header>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text="Loading dashboard..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view dashboard" />
  }

  // Determine user role
  const userRole = user.role === 'client' ? 'client' : 'admin'

  // If user is a client, use client layout
  if (user.role === 'client') {
    return (
      <ClientLayoutContent user={user}>
        {children}
      </ClientLayoutContent>
    )
  }

  // Admin layout for non-client users
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <GlobalSidebar userRole={userRole} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header userRole={userRole} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
