/**
 * Modern Clean Sidebar - Option A Implementation
 * Clean & focused navigation with settings submenu
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Brain,
  Settings,
  LogOut,
  Plus,
  ChevronDown,
  ChevronRight,
  Sparkles
} from '@/lib/optimization/IconOptimizer'
import { useAuth } from '@/contexts/AuthProvider'
import { adminNavigation, settingsNavigation, quickActions, adminNavigationDividers } from '@/config/navigation'
import { cn } from '@/lib/utils'
import { FadeIn, SlideInLeft } from '@/components/ui/animated'

interface ModernSidebarProps {
  className?: string
  userRole?: 'admin' | 'client'
}

export function ModernSidebar({ className, userRole = 'admin' }: ModernSidebarProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  // User initials for avatar
  const userInitials = useMemo(() => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }, [user?.first_name, user?.last_name, user?.email])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const isActiveRoute = (href: string) => {
    if (pathname === href) return true
    if (href === '/dashboard' && pathname === '/') return true
    if (href !== '/' && pathname.startsWith(href)) return true
    return false
  }

  const isSettingsRoute = pathname.startsWith('/settings')

  return (
    <div className={cn('flex flex-col h-full bg-card border-r', className)}>
      {/* Logo */}
      <FadeIn>
        <div className="flex items-center space-x-3 p-6 border-b">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ZyxAI</h1>
            <p className="text-xs text-muted-foreground">AI Voice Platform</p>
          </div>
        </div>
      </FadeIn>

      {/* Quick Actions */}
      <div className="p-4 border-b">
        <FadeIn delay={0.1}>
          <Button className="w-full justify-start" size="sm" asChild>
            <Link href="/agents/new">
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Link>
          </Button>
        </FadeIn>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {adminNavigation.map((item, index) => {
          const isActive = isActiveRoute(item.href)
          const showDivider = adminNavigationDividers.includes(index)
          
          // Handle Settings specially
          if (item.name === 'Settings') {
            return (
              <div key={item.name}>
                {showDivider && (
                  <div className="my-3 border-t border-border"></div>
                )}
                <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={isSettingsRoute ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-between h-10 px-3',
                        isSettingsRoute && 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      <div className="flex items-center">
                        <item.icon className="w-4 h-4 mr-3" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      {settingsOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 mt-1">
                    {settingsNavigation.map((subItem) => {
                      const isSubActive = isActiveRoute(subItem.href)
                      return (
                        <SlideInLeft key={subItem.name} delay={0.05}>
                          <Link href={subItem.href}>
                            <Button
                              variant={isSubActive ? 'secondary' : 'ghost'}
                              className={cn(
                                'w-full justify-start h-9 px-6 text-sm',
                                isSubActive && 'bg-secondary text-secondary-foreground'
                              )}
                            >
                              <subItem.icon className="w-3 h-3 mr-3" />
                              {subItem.name}
                            </Button>
                          </Link>
                        </SlideInLeft>
                      )
                    })}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )
          }

          return (
            <div key={item.name}>
              {showDivider && (
                <div className="my-3 border-t border-border"></div>
              )}
              <SlideInLeft delay={index * 0.05}>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start h-10 px-3',
                      isActive && 'bg-secondary text-secondary-foreground'
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.badge}
                      </Badge>
                    )}
                    {item.isNew && (
                      <Badge variant="default" className="ml-auto text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        New
                      </Badge>
                    )}
                  </Button>
                </Link>
              </SlideInLeft>
            </div>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <FadeIn delay={0.3}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-12 px-3">
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium truncate">
                    {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user?.role || 'User'}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/account">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </FadeIn>
      </div>
    </div>
  )
}
