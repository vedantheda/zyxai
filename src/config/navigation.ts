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
  Mic,
  Sparkles,
  Activity,
  Code,
  Layout,
  Workflow,
  Rocket
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

// Main Sidebar Navigation - Core Features Only
export const adminNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and key metrics'
  },
  {
    name: 'Onboarding',
    href: '/onboarding',
    icon: Rocket,
    description: 'Get started with ZyxAI',
    isNew: true
  },
  {
    name: 'AI Agents',
    href: '/agents',
    icon: Brain,
    description: 'Manage AI voice agents'
  },
  {
    name: 'Contacts',
    href: '/contacts',
    icon: Users,
    description: 'Contact management'
  },
  {
    name: 'Campaigns',
    href: '/campaigns',
    icon: Phone,
    description: 'Voice call campaigns'
  },
  {
    name: 'Opportunities',
    href: '/opportunities',
    icon: DollarSign,
    description: 'Sales pipeline & opportunities'
  },
  {
    name: 'Calls',
    href: '/calls',
    icon: PhoneCall,
    description: 'Call history and monitoring'
  },
  {
    name: 'Team',
    href: '/team',
    icon: UserCheck,
    description: 'Team member management'
  },
  {
    name: 'Conversations',
    href: '/conversations',
    icon: MessageSquare,
    description: 'All lead communications (Email, SMS, Voice)'
  }
]

// Settings submenu items - Advanced Features and Configuration
export const settingsNavigation: NavigationItem[] = [
  {
    name: 'General',
    href: '/settings',
    icon: Settings,
    description: 'General settings and preferences'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Business analytics and reporting'
  },
  {
    name: 'Integrations',
    href: '/integrations',
    icon: Zap,
    description: 'CRM and third-party integrations'
  },
  {
    name: 'Billing',
    href: '/billing',
    icon: CreditCard,
    description: 'Subscription and payment management'
  },
  {
    name: 'Phone Numbers',
    href: '/phone-numbers',
    icon: Phone,
    description: 'Phone number management'
  },
  {
    name: 'Voice Analytics',
    href: '/dashboard/voice-analytics',
    icon: TrendingUp,
    description: 'Voice call analytics and metrics'
  },
  {
    name: 'Voice Config',
    href: '/dashboard/voice-config',
    icon: Mic,
    description: 'Voice configuration and presets'
  },
  {
    name: 'Voice Status',
    href: '/dashboard/voice-status',
    icon: Activity,
    description: 'Voice system status monitoring'
  },
  {
    name: 'Workflows',
    href: '/dashboard/workflows',
    icon: GitBranch,
    description: 'Workflow automation builder'
  },
  {
    name: 'VAPI Advanced',
    href: '/dashboard/vapi-advanced',
    icon: Code,
    description: 'Complete VAPI configuration'
  },
  {
    name: 'AI Analysis',
    href: '/dashboard/ai-analysis',
    icon: FileText,
    description: 'AI document analysis and processing'
  },
  {
    name: 'Industry Solutions',
    href: '/dashboard/industry-solutions',
    icon: Building,
    description: 'Industry solution dashboard'
  },
  {
    name: 'Templates',
    href: '/dashboard/templates',
    icon: Layout,
    description: 'Industry-specific agent templates'
  },
  {
    name: 'Workflows (Standalone)',
    href: '/workflows',
    icon: Workflow,
    description: 'Standalone workflow management'
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

// Divider positions for clean navigation (after which items to show dividers)
export const adminNavigationDividers: number[] = [6, 7] // After Calls (Core Operations), after Team (Team Management)

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

// Quick action items for AI Voice Platform
export const quickActions: NavigationItem[] = [
  {
    name: 'Create Agent',
    href: '/agents/new',
    icon: Brain,
    description: 'Create new AI voice agent'
  },
  {
    name: 'Start Campaign',
    href: '/campaigns/new',
    icon: Phone,
    description: 'Launch new voice campaign'
  },
  {
    name: 'Add Contacts',
    href: '/contacts/import',
    icon: Upload,
    description: 'Import or add contacts'
  },
  {
    name: 'Demo Call',
    href: '/calls/demo',
    icon: PhoneCall,
    description: 'Test your AI agent'
  },
  {
    name: 'View Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Check performance metrics'
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
