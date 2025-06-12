'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useMessages } from '@/hooks/useMessages'
import { GlobalSidebar } from '@/components/layout/GlobalSidebar'
import {
  LogOut,
  Bell,
  Menu,
  X,
  Phone,
  Mail,
  Calendar
} from 'lucide-react'



interface ClientLayoutContentProps {
  children: React.ReactNode
  user: any
}

export function ClientLayoutContent({ children, user }: ClientLayoutContentProps) {
  const { signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Get real unread message count
  const { stats } = useMessages({ autoRefresh: true, refreshInterval: 60000 })
  const unreadMessages = stats?.unreadMessages || 0

  const handleSignOut = async () => {
    console.log('🔐 Client: Starting sign out')
    setIsSigningOut(true)
    try {
      const { error } = await signOut()
      if (error) {
        console.error('🔐 Client: Sign out error:', error)
        // Could add toast notification here if needed
      } else {
        console.log('🔐 Client: Sign out successful')
        // AuthContext will handle the redirect
      }
    } catch (error) {
      console.error('🔐 Client: Sign out exception:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <GlobalSidebar userRole="client" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground">Neuronize</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
