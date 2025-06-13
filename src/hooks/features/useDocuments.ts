import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useSessionSync } from './useSessionSync'
// Removed complex caching - using simple React state
export interface Document {
  id: string
  user_id: string
  client_id: string
  name: string
  type: string
  size: number
  category: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  ai_analysis_status: 'pending' | 'processing' | 'completed' | 'error'
  ai_analysis_result?: any
  file_url?: string
  description?: string
  tags?: string[]
  is_sensitive?: boolean
  uploaded_by?: string
  reviewed_by?: string
  reviewed_at?: string
  version?: number
  parent_document_id?: string
  metadata?: any
  processing_status: string
  created_at: string
  updated_at: string
}
export interface DocumentCategory {
  id: string
  name: string
  description?: string
  icon?: string
  color: string
  is_required: boolean
  sort_order: number
  parent_category_id?: string
  created_at: string
  updated_at: string
}
export interface DocumentCollectionSession {
  id: string
  client_id: string
  user_id: string
  status: string
  progress_percentage: number
  total_required_documents: number
  completed_documents: number
  last_activity?: string
  deadline?: string
  notes?: string
  created_at: string
  updated_at: string
}
export interface DocumentChecklist {
  id: string
  client_id: string
  user_id: string
  document_type: string
  document_category: string
  is_required: boolean
  is_completed: boolean
  description?: string
  instructions?: string
  due_date?: string
  completed_at?: string
  priority: string
  reminder_sent_at?: string
  reminder_count: number
  document_id?: string
  created_at: string
  updated_at: string
}
export interface DocumentUploadResult {
  success: boolean
  document?: Document
  error?: string
}
export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isAuthenticated } = useSessionSync()
  // Fetch user's documents
  const fetchDocuments = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return
    // Check cache first
    const cacheKey = `documents-${user.id}`
    const cached = null // Removed complex caching
    if (cached) {
      setDocuments(cached)
      setLoading(false)
      setError(null)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (fetchError) {
        throw fetchError
      }
      const documentsData = data || []
      setDocuments(documentsData)
      // Removed complex caching
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, user?.id])
  // Upload document to Supabase Storage and create database record
  const uploadDocument = useCallback(async (
    file: File,
    category: string,
    clientId?: string
  ): Promise<DocumentUploadResult> => {
    if (!isAuthenticated || !user?.id) {
      return { success: false, error: 'User not authenticated' }
    }
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)
      if (uploadError) {
        throw uploadError
      }
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)
      // For individual taxpayers, we need to ensure they have a client record
      let finalClientId = clientId
      if (!finalClientId) {
        // Check if user has a client record, create one if not
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single()
        if (existingClient) {
          finalClientId = existingClient.id
        } else {
          // Create a client record for the individual taxpayer
          const { data: newClient, error: clientError } = await supabase
            .from('clients')
            .insert({
              user_id: user.id,
              name: 'Individual Taxpayer', // We'll update this from profile later
              email: user.email || '',
              type: 'individual'
            })
            .select('id')
            .single()
          if (clientError) {
            throw new Error('Failed to create client record')
          }
          finalClientId = newClient.id
        }
      }
      // Create document record in database
      const documentData = {
        user_id: user.id,
        client_id: finalClientId,
        name: file.name,
        type: file.type,
        size: file.size,
        category,
        status: 'pending' as const,
        ai_analysis_status: 'pending' as const,
        file_url: publicUrl
      }
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single()
      if (dbError) {
        // If database insert fails, clean up uploaded file
        await supabase.storage.from('documents').remove([fileName])
        throw dbError
      }
      // Update local state
      setDocuments(prev => [document, ...prev])
      return { success: true, document }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to upload document'
      }
    }
  }, [isAuthenticated, user?.id])
  // Delete document
  const deleteDocument = useCallback(async (documentId: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) return false
    try {
      // Get document details first
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()
      if (fetchError) {
        throw fetchError
      }
      // Delete from database
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id)
      if (deleteError) {
        throw deleteError
      }
      // Delete from storage if file_url exists
      if (document?.file_url) {
        const fileName = document.file_url.split('/').pop()
        if (fileName) {
          await supabase.storage.from('documents').remove([`${user.id}/${fileName}`])
        }
      }
      // Update local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      return true
    } catch (err) {
      return false
    }
  }, [isAuthenticated, user?.id])
  // Update document status
  const updateDocumentStatus = useCallback(async (
    documentId: string,
    status: Document['status'],
    aiAnalysisStatus?: Document['ai_analysis_status'],
    aiAnalysisResult?: any
  ): Promise<boolean> => {
    if (!isAuthenticated || !user?.id) return false
    try {
      const updateData: any = { status }
      if (aiAnalysisStatus) updateData.ai_analysis_status = aiAnalysisStatus
      if (aiAnalysisResult) updateData.ai_analysis_result = aiAnalysisResult
      const { error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId)
        .eq('user_id', user.id)
      if (error) {
        throw error
      }
      // Update local state
      setDocuments(prev => prev.map(doc =>
        doc.id === documentId
          ? { ...doc, ...updateData }
          : doc
      ))
      return true
    } catch (err) {
      return false
    }
  }, [isAuthenticated, user?.id])
  // Auto-categorize document based on filename
  const categorizeDocument = useCallback((filename: string): string => {
    const name = filename.toLowerCase()
    if (name.includes('w2') || name.includes('w-2')) return 'w2'
    if (name.includes('1099')) return '1099'
    if (name.includes('receipt') || name.includes('expense')) return 'receipts'
    if (name.includes('bank') || name.includes('statement')) return 'bank-statements'
    if (name.includes('tax') || name.includes('return') || name.includes('1040')) return 'previous-return'
    return 'other'
  }, [])
  // Get documents by category
  const getDocumentsByCategory = useCallback((category: string) => {
    return documents.filter(doc => doc.category === category)
  }, [documents])
  // Get document statistics
  const getDocumentStats = useCallback(() => {
    const total = documents.length
    const completed = documents.filter(doc => doc.status === 'completed').length
    const processing = documents.filter(doc => doc.status === 'processing').length
    const pending = documents.filter(doc => doc.status === 'pending').length
    const errors = documents.filter(doc => doc.status === 'error').length
    return {
      total,
      completed,
      processing,
      pending,
      errors,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    }
  }, [documents])
  // Fetch documents on mount and when user changes
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])
  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    updateDocumentStatus,
    categorizeDocument,
    getDocumentsByCategory,
    getDocumentStats,
    refetch: fetchDocuments
  }
}
export function useDocumentCategories() {
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('document_categories')
          .select('*')
          .order('sort_order', { ascending: true })
        if (error) throw error
        setCategories(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories')
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])
  return { categories, loading, error }
}
export function useDocumentCollectionSession(clientId: string) {
  const { user, isAuthenticated } = useSessionSync()
  const [session, setSession] = useState<DocumentCollectionSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const fetchSession = async () => {
      if (!isAuthenticated || !user || !clientId) return
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('document_collection_sessions')
          .select('*')
          .eq('client_id', clientId)
          .eq('user_id', user.id)
          .single()
        if (error && error.code !== 'PGRST116') throw error
        setSession(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch session')
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [user, clientId])
  return { session, loading, error }
}
export function useDocumentChecklist(clientId: string) {
  const { user, isAuthenticated } = useSessionSync()
  const [checklist, setChecklist] = useState<DocumentChecklist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchChecklist = async () => {
    if (!isAuthenticated || !user || !clientId) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('document_checklists')
        .select('*')
        .eq('client_id', clientId)
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true })
      if (error) throw error
      setChecklist(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch checklist')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchChecklist()
  }, [user, clientId])
  const updateChecklistItem = async (id: string, updates: Partial<DocumentChecklist>) => {
    if (!isAuthenticated || !user) throw new Error('User not authenticated')
    const { data, error } = await supabase
      .from('document_checklists')
      .update({
        ...updates,
        completed_at: updates.is_completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    setChecklist(prev => prev.map(item => item.id === id ? data : item))
    return data
  }
  return {
    checklist,
    loading,
    error,
    refetch: fetchChecklist,
    updateChecklistItem,
  }
}
