'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Upload,
  Eye,
  MessageSquare,
  TrendingUp,
  Search,
  Filter,
  Plus
} from 'lucide-react'
import { useAuth, useAuthStatus } from '@/contexts/AuthProvider'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { useClients } from '@/hooks/useSupabaseData'
import DocumentChecklistManager from '@/components/features/documents/DocumentChecklistManager'
import ProgressTracker from '@/components/features/documents/ProgressTracker'
import { PersonalizedChecklist } from '@/components/features/documents/PersonalizedChecklist'
import { UploadTrackingDashboard } from '@/components/features/documents/UploadTrackingDashboard'
import { DocumentAlerts } from '@/components/features/documents/DocumentAlerts'

export default function DocumentCollectionPage() {
  const { user, loading } = useAuth()
  const { isAuthenticated } = useAuthStatus()
  const isReady = !loading
  const { clients, loading: clientsLoading } = useClients()
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Auto-select first client if none selected
  useEffect(() => {
    if (clients && clients.length > 0 && !selectedClient) {
      setSelectedClient(clients[0].id)
    }
  }, [clients, selectedClient])

  const selectedClientData = clients?.find(c => c.id === selectedClient)

  const handleProgressUpdate = (progress: number) => {
    // Trigger refresh of overview data
    setRefreshTrigger(prev => prev + 1)
  }

  // Show loading during session sync
  if (loading || !isReady) {
    return <LoadingScreen text="Loading document collection..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view document collection" />
  }

  // Show loading for clients data
  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading clients data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Document Collection & Monitoring</h1>
          <p className="text-muted-foreground">
            Automated document collection with real-time progress tracking
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedClient || ''} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Collection
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {selectedClient && selectedClientData ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="checklist">
              <FileText className="w-4 h-4 mr-2" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="tracking">
              <Upload className="w-4 h-4 mr-2" />
              Tracking
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="monitoring">
              <Eye className="w-4 h-4 mr-2" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ProgressTracker
              clientId={selectedClient}
              clientName={selectedClientData.name}
              refreshTrigger={refreshTrigger}
            />
          </TabsContent>

          <TabsContent value="checklist" className="space-y-6">
            <PersonalizedChecklist
              clientId={selectedClient}
              onItemComplete={(itemId) => {
                console.log('Item completed:', itemId)
                handleProgressUpdate(0) // Trigger refresh
              }}
              onUploadDocument={(itemId) => {
                console.log('Upload document for item:', itemId)
              }}
            />
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <UploadTrackingDashboard
              clientId={selectedClient}
              showClientFilter={false}
            />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <DocumentAlerts
              clientId={selectedClient}
              showClientFilter={false}
            />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Monitoring Dashboard</CardTitle>
                <CardDescription>
                  Real-time monitoring and alert management for {selectedClientData.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Document Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Uploaded</span>
                          <Badge variant="default">5</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Pending Review</span>
                          <Badge variant="secondary">2</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Missing</span>
                          <Badge variant="destructive">1</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Client Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Last Login</span>
                          <span className="text-sm text-muted-foreground">2 hours ago</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Documents Uploaded</span>
                          <span className="text-sm text-muted-foreground">5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Messages Sent</span>
                          <span className="text-sm text-muted-foreground">3</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Users className="w-12 h-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">No Client Selected</h3>
                <p className="text-muted-foreground">
                  {clients && clients.length > 0
                    ? 'Please select a client from the dropdown above to view their document collection progress.'
                    : 'No clients found. Please add clients first to start document collection.'
                  }
                </p>
              </div>
              {(!clients || clients.length === 0) && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Client
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
