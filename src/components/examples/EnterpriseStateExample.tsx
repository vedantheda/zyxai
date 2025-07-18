/**
 * Enterprise State Management Example
 * Demonstrates how to use Zustand + React Query together
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, Settings, Bell, User } from 'lucide-react'

// Import our new stores and hooks
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useNotificationStore } from '@/stores/notificationStore'
import { useVapiStore } from '@/stores/vapiStore'
import { useAgents, useCreateAgent } from '@/hooks/queries/useAgents'
import { useNotifications, useUnreadNotificationsCount } from '@/hooks/queries/useNotifications'

export function EnterpriseStateExample() {
  // ===== ZUSTAND STORES =====
  
  // Auth store - global authentication state
  const { user, isAuthenticated, hasRole } = useAuthStore()
  
  // UI store - global UI state
  const { 
    sidebarOpen, 
    setSidebarOpen, 
    openModal, 
    closeModal, 
    isModalOpen,
    setGlobalLoading,
    globalLoading 
  } = useUIStore()
  
  // Notification store - global notification state
  const { 
    addToast, 
    preferences, 
    updatePreference 
  } = useNotificationStore()
  
  // VAPI store - domain-specific state
  const { 
    selectedAgent, 
    setSelectedAgent, 
    demoCallActive, 
    setDemoCallActive 
  } = useVapiStore()
  
  // ===== REACT QUERY HOOKS =====
  
  // Server state with caching, background refetching, etc.
  const { 
    data: agents = [], 
    isLoading: agentsLoading, 
    error: agentsError,
    refetch: refetchAgents 
  } = useAgents()
  
  const { 
    data: notifications = [], 
    isLoading: notificationsLoading 
  } = useNotifications()
  
  const { 
    data: unreadCount = 0 
  } = useUnreadNotificationsCount()
  
  // Mutations with optimistic updates and error handling
  const createAgentMutation = useCreateAgent()
  
  // ===== EVENT HANDLERS =====
  
  const handleCreateAgent = async () => {
    try {
      setGlobalLoading(true)
      
      await createAgentMutation.mutateAsync({
        name: `Agent ${agents.length + 1}`,
        description: 'Demo agent created from enterprise state example',
        agent_type: 'cold_calling',
        is_active: true,
        personality: {},
        voice_config: {},
        script_config: {},
        skills: [],
        performance_metrics: {},
      })
      
      addToast({
        type: 'success',
        title: 'Agent Created!',
        message: 'Your new agent has been created successfully.',
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Create Agent',
        message: 'Something went wrong. Please try again.',
      })
    } finally {
      setGlobalLoading(false)
    }
  }
  
  const handleToggleNotifications = () => {
    updatePreference('inApp', 'calls', !preferences.inApp.calls)
    
    addToast({
      type: 'info',
      title: 'Preferences Updated',
      message: `Call notifications ${preferences.inApp.calls ? 'disabled' : 'enabled'}.`,
    })
  }
  
  const handleStartDemoCall = () => {
    setDemoCallActive(true)
    
    addToast({
      type: 'info',
      title: 'Demo Call Started',
      message: 'Starting demo call with selected agent...',
    })
    
    // Simulate demo call ending after 5 seconds
    setTimeout(() => {
      setDemoCallActive(false)
      addToast({
        type: 'success',
        title: 'Demo Call Completed',
        message: 'Demo call finished successfully!',
      })
    }, 5000)
  }
  
  // ===== RENDER =====
  
  if (!isAuthenticated()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please sign in to view this enterprise state management example.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Enterprise State Management Demo
          </CardTitle>
          <CardDescription>
            This component demonstrates how Zustand and React Query work together 
            for enterprise-grade state management.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* User Info from Auth Store */}
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm">
              Welcome, {user?.first_name || user?.email}
            </span>
            <Badge variant={hasRole('admin') ? 'default' : 'secondary'}>
              {user?.role}
            </Badge>
          </div>
          
          {/* UI State Controls */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              Sidebar: {sidebarOpen ? 'Open' : 'Closed'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => openModal('createAgent')}
            >
              Open Modal
            </Button>
            
            {isModalOpen('createAgent') && (
              <Button 
                variant="outline" 
                onClick={() => closeModal('createAgent')}
              >
                Close Modal
              </Button>
            )}
          </div>
          
          {/* Global Loading State */}
          {globalLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Global loading active...
            </div>
          )}
          
        </CardContent>
      </Card>
      
      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications ({unreadCount} unread)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleToggleNotifications}
            >
              Call Notifications: {preferences.inApp.calls ? 'On' : 'Off'}
            </Button>
          </div>
          
          {notificationsLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notifications...
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 3).map((notification) => (
                <div 
                  key={notification.id}
                  className="p-2 border rounded text-sm"
                >
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-muted-foreground">{notification.message}</div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No notifications yet.
                </div>
              )}
            </div>
          )}
          
        </CardContent>
      </Card>
      
      {/* Agents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            VAPI Agents ({agents.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          <div className="flex gap-2">
            <Button 
              onClick={handleCreateAgent}
              disabled={createAgentMutation.isPending}
            >
              {createAgentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Demo Agent'
              )}
            </Button>
            
            {selectedAgent && (
              <Button 
                variant="outline"
                onClick={handleStartDemoCall}
                disabled={demoCallActive}
              >
                {demoCallActive ? 'Demo Call Active...' : 'Start Demo Call'}
              </Button>
            )}
          </div>
          
          {agentsLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading agents...
            </div>
          ) : agentsError ? (
            <div className="text-sm text-red-600">
              Error loading agents: {agentsError.message}
            </div>
          ) : (
            <div className="grid gap-2">
              {agents.map((agent) => (
                <div 
                  key={agent.id}
                  className={`p-2 border rounded cursor-pointer transition-colors ${
                    selectedAgent?.id === agent.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedAgent(agent)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {agent.agent_type}
                      </div>
                    </div>
                    <Badge variant={agent.is_active ? 'default' : 'secondary'}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
              {agents.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No agents yet. Create one to get started!
                </div>
              )}
            </div>
          )}
          
        </CardContent>
      </Card>
      
    </div>
  )
}
