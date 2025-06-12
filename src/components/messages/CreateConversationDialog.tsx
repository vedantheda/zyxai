'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, User, MessageSquare, Send } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Client {
  id: string
  name: string
  email: string
  avatar_url?: string
  status?: string
}

interface CreateConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateConversation: (clientId: string, subject: string, initialMessage?: string) => Promise<void>
}

export function CreateConversationDialog({
  open,
  onOpenChange,
  onCreateConversation
}: CreateConversationDialogProps) {
  const { session } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [subject, setSubject] = useState('')
  const [initialMessage, setInitialMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  // Load clients when dialog opens
  useEffect(() => {
    if (open) {
      loadClients()
    }
  }, [open])

  const loadClients = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!selectedClient || !subject.trim()) return

    try {
      setCreating(true)
      await onCreateConversation(
        selectedClient.id,
        subject.trim(),
        initialMessage.trim() || undefined
      )
      
      // Reset form
      setSelectedClient(null)
      setSubject('')
      setInitialMessage('')
      setSearchQuery('')
    } catch (error) {
      console.error('Error creating conversation:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleClose = () => {
    setSelectedClient(null)
    setSubject('')
    setInitialMessage('')
    setSearchQuery('')
    onOpenChange(false)
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Start New Conversation</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-3">
            <Label>Select Client</Label>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Client */}
            {selectedClient && (
              <div className="p-3 border rounded-lg bg-accent/20">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedClient.avatar_url} />
                    <AvatarFallback>
                      {getInitials(selectedClient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{selectedClient.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedClient(null)}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}

            {/* Client List */}
            {!selectedClient && (
              <ScrollArea className="h-48 border rounded-lg">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading clients...
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchQuery ? 'No clients found' : 'No clients available'}
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredClients.map((client) => (
                      <div
                        key={client.id}
                        className="p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setSelectedClient(client)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={client.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{client.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {client.email}
                            </p>
                          </div>
                          {client.status && (
                            <Badge variant="outline" className="text-xs">
                              {client.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </div>

          {/* Conversation Details */}
          {selectedClient && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., 2024 Tax Return Questions"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Initial Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Start the conversation with a message..."
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedClient || !subject.trim() || creating}
            >
              {creating ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {creating ? 'Creating...' : 'Start Conversation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
