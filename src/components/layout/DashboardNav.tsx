'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Bot,
  Users,
  Phone,
  PhoneCall,
  BarChart3,
  Settings,
  Building2,
  Megaphone,
  TrendingUp,
  Zap,
  Cog,
  Palette,
  TestTube,
  CreditCard,
  Bell,
  LogOut,
  UserCheck
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Onboarding', href: '/onboarding', icon: TestTube },
  { name: 'Teams', href: '/dashboard/team', icon: UserCheck },
  { name: 'Templates', href: '/dashboard/templates', icon: Zap },
  { name: 'AI Agents', href: '/dashboard/agents', icon: Bot },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { name: 'Voice Calls', href: '/dashboard/calls', icon: PhoneCall },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  { name: 'Workflows', href: '/dashboard/workflows/builder', icon: Settings },
  { name: 'Phone Numbers', href: '/dashboard/phone-numbers', icon: Phone },
  { name: 'White Label', href: '/dashboard/white-label', icon: Palette },
  { name: 'Voice Config', href: '/dashboard/voice-config', icon: Cog },
  { name: 'Voice Advanced', href: '/dashboard/vapi-advanced', icon: Zap },
  { name: 'Voice Status', href: '/dashboard/voice-status', icon: TrendingUp },
  { name: 'Voice Demo Call', href: '/demo/vapi-call', icon: TestTube },
  { name: 'Optimization', href: '/dashboard/optimization', icon: BarChart3 },
  { name: 'Integrations', href: '/dashboard/integrations', icon: Building2 },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Voice Analytics', href: '/dashboard/voice-analytics', icon: BarChart3 },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, user } = useAuth()

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (!error) {
      router.push('/signin')
    }
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
          {navigation.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
            return (
              <Link
                key={item.name}
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
            )
          })}
        </div>
      </div>

      {/* User Info & Sign Out */}
      <div className="p-6 border-t border-border space-y-4">
        {/* User Info */}
        {user && (
          <div className="flex items-center space-x-3 p-3 bg-accent/50 rounded-lg">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Sign Out Button */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>

        {/* Footer */}
        <div className="text-xs text-muted-foreground text-center">
          <p>ZyxAI v1.0</p>
          <p className="mt-1">AI Voice Automation</p>
        </div>
      </div>
    </nav>
  )
}
