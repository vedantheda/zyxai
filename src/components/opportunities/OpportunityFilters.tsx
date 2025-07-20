'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface OpportunityFiltersProps {
  onFiltersChange?: (filters: any) => void
}

export function OpportunityFilters({ onFiltersChange }: OpportunityFiltersProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">
          Opportunity filters will be implemented here
        </div>
      </CardContent>
    </Card>
  )
}
