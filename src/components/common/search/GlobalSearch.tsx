'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Search,
  User,
  FileText,
  CheckSquare,
  Calendar,
  DollarSign,
  Building,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Filter,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthProvider'
import { useRouter } from 'next/navigation'
interface SearchResult {
  id: string
  type: 'client' | 'task' | 'document' | 'notification'
  title: string
  subtitle?: string
  description?: string
  url: string
  metadata?: Record<string, any>
  relevance: number
}
interface GlobalSearchProps {
  placeholder?: string
  className?: string
  showFilters?: boolean
}
export default function GlobalSearch({
  placeholder = "Search clients, documents, tasks...",
  className = "",
  showFilters = true
}: GlobalSearchProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const searchRef = useRef<HTMLInputElement>(null)
  const popoverContentRef = useRef<HTMLDivElement>(null)
  const searchFilters = [
    { key: 'client', label: 'Clients', icon: User },
    { key: 'task', label: 'Tasks', icon: CheckSquare },
    { key: 'document', label: 'Documents', icon: FileText },
    { key: 'notification', label: 'Notifications', icon: Calendar }
  ]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        searchRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  // Debounce search to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query)
      } else {
        setResults([])
      }
    }, 300) // 300ms debounce
    return () => clearTimeout(timeoutId)
  }, [query, selectedFilters])
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!user) return
    setLoading(true)
    try {
      const searchResults: SearchResult[] = []
      // Search clients
      if (selectedFilters.length === 0 || selectedFilters.includes('client')) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name, email, phone, type, status')
          .eq('user_id', user.id)
          .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
          .limit(10)
        clients?.forEach(client => {
          searchResults.push({
            id: client.id,
            type: 'client',
            title: client.name,
            subtitle: client.email,
            description: `${client.type} • ${client.status.replace('_', ' ')}`,
            url: `/dashboard/clients/${client.id}`,
            metadata: client,
            relevance: calculateRelevance(searchQuery, [client.name, client.email])
          })
        })
      }
      // Search tasks
      if (selectedFilters.length === 0 || selectedFilters.includes('task')) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select(`
            id, title, description, status, priority, category, due_date,
            clients (name)
          `)
          .eq('user_id', user.id)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
          .limit(10)
        tasks?.forEach(task => {
          searchResults.push({
            id: task.id,
            type: 'task',
            title: task.title,
            subtitle: (Array.isArray(task.clients) ? (task.clients[0] as any)?.name : (task.clients as any)?.name) || 'General Task',
            description: `${task.status} • ${task.priority} priority • ${task.category}`,
            url: (task as any).client_id ? `/dashboard/clients/${(task as any).client_id}` : '/dashboard/tasks',
            metadata: task,
            relevance: calculateRelevance(searchQuery, [task.title, task.description])
          })
        })
      }
      // Search documents
      if (selectedFilters.length === 0 || selectedFilters.includes('document')) {
        const { data: documents } = await supabase
          .from('documents')
          .select(`
            id, name, category, file_size, created_at,
            clients (name, id)
          `)
          .eq('user_id', user.id)
          .or(`name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
          .limit(10)
        documents?.forEach(doc => {
          searchResults.push({
            id: doc.id,
            type: 'document',
            title: doc.name,
            subtitle: (Array.isArray(doc.clients) ? (doc.clients[0] as any)?.name : (doc.clients as any)?.name) || 'General Document',
            description: `${doc.category} • ${formatFileSize(doc.file_size)}`,
            url: (doc as any).client_id ? `/dashboard/clients/${(doc as any).client_id}` : '/dashboard/documents',
            metadata: doc,
            relevance: calculateRelevance(searchQuery, [doc.name, doc.category])
          })
        })
      }
      // Search notifications
      if (selectedFilters.length === 0 || selectedFilters.includes('notification')) {
        const { data: notifications } = await supabase
          .from('notifications')
          .select('id, title, message, type, created_at, action_url')
          .eq('user_id', user.id)
          .eq('archived', false)
          .or(`title.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%`)
          .limit(5)
        notifications?.forEach(notification => {
          searchResults.push({
            id: notification.id,
            type: 'notification',
            title: notification.title,
            subtitle: notification.message,
            description: `${notification.type} • ${formatTimeAgo(notification.created_at)}`,
            url: notification.action_url || '/dashboard',
            metadata: notification,
            relevance: calculateRelevance(searchQuery, [notification.title, notification.message])
          })
        })
      }
      // Sort by relevance
      searchResults.sort((a, b) => b.relevance - a.relevance)
      setResults(searchResults.slice(0, 20))
    } catch (error) {
      } finally {
      setLoading(false)
    }
  }, [user, selectedFilters])
  const calculateRelevance = useCallback((query: string, fields: (string | null | undefined)[]): number => {
    const lowerQuery = query.toLowerCase()
    let score = 0
    fields.forEach(field => {
      if (!field) return
      const lowerField = field.toLowerCase()
      // Exact match gets highest score
      if (lowerField === lowerQuery) score += 100
      // Starts with query gets high score
      else if (lowerField.startsWith(lowerQuery)) score += 50
      // Contains query gets medium score
      else if (lowerField.includes(lowerQuery)) score += 25
      // Word boundary match gets bonus
      if (new RegExp(`\\b${lowerQuery}`, 'i').test(field)) score += 10
    })
    return score
  }, [])
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])
  const formatTimeAgo = useCallback((dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }, [])
  // Memoized change handlers to prevent focus loss
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }, [])
  const handleCommandValueChange = useCallback((value: string) => {
    setQuery(value)
  }, [])
  const handleFocus = useCallback((e: React.FocusEvent) => {
    e.preventDefault()
    setOpen(true)
  }, [])
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(true)
    searchRef.current?.focus()
  }, [])
  // Handle popover open change - prevent rapid open/close cycles
  const handleOpenChange = useCallback((newOpen: boolean) => {
    // Prevent rapid toggling by adding a small delay
    if (!newOpen && open) {
      // Only close if we're not in the middle of an interaction
      setTimeout(() => {
        setOpen(false)
      }, 50)
    } else if (newOpen) {
      setOpen(true)
    }
  }, [open])
  const toggleFilter = useCallback((filterKey: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterKey)
        ? prev.filter(f => f !== filterKey)
        : [...prev, filterKey]
    )
    // Keep the popover open when toggling filters
    setOpen(true)
  }, [])
  const clearFilters = useCallback(() => {
    setSelectedFilters([])
    // Keep the popover open when clearing filters
    setOpen(true)
  }, [])
  const handleResultClick = useCallback((result: SearchResult) => {
    setOpen(false)
    setQuery('')
    router.push(result.url)
  }, [router])
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'client': return <User className="w-4 h-4 text-purple-600" />
      case 'task': return <CheckSquare className="w-4 h-4 text-blue-600" />
      case 'document': return <FileText className="w-4 h-4 text-orange-600" />
      case 'notification': return <Calendar className="w-4 h-4 text-green-600" />
      default: return <Search className="w-4 h-4" />
    }
  }
  // Keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
        setOpen(true)
      }
      // Escape to close
      if (e.key === 'Escape' && open) {
        setOpen(false)
        searchRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])
  return (
    <div className={`relative min-w-[500px] ${className}`}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={searchRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={handleQueryChange}
              onFocus={handleFocus}
              onClick={handleClick}
              className="w-full pl-10 pr-4 h-10 bg-muted/50 border-muted-foreground/20 focus:bg-background focus:border-primary/50 transition-all duration-200"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          ref={popoverContentRef}
          className="w-[600px] p-0"
          align="start"
          side="bottom"
          sideOffset={4}
          onPointerDownOutside={(e) => {
            // Only prevent if clicking on search input
            if (searchRef.current?.contains(e.target as Node)) {
              e.preventDefault()
              return
            }
            // Allow normal closing for other outside clicks
            setOpen(false)
          }}
          onEscapeKeyDown={() => {
            setOpen(false)
            searchRef.current?.blur()
          }}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search everything..."
              value={query}
              onValueChange={handleCommandValueChange}
            />
            {showFilters && (
              <div
                className="flex items-center space-x-2 p-3 border-b"
                onClick={(e) => e.stopPropagation()}
              >
                <Filter className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-2">
                  {searchFilters.map(filter => (
                    <Button
                      key={filter.key}
                      variant={selectedFilters.includes(filter.key) ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleFilter(filter.key)
                      }}
                      className="h-6 text-xs"
                    >
                      <filter.icon className="w-3 h-3 mr-1" />
                      {filter.label}
                    </Button>
                  ))}
                  {selectedFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        clearFilters()
                      }}
                      className="h-6 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}
            <CommandList onClick={(e) => e.stopPropagation()}>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  <CommandEmpty>
                    {query.length < 2 ? 'Type at least 2 characters to search' : 'No results found'}
                  </CommandEmpty>
                  {results.length > 0 && (
                    <CommandGroup heading={`${results.length} result${results.length !== 1 ? 's' : ''}`}>
                      {results.map((result) => (
                        <CommandItem
                          key={`${result.type}-${result.id}`}
                          onSelect={() => handleResultClick(result)}
                          className="flex items-center space-x-3 p-3 cursor-pointer"
                        >
                          <div className="flex-shrink-0">
                            {getResultIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium truncate">{result.title}</p>
                              <Badge variant="outline" className="text-xs">
                                {result.type}
                              </Badge>
                            </div>
                            {result.subtitle && (
                              <p className="text-sm text-muted-foreground truncate">
                                {result.subtitle}
                              </p>
                            )}
                            {result.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {result.description}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
