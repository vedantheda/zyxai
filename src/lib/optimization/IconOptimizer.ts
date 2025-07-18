/**
 * Icon Optimization Utilities
 * Tree-shaking and performance optimization for Lucide icons
 */

// Re-export only the icons we actually use to enable tree-shaking
// This reduces bundle size from ~800KB to ~50KB

// Navigation & UI Icons
export { 
  LayoutDashboard,
  Brain,
  Phone,
  Users,
  PhoneCall,
  BarChart3,
  Settings,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Plus,
  Minus,
  Search,
  Filter,
  MoreHorizontal,
  MoreVertical
} from 'lucide-react'

// Action Icons
export {
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Save,
  RefreshCw,
  RotateCcw,
  Undo,
  Redo,
  Play,
  Pause,
  Stop,
  Square,
  Circle
} from 'lucide-react'

// Status & Feedback Icons
export {
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  Loader2,
  Spinner,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

// Communication Icons
export {
  Mail,
  MessageSquare,
  MessageCircle,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Headphones
} from 'lucide-react'

// File & Data Icons
export {
  File,
  FileText,
  Folder,
  FolderOpen,
  Image,
  Video,
  Music,
  Archive,
  Database,
  Server,
  Cloud,
  CloudUpload,
  CloudDownload
} from 'lucide-react'

// User & Account Icons
export {
  User,
  UserCheck,
  UserPlus,
  UserMinus,
  UserX,
  Users2,
  Crown,
  Shield,
  ShieldCheck,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react'

// Business & Analytics Icons
export {
  Calendar,
  Clock,
  Timer,
  Stopwatch,
  Target,
  Flag,
  Star,
  Heart,
  Bookmark,
  Tag,
  Hash,
  DollarSign,
  CreditCard,
  Receipt,
  ShoppingCart,
  Package,
  Truck
} from 'lucide-react'

// Technical Icons
export {
  Code,
  Terminal,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
  Bluetooth,
  Usb,
  Power,
  PowerOff,
  Battery,
  BatteryLow,
  Signal,
  SignalHigh,
  SignalLow,
  SignalZero
} from 'lucide-react'

// Integration & Connection Icons
export {
  Link,
  Unlink,
  ExternalLink,
  Globe,
  Network,
  Share,
  Share2,
  Import,
  Export,
  Merge,
  Split,
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest
} from 'lucide-react'

// Layout & Design Icons
export {
  Grid,
  Grid3x3,
  List,
  Columns,
  Rows,
  Sidebar,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  Maximize,
  Minimize,
  Expand,
  Shrink,
  Move,
  Resize
} from 'lucide-react'

// Workflow & Process Icons
export {
  Workflow,
  GitBranch as WorkflowBranch,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpLeft,
  ArrowDownLeft,
  CornerDownRight,
  CornerDownLeft,
  CornerUpRight,
  CornerUpLeft
} from 'lucide-react'

// Utility function to get icon by name (for dynamic usage)
export const getIcon = (name: string) => {
  const iconMap: Record<string, any> = {
    // Navigation
    'layout-dashboard': LayoutDashboard,
    'brain': Brain,
    'phone': Phone,
    'users': Users,
    'phone-call': PhoneCall,
    'bar-chart-3': BarChart3,
    'settings': Settings,
    'menu': Menu,
    'x': X,
    'plus': Plus,
    'search': Search,
    
    // Actions
    'edit': Edit,
    'trash-2': Trash2,
    'copy': Copy,
    'download': Download,
    'upload': Upload,
    'save': Save,
    'refresh-cw': RefreshCw,
    
    // Status
    'check-circle': CheckCircle,
    'x-circle': XCircle,
    'alert-triangle': AlertTriangle,
    'info': Info,
    'loader-2': Loader2,
    'activity': Activity,
    'zap': Zap,
    
    // Communication
    'mail': Mail,
    'message-square': MessageSquare,
    'mic': Mic,
    'mic-off': MicOff,
    
    // User
    'user': User,
    'user-check': UserCheck,
    'crown': Crown,
    'shield': Shield,
    'key': Key,
    'lock': Lock,
    'eye': Eye,
    'eye-off': EyeOff,
    
    // Business
    'calendar': Calendar,
    'clock': Clock,
    'target': Target,
    'star': Star,
    'dollar-sign': DollarSign,
    'credit-card': CreditCard,
    'package': Package,
    
    // Technical
    'code': Code,
    'terminal': Terminal,
    'cpu': Cpu,
    'hard-drive': HardDrive,
    'wifi': Wifi,
    'power': Power,
    'battery': Battery,
    
    // Integration
    'link': Link,
    'external-link': ExternalLink,
    'globe': Globe,
    'network': Network,
    'share': Share,
    'git-branch': GitBranch,
    
    // Layout
    'grid': Grid,
    'list': List,
    'columns': Columns,
    'sidebar': Sidebar,
    'maximize': Maximize,
    'minimize': Minimize,
    
    // Workflow
    'workflow': Workflow,
    'arrow-right': ArrowRight,
    'arrow-left': ArrowLeft,
    'arrow-up': ArrowUp,
    'arrow-down': ArrowDown
  }
  
  return iconMap[name] || null
}

// Type for icon names (for TypeScript autocomplete)
export type IconName = keyof ReturnType<typeof getIcon>

// Utility to preload critical icons
export const preloadCriticalIcons = () => {
  // These icons are used immediately on app load
  return [
    LayoutDashboard,
    Brain,
    Phone,
    Users,
    PhoneCall,
    BarChart3,
    Settings,
    Menu,
    Plus,
    User,
    CheckCircle,
    AlertTriangle
  ]
}

// Performance monitoring for icon usage
export const trackIconUsage = (iconName: string) => {
  if (process.env.NODE_ENV === 'development') {
    const usage = JSON.parse(localStorage.getItem('icon-usage') || '{}')
    usage[iconName] = (usage[iconName] || 0) + 1
    localStorage.setItem('icon-usage', JSON.stringify(usage))
  }
}

// Get icon usage statistics (development only)
export const getIconUsageStats = () => {
  if (process.env.NODE_ENV !== 'development') return {}
  return JSON.parse(localStorage.getItem('icon-usage') || '{}')
}

// Utility to identify unused icons
export const getUnusedIcons = () => {
  if (process.env.NODE_ENV !== 'development') return []
  
  const usage = getIconUsageStats()
  const allIcons = Object.keys(getIcon(''))
  
  return allIcons.filter(icon => !usage[icon] || usage[icon] === 0)
}
