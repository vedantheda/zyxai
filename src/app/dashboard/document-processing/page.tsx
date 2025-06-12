'use client'

import { useState } from 'react'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-spinner'
import { DocumentProcessingDashboard } from '@/components/document-processing/DocumentProcessingDashboard'
import { TaxFormAutoFillDashboard } from '@/components/tax-forms/TaxFormAutoFillDashboard'
import { IntelligenceDashboard } from '@/components/intelligence/IntelligenceDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, FormInput, Lightbulb } from 'lucide-react'

export default function DocumentProcessingPage() {
  const { user, loading: sessionLoading, isSessionReady, isAuthenticated } = useSessionSync()
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('intelligence')

  // Show loading during session sync
  if (sessionLoading || !isSessionReady) {
    return <LoadingScreen text="Loading document processing..." />
  }

  // Handle unauthenticated state
  if (!isAuthenticated) {
    return <LoadingScreen text="Please log in to view document processing" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Document Processing & Tax Forms</h1>
          <p className="text-muted-foreground">
            Automated document analysis, data extraction, and intelligent tax form generation
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="intelligence">
            <Lightbulb className="w-4 h-4 mr-2" />
            AI Intelligence
          </TabsTrigger>
          <TabsTrigger value="processing">
            <Brain className="w-4 h-4 mr-2" />
            Document Processing
          </TabsTrigger>
          <TabsTrigger value="forms">
            <FormInput className="w-4 h-4 mr-2" />
            Tax Form Auto-Fill
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intelligence" className="space-y-6">
          <IntelligenceDashboard clientId={selectedClient || undefined} />
        </TabsContent>

        <TabsContent value="processing" className="space-y-6">
          <DocumentProcessingDashboard clientId={selectedClient || undefined} />
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <TaxFormAutoFillDashboard
            clientId={selectedClient || undefined}
            taxYear={new Date().getFullYear()}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
