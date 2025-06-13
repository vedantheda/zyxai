'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthProvider'
interface Client {
  id: string
  name: string
  email: string
  phone?: string
  status: string
  progress: number
  documents_count: number
  priority: string
  tax_year: number
  estimated_refund?: number
  last_activity: string
  assigned_to?: string
  assigned_staff_name?: string
}
interface PracticeStats {
  totalClients: number
  activeClients: number
  completedReturns: number
  pendingDocuments: number
  avgCompletionTime: number
  revenue: number
}
interface AdminDashboardData {
  practiceStats: PracticeStats
  recentClients: Client[]
  practice: {
    id: string
    name: string
    owner_id: string
  } | null
}
export function useAdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchAdminData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      // Get the user's tax practice
      const { data: practiceData, error: practiceError } = await supabase
        .from('tax_practices')
        .select('*')
        .eq('owner_id', user.id)
        .single()
      if (practiceError && practiceError.code !== 'PGRST116') {
        throw practiceError
      }
      if (!practiceData) {
        // No practice found, return empty data
        setData({
          practiceStats: {
            totalClients: 0,
            activeClients: 0,
            completedReturns: 0,
            pendingDocuments: 0,
            avgCompletionTime: 0,
            revenue: 0
          },
          recentClients: [],
          practice: null
        })
        setLoading(false)
        return
      }
      // Get all clients for this practice with staff assignments
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          staff_members!assigned_to (
            first_name,
            last_name
          )
        `)
        .eq('practice_id', practiceData.id)
        .order('last_activity', { ascending: false })
      if (clientsError) {
        throw clientsError
      }
      const clients = clientsData || []
      // Calculate practice statistics
      const totalClients = clients.length
      const activeClients = clients.filter(c =>
        ['onboarding', 'documents_pending', 'in_review'].includes(c.status)
      ).length
      const completedReturns = clients.filter(c =>
        ['completed', 'filed'].includes(c.status)
      ).length
      const pendingDocuments = clients.filter(c =>
        c.status === 'documents_pending'
      ).length
      // Calculate total revenue from estimated refunds (simplified)
      const revenue = clients
        .filter(c => c.estimated_refund)
        .reduce((sum, c) => sum + (c.estimated_refund * 0.15), 0) // Assume 15% fee
      const practiceStats: PracticeStats = {
        totalClients,
        activeClients,
        completedReturns,
        pendingDocuments,
        avgCompletionTime: 12, // Mock data for now
        revenue: Math.round(revenue)
      }
      // Format recent clients with staff names
      const recentClients: Client[] = clients.slice(0, 10).map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        status: client.status || 'onboarding',
        progress: client.progress || 0,
        documents_count: client.documents_count || 0,
        priority: client.priority || 'medium',
        tax_year: client.tax_year || 2024,
        estimated_refund: client.estimated_refund,
        last_activity: formatTimeAgo(client.last_activity),
        assigned_to: client.assigned_to,
        assigned_staff_name: client.staff_members
          ? `${client.staff_members.first_name} ${client.staff_members.last_name}`
          : 'Unassigned'
      }))
      setData({
        practiceStats,
        recentClients,
        practice: practiceData
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user?.id])
  useEffect(() => {
    fetchAdminData()
  }, [fetchAdminData])
  return {
    data,
    loading,
    error,
    refetch: fetchAdminData
  }
}
// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours} hours ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays} days ago`
  const diffInWeeks = Math.floor(diffInDays / 7)
  return `${diffInWeeks} weeks ago`
}
