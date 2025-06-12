'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Send,
  FileText,
  Calendar,
  Phone,
  Mail,
  Filter,
  X,
  ChevronDown,
  SortAsc,
  SortDesc,
  Download,
  Trash2,
  Archive,
  Star,
  Clock,
  Users,
  Building,
  CheckSquare,
  Square,
  XCircle,
  RefreshCw,
  User,
  BarChart3
} from 'lucide-react'
import { useRequireAuth } from '@/contexts/AuthContext'
import { useClients } from '@/hooks/useSupabaseData'
import { getFromCache, setCache } from '@/lib/globalCache'
import Link from 'next/link'

interface Client {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string | null
  type: 'individual' | 'business'
  status: 'documents_pending' | 'in_review' | 'onboarding' | 'completed' | 'filed' | 'active' | 'pending' | 'complete' | 'inactive'
  priority: 'high' | 'medium' | 'low'
  progress: number
  documents_count: number
  last_activity: string
  created_at: string
  updated_at: string
  practice_id?: string | null
  assigned_to?: string | null
  tax_year?: number
  estimated_refund?: string | null
}

interface FilterState {
  search: string
  status: string[]
  priority: string[]
  type: string[]
  progressRange: [number, number]
  dateRange: {
    field: 'created_at' | 'last_activity' | 'updated_at'
    from?: Date
    to?: Date
  } | null
  documentCount: {
    min?: number
    max?: number
  }
  hasPhone: boolean | null
}

interface SortState {
  field: keyof Client
  direction: 'asc' | 'desc'
}

