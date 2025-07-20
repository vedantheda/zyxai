'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface CreateOpportunityModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCreateOpportunity?: (opportunity: any) => void
}

export function CreateOpportunityModal({ 
  open = false, 
  onOpenChange, 
  onCreateOpportunity 
}: CreateOpportunityModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Opportunity</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <div className="text-sm text-muted-foreground mb-4">
            Opportunity creation form will be implemented here
          </div>
          <Button onClick={() => onOpenChange?.(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
