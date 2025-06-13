'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthProvider'
import { useMessages } from '@/hooks/useMessages'
import { GlobalSidebar } from '@/components/layout/GlobalSidebar'
import {
  LogOut,
  Bell,
  Menu,
  X,
  Phone,
  Mail,
  Calendar,
  Brain
} from 'lucide-react'



interface ClientLayoutContentProps {
  children: React.ReactNode
  user: any
}

export function ClientLayoutContent({ children, user }: ClientLayoutContentProps) {
  const { user: authUser } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Get real unread message count
  const { stats } = useMessages({ autoRefresh: true, refreshInterval: 60000 })
  const unreadMessages = stats?.unreadMessages || 0

  const handleSignOut = async () => {
    console.log('🔐 Client: Starting sign out')
    setIsSigningOut(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('🔐 Client: Sign out error:', error)
      } else {
        console.log('🔐 Client: Sign out successful')
        window.location.href = '/signin'
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
        <div className="lg:hidden bg-background/95 backdrop-blur border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Neuronize</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
              <Bell className="w-4 h-4" />
              {unreadMessages > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </Badge>
              )}
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