export default function ClientsPage() {
  console.log('🔥 DASHBOARD CLIENTS PAGE - LOADING')
  const { user, loading: authLoading } = useRequireAuth()
  const { clients: allClients, loading: clientsLoading, error: clientsError, addClient, updateClient, retryFetch } = useClients()

  // Enhanced state management
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [sortState, setSortState] = useState<SortState>({ field: 'created_at', direction: 'desc' })

  // Advanced filters state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: [],
    priority: [],
    type: [],
    progressRange: [0, 100],
    dateRange: null,
    documentCount: {},
    hasPhone: null
  })

  // PERFORMANCE OPTIMIZED filtering logic
  const filteredAndSortedClients = useMemo(() => {
    if (!allClients.length) return []

    // Pre-compute values for performance
    const lowerSearchTerm = searchTerm.toLowerCase()
    const hasSearch = searchTerm !== ''

    let filtered = allClients.filter(client => {
      // Early returns for performance - check most restrictive filters first
      if (statusFilter !== 'all' && client.status !== statusFilter) return false
      if (priorityFilter !== 'all' && client.priority !== priorityFilter) return false

      // Search filter - optimized with early returns
      if (hasSearch) {
        if (!client.name.toLowerCase().includes(lowerSearchTerm) &&
            !client.email.toLowerCase().includes(lowerSearchTerm) &&
            !(client.phone?.toLowerCase().includes(lowerSearchTerm))) {
          return false
        }
      }

      // Advanced filters - only check if they have values
      if (filters.status.length > 0 && !filters.status.includes(client.status)) return false
      if (filters.priority.length > 0 && !filters.priority.includes(client.priority)) return false
      if (filters.type.length > 0 && !filters.type.includes(client.type)) return false

      // Progress range
      if (client.progress < filters.progressRange[0] || client.progress > filters.progressRange[1]) return false

      // Phone filter
      if (filters.hasPhone !== null) {
        const hasPhone = !!client.phone
        if (filters.hasPhone !== hasPhone) return false
      }

      // Document count
      if (filters.documentCount.min && client.documents_count < filters.documentCount.min) return false
      if (filters.documentCount.max && client.documents_count > filters.documentCount.max) return false

      // Date range - most expensive, check last
      if (filters.dateRange?.from || filters.dateRange?.to) {
        const clientDate = new Date(client[filters.dateRange.field])
        if (filters.dateRange.from && clientDate < filters.dateRange.from) return false
        if (filters.dateRange.to && clientDate > filters.dateRange.to) return false
      }

      return true
    })

    // Optimized sorting - only sort if needed and more than 1 item
    if (sortState.field && filtered.length > 1) {
      const { field, direction } = sortState
      const multiplier = direction === 'asc' ? 1 : -1

      filtered.sort((a, b) => {
        const aValue = a[field]
        const bValue = b[field]

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return multiplier * aValue.localeCompare(bValue)
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return multiplier * (aValue - bValue)
        }

        // Date comparison
        return multiplier * (new Date(aValue as string).getTime() - new Date(bValue as string).getTime())
      })
    }

    return filtered
  }, [allClients, searchTerm, statusFilter, priorityFilter, filters, sortState])

  // Memoized color functions for performance
  const getStatusColor = useCallback((status: Client['status']) => {
    switch (status) {
      case 'completed':
      case 'filed':
      case 'complete':
        return 'bg-green-100 text-green-800'
      case 'in_review':
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'documents_pending':
      case 'onboarding':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getPriorityColor = useCallback((priority: Client['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }, [])

  // Utility functions
  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.priority.length > 0) count++
    if (filters.type.length > 0) count++
    if (filters.progressRange[0] > 0 || filters.progressRange[1] < 100) count++
    if (filters.dateRange) count++
    if (filters.documentCount.min || filters.documentCount.max) count++
    if (filters.hasPhone !== null) count++
    return count
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setFilters({
      search: '',
      status: [],
      priority: [],
      type: [],
      progressRange: [0, 100],
      dateRange: null,
      documentCount: {},
      hasPhone: null
    })
    setSelectedClients([])
  }

  const toggleClientSelection = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedClients.length === filteredAndSortedClients.length) {
      setSelectedClients([])
    } else {
      setSelectedClients(filteredAndSortedClients.map(client => client.id))
    }
  }

  const handleSort = (field: keyof Client) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Debounced search for better performance
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
  }, [])

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value)
  }, [])

  const handlePriorityFilterChange = useCallback((value: string) => {
    setPriorityFilter(value)
  }, [])

  if (authLoading || clientsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <div>
            <p className="text-muted-foreground">Loading clients...</p>
            <p className="text-xs text-muted-foreground mt-1">This should only take a moment</p>
          </div>
          {clientsLoading && (
            <Button
              onClick={retryFetch}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Taking too long? Click to retry
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (clientsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-red-600">
            <XCircle className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Failed to load clients</p>
            <p className="text-sm text-muted-foreground">{clientsError}</p>
          </div>
          <Button onClick={retryFetch} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Management</h1>
          <p className="text-muted-foreground">
            Manage all your tax clients in one place
          </p>
          {selectedClients.length > 0 && (
            <div className="mt-2">
              <Badge variant="secondary">
                {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''} selected
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {selectedClients.length > 0 && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <MoreHorizontal className="w-4 h-4 mr-2" />
                    Bulk Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Export Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive Clients
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <Link href="/dashboard/clients/new">
              <Plus className="w-4 h-4 mr-2" />
              Add New Client
            </Link>
          </Button>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Search & Filter Clients</span>
              </CardTitle>
              <CardDescription>
                Use advanced filters to find exactly what you're looking for
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary">
                  {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} active
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
              </Button>
              {(getActiveFiltersCount() > 0 || searchTerm) && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Search and Quick Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="documents_pending">Documents Pending</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="filed">Filed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Multi-select Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status (Multi-select)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {filters.status.length > 0 ? `${filters.status.length} selected` : 'Select statuses'}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search statuses..." />
                        <CommandList>
                          <CommandEmpty>No status found.</CommandEmpty>
                          <CommandGroup>
                            {['documents_pending', 'in_review', 'onboarding', 'completed', 'filed', 'active', 'pending', 'complete', 'inactive'].map((status) => (
                              <CommandItem
                                key={status}
                                onSelect={() => {
                                  setFilters(prev => ({
                                    ...prev,
                                    status: prev.status.includes(status)
                                      ? prev.status.filter(s => s !== status)
                                      : [...prev.status, status]
                                  }))
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  {filters.status.includes(status) ? (
                                    <CheckSquare className="w-4 h-4" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                  <span className="capitalize">{status.replace('_', ' ')}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Client Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client Type</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {filters.type.length > 0 ? `${filters.type.length} selected` : 'Select types'}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandList>
                          <CommandGroup>
                            {['individual', 'business'].map((type) => (
                              <CommandItem
                                key={type}
                                onSelect={() => {
                                  setFilters(prev => ({
                                    ...prev,
                                    type: prev.type.includes(type)
                                      ? prev.type.filter(t => t !== type)
                                      : [...prev.type, type]
                                  }))
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  {filters.type.includes(type) ? (
                                    <CheckSquare className="w-4 h-4" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                  <span className="capitalize">{type}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Phone Number Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Select
                    value={filters.hasPhone === null ? 'all' : filters.hasPhone ? 'yes' : 'no'}
                    onValueChange={(value) => {
                      setFilters(prev => ({
                        ...prev,
                        hasPhone: value === 'all' ? null : value === 'yes'
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      <SelectItem value="yes">Has Phone</SelectItem>
                      <SelectItem value="no">No Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Document Count Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document Count</label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.documentCount.min || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        documentCount: { ...prev.documentCount, min: e.target.value ? parseInt(e.target.value) : undefined }
                      }))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground self-center">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.documentCount.max || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        documentCount: { ...prev.documentCount, max: e.target.value ? parseInt(e.target.value) : undefined }
                      }))}
                      className="w-20"
                    />
                  </div>
                </div>

                {/* Progress Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Progress Range</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.progressRange[0]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        progressRange: [parseInt(e.target.value) || 0, prev.progressRange[1]]
                      }))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">%</span>
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={filters.progressRange[1]}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        progressRange: [prev.progressRange[0], parseInt(e.target.value) || 100]
                      }))}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Client List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>All Clients ({filteredAndSortedClients.length})</span>
              </CardTitle>
              <CardDescription>
                {filteredAndSortedClients.length !== allClients.length && (
                  <span>Showing {filteredAndSortedClients.length} of {allClients.length} clients</span>
                )}
                {filteredAndSortedClients.length === allClients.length && (
                  <span>Complete list of your tax clients</span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {selectedClients.length > 0 && (
                <Badge variant="outline">
                  {selectedClients.length} selected
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SortAsc className="w-4 h-4 mr-2" />
                    Sort by {sortState.field}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSort('name')}>
                    <User className="w-4 h-4 mr-2" />
                    Name {sortState.field === 'name' && (sortState.direction === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('created_at')}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Created {sortState.field === 'created_at' && (sortState.direction === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('last_activity')}>
                    <Clock className="w-4 h-4 mr-2" />
                    Last Activity {sortState.field === 'last_activity' && (sortState.direction === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('progress')}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Progress {sortState.field === 'progress' && (sortState.direction === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('documents_count')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Documents {sortState.field === 'documents_count' && (sortState.direction === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedClients.length === filteredAndSortedClients.length && filteredAndSortedClients.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Client</span>
                    {sortState.field === 'name' && (
                      sortState.direction === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('progress')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Progress</span>
                    {sortState.field === 'progress' && (
                      sortState.direction === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('documents_count')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Documents</span>
                    {sortState.field === 'documents_count' && (
                      sortState.direction === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Priority</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('last_activity')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Activity</span>
                    {sortState.field === 'last_activity' && (
                      sortState.direction === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Created</span>
                    {sortState.field === 'created_at' && (
                      sortState.direction === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedClients.map((client) => (
                <TableRow
                  key={client.id}
                  className={selectedClients.includes(client.id) ? 'bg-muted/50' : ''}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => toggleClientSelection(client.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {client.email}
                      </div>
                      {client.phone && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {client.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(client.status)}>
                      {client.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={client.progress} className="w-20" />
                      <div className="text-xs text-muted-foreground">{client.progress}%</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {client.documents_count} docs
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(client.priority)}>
                      {client.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(client.last_activity).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(client.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/clients/${client.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="mr-2 h-4 w-4" />
                          View Documents
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="mr-2 h-4 w-4" />
                          Send Reminder
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Meeting
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
