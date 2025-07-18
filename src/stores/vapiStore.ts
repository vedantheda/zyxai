/**
 * VAPI Store - Zustand
 * Manages VAPI agents, calls, and voice AI configurations
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

// Types
export interface VapiAgent {
  id: string
  organization_id: string
  name: string
  description?: string
  avatar_url?: string
  agent_type: 'cold_calling' | 'appointment_scheduling' | 'follow_up' | 'customer_service' | 'lead_qualification' | 'survey' | 'custom'
  personality?: any
  voice_config?: any
  script_config?: any
  is_active: boolean
  performance_metrics?: any
  created_at: string
  updated_at: string
}

export interface VapiCall {
  id: string
  agent_id: string
  contact_id: string
  phone_number: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  outcome?: string
  duration_seconds?: number
  cost_cents?: number
  recording_url?: string
  transcript?: any
  summary?: string
  sentiment_score?: number
  started_at?: string
  ended_at?: string
  created_at: string
}

export interface VapiConfiguration {
  apiKey: string
  defaultVoice: string
  defaultModel: string
  webhookUrl?: string
  enableRecording: boolean
  enableTranscription: boolean
  enableAnalysis: boolean
}

export interface VapiState {
  // Agents
  agents: VapiAgent[]
  selectedAgent: VapiAgent | null
  agentsLoading: boolean
  
  // Calls
  calls: VapiCall[]
  activeCalls: VapiCall[]
  callsLoading: boolean
  
  // Configuration
  configuration: VapiConfiguration | null
  configLoading: boolean
  
  // Demo call state
  demoCallActive: boolean
  demoCallStatus: string
  
  // Actions
  setAgents: (agents: VapiAgent[]) => void
  addAgent: (agent: VapiAgent) => void
  updateAgent: (agentId: string, updates: Partial<VapiAgent>) => void
  removeAgent: (agentId: string) => void
  setSelectedAgent: (agent: VapiAgent | null) => void
  
  setCalls: (calls: VapiCall[]) => void
  addCall: (call: VapiCall) => void
  updateCall: (callId: string, updates: Partial<VapiCall>) => void
  
  setConfiguration: (config: VapiConfiguration) => void
  
  setDemoCallActive: (active: boolean) => void
  setDemoCallStatus: (status: string) => void
  
  // Async actions
  fetchAgents: () => Promise<void>
  fetchCalls: () => Promise<void>
  fetchConfiguration: () => Promise<void>
  
  createAgent: (agentData: Omit<VapiAgent, 'id' | 'created_at' | 'updated_at'>) => Promise<VapiAgent | null>
  deleteAgent: (agentId: string) => Promise<boolean>
  
  startDemoCall: (agentId: string, phoneNumber: string) => Promise<boolean>
  endDemoCall: (callId: string) => Promise<boolean>
  
  // Utilities
  getAgentById: (agentId: string) => VapiAgent | undefined
  getCallById: (callId: string) => VapiCall | undefined
  getActiveCallsForAgent: (agentId: string) => VapiCall[]
  reset: () => void
}

// Initial state
const initialState = {
  agents: [],
  selectedAgent: null,
  agentsLoading: false,
  calls: [],
  activeCalls: [],
  callsLoading: false,
  configuration: null,
  configLoading: false,
  demoCallActive: false,
  demoCallStatus: 'idle',
}

export const useVapiStore = create<VapiState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Agent actions
        setAgents: (agents) => 
          set({ agents }, false, 'setAgents'),
        
        addAgent: (agent) => 
          set((state) => ({
            agents: [...state.agents, agent]
          }), false, 'addAgent'),
        
        updateAgent: (agentId, updates) => 
          set((state) => ({
            agents: state.agents.map(agent =>
              agent.id === agentId ? { ...agent, ...updates } : agent
            )
          }), false, 'updateAgent'),
        
        removeAgent: (agentId) => 
          set((state) => ({
            agents: state.agents.filter(agent => agent.id !== agentId),
            selectedAgent: state.selectedAgent?.id === agentId ? null : state.selectedAgent
          }), false, 'removeAgent'),
        
        setSelectedAgent: (selectedAgent) => 
          set({ selectedAgent }, false, 'setSelectedAgent'),
        
        // Call actions
        setCalls: (calls) => {
          const activeCalls = calls.filter(call => 
            call.status === 'in_progress' || call.status === 'scheduled'
          )
          set({ calls, activeCalls }, false, 'setCalls')
        },
        
        addCall: (call) => 
          set((state) => {
            const calls = [...state.calls, call]
            const activeCalls = calls.filter(c => 
              c.status === 'in_progress' || c.status === 'scheduled'
            )
            return { calls, activeCalls }
          }, false, 'addCall'),
        
        updateCall: (callId, updates) => 
          set((state) => {
            const calls = state.calls.map(call =>
              call.id === callId ? { ...call, ...updates } : call
            )
            const activeCalls = calls.filter(c => 
              c.status === 'in_progress' || c.status === 'scheduled'
            )
            return { calls, activeCalls }
          }, false, 'updateCall'),
        
        // Configuration actions
        setConfiguration: (configuration) => 
          set({ configuration }, false, 'setConfiguration'),
        
        // Demo call actions
        setDemoCallActive: (demoCallActive) => 
          set({ demoCallActive }, false, 'setDemoCallActive'),
        
        setDemoCallStatus: (demoCallStatus) => 
          set({ demoCallStatus }, false, 'setDemoCallStatus'),
        
        // Async actions
        fetchAgents: async () => {
          if (!supabase) return
          
          try {
            set({ agentsLoading: true }, false, 'fetchAgents:start')
            
            const { data, error } = await supabase
              .from('ai_agents')
              .select('*')
              .order('created_at', { ascending: false })
            
            if (error) throw error
            
            if (data) {
              set({ agents: data, agentsLoading: false }, false, 'fetchAgents:success')
            }
          } catch (error) {
            console.error('Failed to fetch agents:', error)
            set({ agentsLoading: false }, false, 'fetchAgents:error')
          }
        },
        
        fetchCalls: async () => {
          if (!supabase) return
          
          try {
            set({ callsLoading: true }, false, 'fetchCalls:start')
            
            const { data, error } = await supabase
              .from('calls')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(100)
            
            if (error) throw error
            
            if (data) {
              const calls = data as VapiCall[]
              const activeCalls = calls.filter(call => 
                call.status === 'in_progress' || call.status === 'scheduled'
              )
              set({ calls, activeCalls, callsLoading: false }, false, 'fetchCalls:success')
            }
          } catch (error) {
            console.error('Failed to fetch calls:', error)
            set({ callsLoading: false }, false, 'fetchCalls:error')
          }
        },
        
        fetchConfiguration: async () => {
          // This would fetch VAPI configuration from your backend
          // For now, we'll use a placeholder
          set({ configLoading: true }, false, 'fetchConfiguration:start')
          
          // Simulate API call
          setTimeout(() => {
            set({
              configuration: {
                apiKey: process.env.NEXT_PUBLIC_VAPI_API_KEY || '',
                defaultVoice: 'en-US-JennyNeural',
                defaultModel: 'gpt-4',
                enableRecording: true,
                enableTranscription: true,
                enableAnalysis: true,
              },
              configLoading: false
            }, false, 'fetchConfiguration:success')
          }, 1000)
        },
        
        createAgent: async (agentData) => {
          if (!supabase) return null
          
          try {
            const { data, error } = await supabase
              .from('ai_agents')
              .insert([agentData])
              .select()
              .single()
            
            if (error) throw error
            
            if (data) {
              const newAgent = data as VapiAgent
              get().addAgent(newAgent)
              return newAgent
            }
            
            return null
          } catch (error) {
            console.error('Failed to create agent:', error)
            return null
          }
        },
        
        deleteAgent: async (agentId) => {
          if (!supabase) return false
          
          try {
            const { error } = await supabase
              .from('ai_agents')
              .delete()
              .eq('id', agentId)
            
            if (error) throw error
            
            get().removeAgent(agentId)
            return true
          } catch (error) {
            console.error('Failed to delete agent:', error)
            return false
          }
        },
        
        startDemoCall: async (agentId, phoneNumber) => {
          // This would integrate with VAPI to start a demo call
          try {
            set({ demoCallActive: true, demoCallStatus: 'connecting' }, false, 'startDemoCall')
            
            // Simulate demo call
            setTimeout(() => {
              set({ demoCallStatus: 'connected' }, false, 'demoCall:connected')
            }, 2000)
            
            return true
          } catch (error) {
            console.error('Failed to start demo call:', error)
            set({ demoCallActive: false, demoCallStatus: 'error' }, false, 'startDemoCall:error')
            return false
          }
        },
        
        endDemoCall: async (callId) => {
          try {
            set({ demoCallStatus: 'ending' }, false, 'endDemoCall')
            
            // Simulate ending call
            setTimeout(() => {
              set({ 
                demoCallActive: false, 
                demoCallStatus: 'idle' 
              }, false, 'endDemoCall:complete')
            }, 1000)
            
            return true
          } catch (error) {
            console.error('Failed to end demo call:', error)
            return false
          }
        },
        
        // Utilities
        getAgentById: (agentId) => 
          get().agents.find(agent => agent.id === agentId),
        
        getCallById: (callId) => 
          get().calls.find(call => call.id === callId),
        
        getActiveCallsForAgent: (agentId) => 
          get().activeCalls.filter(call => call.agent_id === agentId),
        
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'zyxai-vapi-store',
        partialize: (state) => ({
          selectedAgent: state.selectedAgent,
          configuration: state.configuration,
        }),
      }
    ),
    {
      name: 'vapi-store',
    }
  )
)
