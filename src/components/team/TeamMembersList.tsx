'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users, Mail, Calendar, MoreHorizontal, X } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { InviteUserDialog } from './InviteUserDialog'
import type { UserInvitation } from '@/types/database'

interface TeamMembersListProps {
  showInvitations?: boolean
}

export function TeamMembersList({ showInvitations = true }: TeamMembersListProps) {
  const [invitations, setInvitations] = useState<UserInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchInvitations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/invitations/list')
      
      if (!response.ok) {
        throw new Error('Failed to fetch invitations')
      }

      const result = await response.json()
      setInvitations(result.invitations || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
      setError('Failed to load team invitations')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (showInvitations) {
      fetchInvitations()
    }
  }, [showInvitations])

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch('/api/invitations/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationId })
      })

      if (!response.ok) {
        throw new Error('Failed to cancel invitation')
      }

      // Refresh the list
      fetchInvitations()
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      setError('Failed to cancel invitation')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      accepted: 'default',
      expired: 'secondary',
      cancelled: 'destructive'
    } as const

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      agent: 'bg-orange-100 text-orange-800',
      viewer: 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge variant="outline" className={colors[role as keyof typeof colors]}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  if (!showInvitations) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Invitations
            </CardTitle>
            <CardDescription>
              Manage pending invitations and team member access
            </CardDescription>
          </div>
          <InviteUserDialog onInviteSent={fetchInvitations} />
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading invitations...
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No invitations yet</h3>
            <p className="text-muted-foreground mb-4">
              Start building your team by inviting colleagues to join your organization.
            </p>
            <InviteUserDialog 
              onInviteSent={fetchInvitations}
              trigger={
                <Button>
                  <Mail className="w-4 h-4 mr-2" />
                  Send First Invitation
                </Button>
              }
            />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      {invitation.first_name || invitation.last_name 
                        ? `${invitation.first_name || ''} ${invitation.last_name || ''}`.trim()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(invitation.role)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invitation.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {invitation.status === 'pending' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="text-red-600"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel Invitation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
