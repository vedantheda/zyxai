import {
  LayoutDashboard,
  Users,
  FileText,
  CheckSquare,
  MessageSquare,
  DollarSign,
  BarChart3,
  Settings,
  Calendar,
  Brain,
  Upload,
  Search,
  Bell,
  Archive,
  Target,
  TrendingUp,
  Building,
  CreditCard,
  Calculator,
  PieChart,
  FileSpreadsheet,
  Briefcase,
  UserCheck,
  Clock,
  AlertTriangle,
  Shield,
  Database,
  Zap,
  Phone,
  PhoneCall,
  GitBranch,
  Hash,
  Mic
} from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: any
  description: string
  badge?: string | number
  isNew?: boolean
  isComingSoon?: boolean
}

// Admin navigation for AI Voice Platform
export const adminNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  {
    name: 'AI Agents',
    href: '/dashboard/agents',
    icon: Brain,
    description: 'Manage AI voice agents'
  },
  {
    name: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Phone,
    description: 'Voice call campaigns'
  },
  {
    name: 'Contacts',
    href: '/dashboard/contacts',
    icon: Users,
    description: 'Contact management'
  },
  {
    name: 'Calls',
    href: '/dashboard/calls',
    icon: PhoneCall,
    description: 'Call history and logs'
  },
  {
    name: 'Analytics',
    href: '/dashboard/voice-analytics',
    icon: BarChart3,
    description: 'Voice analytics and reports'
  },
  {
    name: 'Integrations',
    href: '/dashboard/integrations',
    icon: Zap,
    description: 'CRM and third-party integrations'
  },
  {
    name: 'Workflows',
    href: '/dashboard/workflows',
    icon: GitBranch,
    description: 'Automation workflows'
  },
  {
    name: 'Phone Numbers',
    href: '/dashboard/phone-numbers',
    icon: Hash,
    description: 'Manage phone numbers'
  },
  {
    name: 'Team',
    href: '/dashboard/team',
    icon: UserCheck,
    description: 'Team management'
  },
  {
    name: 'Voice Config',
    href: '/dashboard/voice-config',
    icon: Mic,
    description: 'Voice configuration'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account settings'
  }
]

// Client navigation for tax clients
export const clientNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Your tax progress overview'
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FileText,
    description: 'Upload and manage documents'
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
    description: 'Your action items'
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    description: 'Chat with your tax professional'
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    description: 'View appointments and deadlines'
  },
  {
    name: 'Tax Summary',
    href: '/tax-summary',
    icon: Calculator,
    description: 'View your tax information'
  },
  {
    name: 'Payments',
    href: '/payments',
    icon: CreditCard,
    description: 'Billing and payments'
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: UserCheck,
    description: 'Manage your profile'
  }
]

// Divider positions for admin navigation (after which items to show dividers)
export const adminNavigationDividers: number[] = [5, 9] // After Messages (Core), after Calendar (Advanced)

// Extended admin navigation with more detailed sections
export const extendedAdminNavigation: NavigationItem[] = [
  // Core Operations
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and key metrics'
  },
  {
    name: 'Pipeline',
    href: '/pipeline',
    icon: Target,
    description: 'Client progress tracking'
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: Users,
    description: 'Manage client accounts'
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FileText,
    description: 'Document management'
  },
  {
    name: 'Document Processing',
    href: '/documents/processing',
    icon: FileText,
    description: 'AI-powered document processing',
    isNew: true
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
    description: 'Task management'
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    description: 'Client communications'
  },

  // Financial Management
  {
    name: 'Bookkeeping',
    href: '/bookkeeping',
    icon: DollarSign,
    description: 'Financial management'
  },
  {
    name: 'Transactions',
    href: '/bookkeeping/transactions',
    icon: CreditCard,
    description: 'Transaction management'
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    description: 'Financial reports'
  },

  // Advanced Features
  {
    name: 'AI Assistant',
    href: '/ai-assistant',
    icon: Brain,
    description: 'AI-powered assistance',
    isNew: true
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
    description: 'Schedule and appointments'
  },
  {
    name: 'Compliance',
    href: '/compliance',
    icon: Shield,
    description: 'Compliance monitoring'
  },

  // System
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'System configuration'
  }
]

// Quick action items for dashboard
export const quickActions: NavigationItem[] = [
  {
    name: 'Add Client',
    href: '/clients/new',
    icon: UserCheck,
    description: 'Create new client account'
  },
  {
    name: 'Upload Documents',
    href: '/documents/upload',
    icon: Upload,
    description: 'Upload client documents'
  },
  {
    name: 'Create Task',
    href: '/tasks/new',
    icon: CheckSquare,
    description: 'Add new task'
  },
  {
    name: 'Send Message',
    href: '/messages/new',
    icon: MessageSquare,
    description: 'Message a client'
  },
  {
    name: 'Schedule Appointment',
    href: '/calendar',
    icon: Calendar,
    description: 'Schedule client appointment'
  }
]

// Navigation sections for better organization
export const navigationSections = {
  core: {
    title: 'Core Operations',
    items: adminNavigation.slice(0, 6) // Dashboard through Messages
  },
  financial: {
    title: 'Financial Management',
    items: adminNavigation.slice(6, 8) // Bookkeeping and Reports
  },
  advanced: {
    title: 'Advanced Features',
    items: adminNavigation.slice(8, 11) // AI Assistant, Calendar, Compliance
  },
  system: {
    title: 'System',
    items: adminNavigation.slice(11) // Settings
  }
}

// Client-specific quick actions
export const clientQuickActions: NavigationItem[] = [
  {
    name: 'Upload Documents',
    href: '/documents/upload',
    icon: Upload,
    description: 'Upload tax documents'
  },
  {
    name: 'Message Professional',
    href: '/messages/new',
    icon: MessageSquare,
    description: 'Contact your tax professional'
  },
  {
    name: 'View Progress',
    href: '/dashboard',
    icon: TrendingUp,
    description: 'Check your tax progress'
  },
  {
    name: 'View Calendar',
    href: '/calendar',
    icon: Calendar,
    description: 'View appointments and deadlines'
  }
]

// Navigation utilities
export const getNavigationForRole = (role: 'admin' | 'client'): NavigationItem[] => {
  return role === 'client' ? clientNavigation : adminNavigation
}

export const getQuickActionsForRole = (role: 'admin' | 'client'): NavigationItem[] => {
  return role === 'client' ? clientQuickActions : quickActions
}

export const findNavigationItem = (href: string, role: 'admin' | 'client' = 'admin'): NavigationItem | undefined => {
  const navigation = getNavigationForRole(role)
  return navigation.find(item => item.href === href)
}

export const isActiveRoute = (currentPath: string, itemHref: string): boolean => {
  if (currentPath === itemHref) return true

  // Special case for signin as home page
  if (itemHref === '/signin' && currentPath === '/') return true

  // Check if current path starts with item href (for nested routes)
  if (itemHref !== '/' && currentPath.startsWith(itemHref)) return true

  return false
}
