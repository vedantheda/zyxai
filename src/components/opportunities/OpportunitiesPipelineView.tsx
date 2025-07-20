'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OpportunitiesPipelineViewProps {
  opportunities?: any[]
  pipeline?: any
  onOpportunityMove?: (opportunityId: string, stageId: string) => void
}

export function OpportunitiesPipelineView({ 
  opportunities = [], 
  pipeline, 
  onOpportunityMove 
}: OpportunitiesPipelineViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Pipeline view will be implemented here
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Qualified</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Drag and drop functionality coming soon
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Stage management features
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Closed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Final stage tracking
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
