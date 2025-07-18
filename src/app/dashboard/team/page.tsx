'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Users, UserPlus, Settings, Crown, Shield, Eye, Briefcase, User, RefreshCw } from 'lucide-react'
import { InviteUserDialog } from '@/components/team/InviteUserDialog'
import { TeamMembersList } from '@/components/team/TeamMembersList'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { apiClient } from '@/lib/api-client'
import type { User } from '@/types/database'

export default function TeamPage() {
  const { user, loading: authLoading, needsProfileCompletion, completeProfile } = useAuth()
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true)
      setError('')

      console.log('🔍 Fetching team members...')

      // Use the authenticated API client
      const response = await apiClient.get('/api/team/members')

      console.log('📡 Team members response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('🚨 Team members API error:', errorData)

        if (response.status === 404 && errorData.error?.includes('profile')) {
          throw new Error('Please complete your profile setup to access team management.')
        }

        throw new Error(errorData.error || `Failed to fetch team members (${response.status})`)
      }

      const result = await response.json()
      console.log('✅ Team members data received:', result)

      const members = result.members || []

      // Ensure current user is included in the list if not already present
      if (user && !members.find(m => m.id === user.id)) {
        members.unshift(user)
      }

      setTeamMembers(members)
      console.log('✅ Team members set:', members.length, 'members')
    } catch (error: any) {
      console.error('🚨 Error fetching team members:', error)
      setError(error.message || 'Failed to load team members. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    console.log('🔍 Team Page: Auth state changed:', {
      authLoading,
      needsProfileCompletion,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      userOrgId: user?.organization_id
    })

    // Wait for auth to complete and user to be available
    if (!authLoading && !needsProfileCompletion && user) {
      console.log('✅ Team Page: Conditions met, fetching team members')
      fetchTeamMembers()
    } else {
      console.log('⏳ Team Page: Waiting for auth completion:', {
        authLoading,
        needsProfileCompletion,
        hasUser: !!user,
        reason: !user ? 'No user' : authLoading ? 'Auth loading' : needsProfileCompletion ? 'Profile incomplete' : 'Unknown'
      })
    }
  }, [authLoading, needsProfileCompletion, user])

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

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span className="text-lg">Loading your team...</span>
        </div>
      </div>
    )
  }

  // Show sign-in prompt if no user
  if (!authLoading && !user) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-6" />
          <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            You need to sign in to access team management features.
          </p>
          <Button onClick={() => window.location.href = '/signin'}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  // Show profile completion message if needed
  if (needsProfileCompletion) {
    return (
      <div className="p-6 space-y-6 bg-background min-h-screen">
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-6" />
          <h3 className="text-xl font-semibold mb-2">Complete Your Profile</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Please complete your profile setup to access team management features.
          </p>
          <Button onClick={async () => {
            await completeProfile()
            fetchTeamMembers()
          }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Setup
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage your organization's team members and invitations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTeamMembers}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canManageTeam && (
            <InviteUserDialog onInviteSent={fetchTeamMembers} />
          )}
        </div>
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
            <p className="text-xs text-muted-foreground">
              {teamMembers.filter(m => m.last_active_at && new Date(m.last_active_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} active this week
            </p>
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
            <p className="text-xs text-muted-foreground">
              Full access
            </p>
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
            <p className="text-xs text-muted-foreground">
              Team management
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agents</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.filter(m => ['agent', 'viewer'].includes(m.role)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Operational roles
            </p>
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
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTeamMembers}
                  disabled={isLoading}
                >
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading team members...
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground/50 mb-6" />
              <h3 className="text-xl font-semibold mb-2">Your team is just getting started</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You're currently the only member of this organization. Invite colleagues to collaborate and grow your team.
              </p>
              {canManageTeam && (
                <InviteUserDialog
                  onInviteSent={fetchTeamMembers}
                  trigger={
                    <Button size="lg">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Your First Team Member
                    </Button>
                  }
                />
              )}
              {!canManageTeam && (
                <p className="text-sm text-muted-foreground">
                  Contact your administrator to invite new team members.
                </p>
              )}
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
