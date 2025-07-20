'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import {
  Search,
  Settings,
  User,
  LogOut,
  HelpCircle,
  CreditCard,
  Building2,
  MessageSquare,
  Phone,
  Users,
  ChevronDown
} from 'lucide-react'

export function GlobalTopBar() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (!error) {
        router.push('/signin')
      } else {
        console.error('Sign out error:', error)
      }
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userEmail = user?.email || ''
  const organizationName = user?.user_metadata?.organization_name || 'Organization'

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Left side - Empty for now */}
        <div className="flex-1"></div>

        {/* Right side - Navigation and User Menu */}
        <div className="flex items-center space-x-2">
          {/* Main Navigation */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/conversations')}
            className="hover:bg-accent transition-all duration-200 cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/calls')}
            className="hover:bg-accent transition-all duration-200 cursor-pointer"
          >
            <Phone className="h-4 w-4 mr-2" />
            Calls
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/contacts')}
            className="hover:bg-accent transition-all duration-200 cursor-pointer"
          >
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 flex items-center space-x-2 px-3 rounded-full hover:bg-accent transition-all duration-200 cursor-pointer"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt={userName} />
                  <AvatarFallback className="text-xs font-medium">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-muted-foreground">{userEmail}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={userName} />
                      <AvatarFallback className="text-sm font-medium">
                        {getInitials(userName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground mt-1">{userEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 px-2 py-1 bg-muted/50 rounded-md">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">{organizationName}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Quick Stats */}
              <div className="p-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <div className="text-xl font-bold text-primary">12</div>
                    <div className="text-xs text-muted-foreground font-medium">Contacts</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <div className="text-xl font-bold text-primary">5</div>
                    <div className="text-xs text-muted-foreground font-medium">Deals</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <div className="text-xl font-bold text-primary">23</div>
                    <div className="text-xs text-muted-foreground font-medium">Calls</div>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => router.push('/dashboard/profile')}
                className="cursor-pointer"
              >
                <User className="mr-3 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/settings')}
                className="cursor-pointer"
              >
                <Settings className="mr-3 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/dashboard/settings/billing')}
                className="cursor-pointer"
              >
                <CreditCard className="mr-3 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open('/help', '_blank')}
                className="cursor-pointer"
              >
                <HelpCircle className="mr-3 h-4 w-4" />
                <span>Help & Support</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
