'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'
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
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Plus,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Send
} from 'lucide-react'
import { useRequireAuth } from '@/contexts/AuthContext'
// import { AdminRouteGuard } from '@/components/auth/AdminRouteGuard'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  email: string
  phone?: string
  status: 'onboarding' | 'documents_pending' | 'in_review' | 'completed' | 'filed'
  progress: number
  documentsUploaded: number
  documentsRequired: number
  lastActivity: string
  assignedTo?: string
  priority: 'high' | 'medium' | 'low'
  taxYear: number
}

interface PracticeStats {
  totalClients: number
  activeClients: number
  completedReturns: number
  pendingDocuments: number
  avgCompletionTime: number
  revenue: number
}

function AdminDashboardPageContent() {
  const { user, loading: authLoading } = useRequireAuth()
  const { data: adminData, loading: adminLoading, error } = useAdminDashboard()

  // Use real data from the hook
  const practiceStats = adminData?.practiceStats || {
    totalClients: 0,
    activeClients: 0,
    completedReturns: 0,
    pendingDocuments: 0,
    avgCompletionTime: 0,
    revenue: 0
  }

  // Use real client data from the hook
  const recentClients = adminData?.recentClients || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      case 'documents_pending': return 'bg-yellow-100 text-yellow-800'
      case 'onboarding': return 'bg-gray-100 text-gray-800'
      case 'filed': return 'bg-purple-100 text-purple-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            {authLoading ? 'Authenticating...' : 'Loading dashboard...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Unable to load dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tax Practice Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your clients, track progress, and streamline your tax practice operations.
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Tax Calendar
          </Button>
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Link>
          </Button>
        </div>
      </div>

      {/* Practice Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{practiceStats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{practiceStats.activeClients}</div>
            <p className="text-xs text-muted-foreground">
              Currently in process
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Returns</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{practiceStats.completedReturns}</div>
            <p className="text-xs text-muted-foreground">
              This tax season
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{practiceStats.pendingDocuments}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Clients */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Client Activity</CardTitle>
              <CardDescription>
                Latest updates from your clients
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/clients">
                View All Clients
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-muted-foreground">{client.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(client.status)}>
                      {client.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={client.progress} className="w-16" />
                      <div className="text-xs text-muted-foreground">{client.progress}%</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {client.documents_count}/5
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(client.priority)}>
                      {client.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {client.last_activity}
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="mr-2 h-4 w-4" />
                          Send Reminder
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

export default function AdminDashboardPage() {
  return <AdminDashboardPageContent />
  // return (
  //   <AdminRouteGuard>
  //     <AdminDashboardPageContent />
  //   </AdminRouteGuard>
  // )
}
