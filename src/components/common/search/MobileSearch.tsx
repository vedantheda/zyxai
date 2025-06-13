'use client'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import GlobalSearch from './GlobalSearch'
interface MobileSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
export function MobileSearch({ open, onOpenChange }: MobileSearchProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Search</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-4">
          <GlobalSearch
            className="w-full"
            placeholder="Search clients, documents, tasks..."
            showFilters={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
interface MobileSearchTriggerProps {
  children: React.ReactNode
}
export function MobileSearchTrigger({ children }: MobileSearchTriggerProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>
      <MobileSearch open={open} onOpenChange={setOpen} />
    </>
  )
}
