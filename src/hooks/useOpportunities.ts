'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthProvider'

interface Pipeline {
  id: string
  name: string
  stages: Stage[]
  isDefault?: boolean
}

interface Stage {
  id: string
  name: string
  probability: number
  color: string
  order: number
  isClosedWon?: boolean
  isClosedLost?: boolean
}

interface Opportunity {
  id: string
  name: string
  amount: number
  currency: string
  stage: Stage
  pipeline: Pipeline
  contact: {
    id: string
    name: string
    email: string
    company?: string
  }
  owner: {
    id: string
    name: string
    email: string
  }
  closeDate: string
  probability: number
  source: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  createdAt: string
  updatedAt: string
  hubspotId?: string
}

interface OpportunityFilters {
  search: string
  pipeline: string
  stage: string
  owner: string
  source: string
  priority: string
  dateRange: string
  tags: string[]
}

export function useOpportunities() {
  const { user } = useAuth()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load pipelines
  const loadPipelines = async () => {
    try {
      const response = await fetch(`/api/opportunities/pipelines?organizationId=${user?.organization_id}`)
      const data = await response.json()
      
      if (data.success) {
        setPipelines(data.pipelines)
      } else {
        setError(data.error || 'Failed to load pipelines')
      }
    } catch (err) {
      console.error('Failed to load pipelines:', err)
      setError('Failed to load pipelines')
    }
  }

  // Load opportunities
  const loadOpportunities = async (filters: Partial<OpportunityFilters> = {}) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        organizationId: user?.organization_id || '',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value && value !== '')
        )
      })

      const response = await fetch(`/api/opportunities?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setOpportunities(data.deals)
      } else {
        setError(data.error || 'Failed to load opportunities')
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err)
      setError('Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }

  // Create opportunity
  const createOpportunity = async (opportunityData: any) => {
    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...opportunityData,
          organizationId: user?.organization_id
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setOpportunities(prev => [data.deal, ...prev])
        return { success: true, deal: data.deal }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Failed to create opportunity:', err)
      return { success: false, error: 'Failed to create opportunity' }
    }
  }

  // Move opportunity to different stage
  const moveOpportunity = async (opportunityId: string, newStageId: string) => {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stageId: newStageId,
          organizationId: user?.organization_id
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Update the opportunity in the local state
        setOpportunities(prev => 
          prev.map(opp => 
            opp.id === opportunityId 
              ? { ...opp, stage: { ...opp.stage, id: newStageId }, updatedAt: data.deal.updatedAt }
              : opp
          )
        )
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Failed to move opportunity:', err)
      return { success: false, error: 'Failed to move opportunity' }
    }
  }

  // Update opportunity
  const updateOpportunity = async (opportunityId: string, updates: Partial<Opportunity>) => {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updates,
          organizationId: user?.organization_id
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setOpportunities(prev => 
          prev.map(opp => 
            opp.id === opportunityId 
              ? { ...opp, ...data.deal }
              : opp
          )
        )
        return { success: true, deal: data.deal }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Failed to update opportunity:', err)
      return { success: false, error: 'Failed to update opportunity' }
    }
  }

  // Delete opportunity
  const deleteOpportunity = async (opportunityId: string) => {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: user?.organization_id
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setOpportunities(prev => prev.filter(opp => opp.id !== opportunityId))
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      console.error('Failed to delete opportunity:', err)
      return { success: false, error: 'Failed to delete opportunity' }
    }
  }

  // Refresh data
  const refresh = () => {
    loadPipelines()
    loadOpportunities()
  }

  // Load initial data
  useEffect(() => {
    if (user?.organization_id) {
      loadPipelines()
      loadOpportunities()
    }
  }, [user?.organization_id])

  return {
    opportunities,
    pipelines,
    loading,
    error,
    loadOpportunities,
    createOpportunity,
    moveOpportunity,
    updateOpportunity,
    deleteOpportunity,
    refresh,
    setError
  }
}
