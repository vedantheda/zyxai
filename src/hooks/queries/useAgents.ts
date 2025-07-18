/**
 * Agent Queries - React Query hooks for VAPI agents
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys, invalidateQueries } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'
import type { VapiAgent } from '@/stores/vapiStore'

// Fetch all agents for the current organization
export function useAgents() {
  const user = useAuthStore((state) => state.user)
  
  return useQuery({
    queryKey: queryKeys.agents.all,
    queryFn: async (): Promise<VapiAgent[]> => {
      if (!supabase || !user?.organization_id) {
        return []
      }
      
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('organization_id', user.organization_id)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw new Error(`Failed to fetch agents: ${error.message}`)
      }
      
      return data || []
    },
    enabled: !!user?.organization_id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Fetch a specific agent by ID
export function useAgent(agentId: string) {
  return useQuery({
    queryKey: queryKeys.agents.detail(agentId),
    queryFn: async (): Promise<VapiAgent | null> => {
      if (!supabase || !agentId) {
        return null
      }
      
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null // Agent not found
        }
        throw new Error(`Failed to fetch agent: ${error.message}`)
      }
      
      return data
    },
    enabled: !!agentId,
  })
}

// Create a new agent
export function useCreateAgent() {
  const queryClient = useQueryClient()
  const addToast = useNotificationStore((state) => state.addToast)
  const user = useAuthStore((state) => state.user)
  
  return useMutation({
    mutationFn: async (agentData: Omit<VapiAgent, 'id' | 'organization_id' | 'created_at' | 'updated_at'>): Promise<VapiAgent> => {
      if (!supabase || !user?.organization_id) {
        throw new Error('Authentication required')
      }
      
      const { data, error } = await supabase
        .from('ai_agents')
        .insert([{
          ...agentData,
          organization_id: user.organization_id,
        }])
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to create agent: ${error.message}`)
      }
      
      return data
    },
    onSuccess: (newAgent) => {
      // Invalidate and refetch agents
      invalidateQueries.agents()
      
      // Show success toast
      addToast({
        type: 'success',
        title: 'Agent Created',
        message: `${newAgent.name} has been created successfully.`,
      })
    },
    onError: (error: Error) => {
      // Show error toast
      addToast({
        type: 'error',
        title: 'Failed to Create Agent',
        message: error.message,
      })
    },
  })
}

// Update an existing agent
export function useUpdateAgent() {
  const queryClient = useQueryClient()
  const addToast = useNotificationStore((state) => state.addToast)
  
  return useMutation({
    mutationFn: async ({ 
      agentId, 
      updates 
    }: { 
      agentId: string
      updates: Partial<VapiAgent> 
    }): Promise<VapiAgent> => {
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
      
      const { data, error } = await supabase
        .from('ai_agents')
        .update(updates)
        .eq('id', agentId)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to update agent: ${error.message}`)
      }
      
      return data
    },
    onSuccess: (updatedAgent) => {
      // Update the specific agent in cache
      queryClient.setQueryData(
        queryKeys.agents.detail(updatedAgent.id),
        updatedAgent
      )
      
      // Invalidate agents list to ensure consistency
      invalidateQueries.agents()
      
      // Show success toast
      addToast({
        type: 'success',
        title: 'Agent Updated',
        message: `${updatedAgent.name} has been updated successfully.`,
      })
    },
    onError: (error: Error) => {
      // Show error toast
      addToast({
        type: 'error',
        title: 'Failed to Update Agent',
        message: error.message,
      })
    },
  })
}

// Delete an agent
export function useDeleteAgent() {
  const queryClient = useQueryClient()
  const addToast = useNotificationStore((state) => state.addToast)
  
  return useMutation({
    mutationFn: async (agentId: string): Promise<void> => {
      if (!supabase) {
        throw new Error('Database connection unavailable')
      }
      
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', agentId)
      
      if (error) {
        throw new Error(`Failed to delete agent: ${error.message}`)
      }
    },
    onSuccess: (_, agentId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: queryKeys.agents.detail(agentId)
      })
      
      // Invalidate agents list
      invalidateQueries.agents()
      
      // Show success toast
      addToast({
        type: 'success',
        title: 'Agent Deleted',
        message: 'The agent has been deleted successfully.',
      })
    },
    onError: (error: Error) => {
      // Show error toast
      addToast({
        type: 'error',
        title: 'Failed to Delete Agent',
        message: error.message,
      })
    },
  })
}

// Toggle agent active status
export function useToggleAgentStatus() {
  const updateAgent = useUpdateAgent()
  
  return useMutation({
    mutationFn: async ({ agentId, isActive }: { agentId: string, isActive: boolean }) => {
      return updateAgent.mutateAsync({
        agentId,
        updates: { is_active: isActive }
      })
    },
  })
}
