'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Settings,
  Building2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

// Import navigation from config
import { adminNavigation, settingsNavigation, adminNavigationDividers } from '@/config/navigation'
import { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'


const navigation = adminNavigation

export function DashboardNav() {
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="bg-card border-r border-border w-64 min-h-screen flex flex-col">
      <div className="p-6 flex-1">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 mb-8 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:bg-primary/90 transition-colors">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">ZyxAI</span>
        </Link>

        {/* Navigation Links */}
        <div className="space-y-1">
          {navigation.map((item, index) => {
            const isActive = isActiveRoute(item.href)
            const showDivider = adminNavigationDividers.includes(index)

            return (
              <div key={item.name}>
                {showDivider && (
                  <div className="my-3 border-t border-border"></div>
                )}
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-primary/10 text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className={cn(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )} />
                  <span>{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </Link>
              </div>
            )
          })}

          {/* Settings Collapsible */}
          <div className="my-3 border-t border-border"></div>
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start px-3 py-2.5 h-auto text-sm font-medium transition-all duration-200',
                  settingsOpen || settingsNavigation.some(item => isActiveRoute(item.href))
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Settings className="w-5 h-5 mr-3" />
                <span>Settings</span>
                {settingsOpen ? (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {settingsNavigation.map((subItem) => {
                const isSubActive = isActiveRoute(subItem.href)
                return (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    className={cn(
                      'flex items-center space-x-3 px-6 py-2 rounded-lg text-sm transition-all duration-200 group',
                      isSubActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <subItem.icon className={cn(
                      'w-4 h-4 transition-colors',
                      isSubActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                    )} />
                    <span>{subItem.name}</span>
                    {isSubActive && (
                      <div className="ml-auto w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </Link>
                )
              })}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          <p>ZyxAI v1.0</p>
          <p className="mt-1">AI Voice Automation</p>
        </div>
      </div>
    </nav>
  )
}
