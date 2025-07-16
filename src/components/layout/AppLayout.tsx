'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Bell, Plus, Brain, Search } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthProvider'
import { SimpleLoading } from '@/components/ui/simple-loading'
import NotificationCenter from '@/components/notifications/NotificationCenter'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import GlobalSearch from '@/components/search/GlobalSearch'
import { MobileSearchTrigger } from '@/components/search/MobileSearch'
import { ClientLayoutContent } from '@/components/client/ClientLayoutContent'
import { GlobalSidebar } from '@/components/layout/GlobalSidebar'
import { VoiceWidget } from '@/components/voice/VoiceWidget'

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
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
        {/* Mobile menu button */}
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

        {/* Logo - visible on mobile when sidebar is hidden */}
        <div className="flex items-center space-x-3 md:hidden">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Neuronize</h1>
        </div>

        {/* Search - Enhanced for better UX */}
        <div className="hidden md:block flex-1 max-w-none">
          <GlobalSearch
            className="w-full"
            placeholder="Search clients, documents, tasks..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Mobile search button */}
        <MobileSearchTrigger>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="h-5 w-5" />
          </Button>
        </MobileSearchTrigger>

        {/* Custom Actions */}
        {customActions}

        {/* Default Quick Actions - Admin Only */}
        {showQuickActions && userRole === 'admin' && !customActions && (
          <Button
            size="sm"
            className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm transition-all duration-200 hover:shadow-md"
            asChild
          >
            <Link href="/dashboard/clients/new">
              <Plus className="w-4 h-4 mr-2" />
              Add New Client
            </Link>
          </Button>
        )}

        {/* Notifications */}
        <NotificationBell />
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
  const { user, loading } = useAuth()

  // Show loading during auth initialization
  if (loading) {
    return <SimpleLoading text={title ? `Loading ${title.toLowerCase()}...` : "Loading..."} />
  }

  // Handle unauthenticated state
  if (!user) {
    return <SimpleLoading text="Please log in to continue" />
  }

  // Determine user role
  const userRole = user?.role === 'client' ? 'client' : 'admin'

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

      {/* Floating Voice Widget */}
      <VoiceWidget
        assistantId="demo-assistant"
        variant="floating"
        onCallStart={() => console.log('Voice call started')}
        onCallEnd={() => console.log('Voice call ended')}
        onMessage={(message) => console.log('Voice message:', message)}
      />
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
