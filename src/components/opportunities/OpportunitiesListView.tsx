'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface OpportunitiesListViewProps {
  opportunities?: any[]
  onOpportunitySelect?: (opportunity: any) => void
}

export function OpportunitiesListView({ 
  opportunities = [], 
  onOpportunitySelect 
}: OpportunitiesListViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Opportunities List</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No opportunities found. List view will be implemented here.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
