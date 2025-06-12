'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Bell, Plus } from 'lucide-react'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import NotificationCenter from '@/components/notifications/NotificationCenter'
import GlobalSearch from '@/components/search/GlobalSearch'
import { ClientLayoutContent } from '@/components/client/ClientLayoutContent'
import { GlobalSidebar } from '@/components/layout/GlobalSidebar'

interface AppLayoutProps {
  children: React.ReactNode
  title?: string
  showQuickActions?: boolean
  customActions?: React.ReactNode
}

interface HeaderProps {
  userRole: 'admin' | 'client'
  showQuickActions?: boolean
  customActions?: React.ReactNode
}

function Header({ userRole, showQuickActions = true, customActions }: HeaderProps) {
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
        {/* Custom Actions */}
        {customActions}

        {/* Default Quick Actions - Admin Only */}
        {showQuickActions && userRole === 'admin' && !customActions && (
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

/**
 * Shared application layout component
 * Handles authentication, role-based layouts, and common UI elements
 */
export function AppLayout({
  children,
  title,
  showQuickActions = true,
  customActions
}: AppLayoutProps) {
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text={title ? `Loading ${title.toLowerCase()}...` : "Loading..."} />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to continue" />
  }

  // Determine user role
  const userRole = user.role === 'client' ? 'client' : 'admin'

  // Client layout
  if (userRole === 'client') {
    return (
      <ClientLayoutContent user={user}>
        {children}
      </ClientLayoutContent>
    )
  }

  // Admin layout
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <GlobalSidebar userRole={userRole} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userRole={userRole}
          showQuickActions={showQuickActions}
          customActions={customActions}
        />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

/**
 * Higher-order component for pages that need the app layout
 */
export function withAppLayout<P extends object>(
  Component: React.ComponentType<P>,
  layoutProps?: Omit<AppLayoutProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <AppLayout {...layoutProps}>
        <Component {...props} />
      </AppLayout>
    )
  }
}
