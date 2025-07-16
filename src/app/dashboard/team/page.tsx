'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users, UserPlus, Settings, Crown, Shield, Eye, Briefcase, User } from 'lucide-react'
import { InviteUserDialog } from '@/components/team/InviteUserDialog'
import { TeamMembersList } from '@/components/team/TeamMembersList'
import { useAuth } from '@/contexts/AuthProvider'
import type { User } from '@/types/database'

export default function TeamPage() {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/team/members')
      
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }

      const result = await response.json()
      setTeamMembers(result.members || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
      setError('Failed to load team members')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4" />
      case 'admin':
        return <Shield className="w-4 h-4" />
      case 'manager':
        return <Briefcase className="w-4 h-4" />
      case 'agent':
        return <User className="w-4 h-4" />
      case 'viewer':
        return <Eye className="w-4 h-4" />
      default:
        return <User className="w-4 h-4" />
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-800 border-purple-200',
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      manager: 'bg-green-100 text-green-800 border-green-200',
      agent: 'bg-orange-100 text-orange-800 border-orange-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200'
    }

    return (
      <Badge variant="outline" className={colors[role as keyof typeof colors]}>
        <span className="flex items-center gap-1">
          {getRoleIcon(role)}
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      </Badge>
    )
  }

  const canManageTeam = user && ['owner', 'admin', 'manager'].includes(user.role)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your organization's team members and invitations
          </p>
        </div>
        {canManageTeam && (
          <InviteUserDialog onInviteSent={fetchTeamMembers} />
        )}
      </div>

      {/* Team Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => ['owner', 'admin'].includes(m.role)).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.role === 'manager').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agents</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => m.role === 'agent').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Current Team Members
          </CardTitle>
          <CardDescription>
            Active members of your organization
          </CardDescription>
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
              Loading team members...
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No team members found</h3>
              <p className="text-muted-foreground">
                Start building your team by inviting colleagues.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Joined</TableHead>
                    {canManageTeam && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.first_name || member.last_name 
                          ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
                          : 'No name set'
                        }
                        {member.id === user?.id && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        {getRoleBadge(member.role)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {member.last_active_at 
                            ? new Date(member.last_active_at).toLocaleDateString()
                            : 'Never'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      {canManageTeam && (
                        <TableCell>
                          {member.id !== user?.id && (
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Invitations */}
      {canManageTeam && (
        <TeamMembersList showInvitations={true} />
      )}
    </div>
  )
}
