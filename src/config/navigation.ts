import {
  Brain,
  LayoutDashboard,
  Users,
  FileText,
  CheckSquare,
  MessageSquare,
  Settings,
  Bot,
  DollarSign,
  UserPlus,
  Workflow,
  BarChart3,
  TrendingUp,
  Home,
  User,
  Receipt
} from 'lucide-react'

export interface NavigationItem {
  name: string
  href: string
  icon: any
  description: string
}

// Admin Navigation
export const adminNavigation: NavigationItem[] = [
  // Main Workflow - Complete Client Pipeline
  {
    name: 'Client Pipeline',
    href: '/pipeline',
    icon: TrendingUp,
    description: 'Complete workflow from intake to filing'
  },

  // Core Management
  {
    name: 'Client Management',
    href: '/clients',
    icon: Users,
    description: 'Manage all tax clients'
  },
  {
    name: 'Messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
    description: 'Client communication and messaging'
  },
  {
    name: 'Task Management',
    href: '/tasks',
    icon: CheckSquare,
    description: 'Team tasks and workflows'
  },

  // Document & AI Processing
  {
    name: 'Documents',
    href: '/documents',
    icon: FileText,
    description: 'Upload and manage client documents'
  },
  {
    name: 'Document Collection',
    href: '/dashboard/document-collection',
    icon: FileText,
    description: 'Personalized checklists & upload tracking'
  },
  {
    name: 'Document Processing',
    href: '/document-processing',
    icon: Bot,
    description: 'AI document analysis & form generation'
  },
  {
    name: 'AI Assistant',
    href: '/ai-assistant',
    icon: Bot,
    description: 'Tax expertise chatbot'
  },

  // Business Operations
  {
    name: 'Bookkeeping Automation',
    href: '/dashboard/bookkeeping',
    icon: DollarSign,
    description: 'AI-powered transaction categorization'
  },
  {
    name: 'Client Onboarding',
    href: '/onboarding',
    icon: UserPlus,
    description: 'Automated client setup'
  },
  {
    name: 'Workflow Management',
    href: '/workflows',
    icon: Workflow,
    description: 'Automate client processes and alerts'
  },
  {
    name: 'Reports & Analytics',
    href: '/reports',
    icon: BarChart3,
    description: 'Practice performance insights'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Practice configuration'
  }
]

// Client Navigation
export const clientNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Your tax return overview'
  },
  {
    name: 'Documents',
    href: '/dashboard/documents',
    icon: FileText,
    description: 'Upload and manage your documents'
  },
  {
    name: 'Tasks',
    href: '/dashboard/tasks',
    icon: CheckSquare,
    description: 'Your to-do items'
  },
  {
    name: 'Messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
    description: 'Communicate with your tax professional'
  },
  {
    name: 'Tax Return',
    href: '/dashboard/tax-return',
    icon: Receipt,
    description: 'View your tax return status'
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: User,
    description: 'Manage your account'
  }
]

// Navigation section dividers for admin (for better organization)
export const adminNavigationDividers = [1, 3, 6] // After which indices to show dividers
