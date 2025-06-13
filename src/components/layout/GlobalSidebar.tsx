'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useFastNavigation } from '@/hooks/useFastNavigation'
import { useSignOut } from '@/hooks/useSignOut'
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
import { Brain, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { adminNavigation, clientNavigation, adminNavigationDividers, type NavigationItem } from '@/config/navigation'
import { useMemo, useCallback } from 'react'

interface GlobalSidebarProps {
  className?: string
  userRole?: 'admin' | 'client'
}



export function GlobalSidebar({ className, userRole = 'admin' }: GlobalSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { navigate, prefetchOnHover } = useFastNavigation()
  const { signOut } = useSignOut()

  // Memoize user data calculations to prevent unnecessary re-renders
  const userInitials = useMemo(() => {
    if (user?.full_name) {
      const names = user.full_name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`
      }
      return names[0][0] || 'U'
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase()
    }
    return 'U'
  }, [user?.full_name, user?.email])

  const userName = useMemo(() => {
    return user?.full_name || user?.email?.split('@')[0] || 'User'
  }, [user?.full_name, user?.email])

  const organizationName = useMemo(() => {
    return 'Tax Practice'
  }, [])

  const practiceRole = useMemo(() => {
    if (userRole === 'client') {
      return 'Client'
    }
    const role = user?.role
    if (role === 'admin') return 'Tax Professional'
    if (role === 'tax_professional') return 'Tax Professional'
    return role || 'Tax Professional'
  }, [userRole, user?.role])

  // Memoize navigation data
  const navigation = useMemo(() => {
    return userRole === 'client' ? clientNavigation : adminNavigation
  }, [userRole])

  const showDividers = useMemo(() => {
    return userRole === 'admin' ? adminNavigationDividers : []
  }, [userRole])

  const handleSignOut = useCallback(async () => {
    await signOut('/signin')
  }, [signOut])

  return (
    <div className={`flex flex-col h-full bg-card border-r ${className}`}>
      {/* Logo */}
      <div className="flex items-center space-x-2 p-6 border-b">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Neuronize</h1>
          {userRole === 'client' && (
            <p className="text-xs text-muted-foreground">Client Portal</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item: NavigationItem, index: number) => {
          const isActive = pathname === item.href ||
            (item.href === '/dashboard' && pathname === '/')

          // Add section dividers for better organization (admin only)
          const showDivider = showDividers.includes(index)

          return (
            <div key={item.name}>
              {showDivider && (
                <div className="my-4 border-t border-border"></div>
              )}
              <a
                href={item.href}
                onClick={(e) => {
                  e.preventDefault()
                  navigate(item.href)
                }}
                onMouseEnter={() => prefetchOnHover(item.href)}
                className={`group flex items-start space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
                title={item.description}
              >
                <item.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${
                    isActive ? 'text-primary-foreground' : 'text-foreground'
                  }`}>
                    {item.name}
                  </div>
                  <div className={`text-xs mt-0.5 truncate ${
                    isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </a>
            </div>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start space-x-3 p-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-muted-foreground">{practiceRole}</p>
                <p className="text-xs text-muted-foreground">{organizationName}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
