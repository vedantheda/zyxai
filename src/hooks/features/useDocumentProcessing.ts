'use client'
import { useState, useCallback } from 'react'
import { DocumentProcessingResult } from '@/lib/ai-processing/DocumentProcessor'
export interface ProcessingOptions {
  skipOCR?: boolean
  skipAnalysis?: boolean
  skipAutoFill?: boolean
  priority?: 'low' | 'normal' | 'high'
}
export interface ProcessingStatus {
  status: string
  message: string
  progress: number
  estimatedTimeRemaining?: number
}
export function useDocumentProcessing() {
  const [processing, setProcessing] = useState<Record<string, boolean>>({})
  const [results, setResults] = useState<Record<string, DocumentProcessingResult>>({})
  const [statuses, setStatuses] = useState<Record<string, ProcessingStatus>>({})
  const [error, setError] = useState<string | null>(null)
  /**
   * Process a single document
   */
  const processDocument = useCallback(async (
    documentId: string,
    clientId?: string,
    options: ProcessingOptions = {}
  ) => {
    try {
      setError(null)
      setProcessing(prev => ({ ...prev, [documentId]: true }))
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          clientId,
          options
        })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Processing failed')
      }
      const result = await response.json()
      // Start polling for status updates
      startStatusPolling(documentId)
      return { success: true, data: result }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed'
      setError(errorMessage)
      setProcessing(prev => ({ ...prev, [documentId]: false }))
      return { success: false, error: errorMessage }
    }
  }, [])
  /**
   * Process multiple documents in batch
   */
  const processBatch = useCallback(async (
    documentIds: string[],
    clientId?: string,
    options: ProcessingOptions = {}
  ) => {
    try {
      setError(null)
      // Mark all documents as processing
      const processingUpdate = documentIds.reduce((acc, id) => {
        acc[id] = true
        return acc
      }, {} as Record<string, boolean>)
      setProcessing(prev => ({ ...prev, ...processingUpdate }))
      const response = await fetch('/api/documents/process-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds,
          clientId,
          options
        })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Batch processing failed')
      }
      const result = await response.json()
      // Start polling for status updates for all documents
      documentIds.forEach(documentId => {
        startStatusPolling(documentId)
      })
      return { success: true, data: result }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch processing failed'
      setError(errorMessage)
      // Reset processing status for all documents
      const processingUpdate = documentIds.reduce((acc, id) => {
        acc[id] = false
        return acc
      }, {} as Record<string, boolean>)
      setProcessing(prev => ({ ...prev, ...processingUpdate }))
      return { success: false, error: errorMessage }
    }
  }, [])
  /**
   * Get processing status for a document
   */
  const getProcessingStatus = useCallback(async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/process?documentId=${documentId}`)
      if (!response.ok) {
        throw new Error('Failed to get processing status')
      }
      const status = await response.json()
      setStatuses(prev => ({ ...prev, [documentId]: status }))
      return status
    } catch (err) {
      return null
    }
  }, [])
  /**
   * Start polling for status updates
   */
  const startStatusPolling = useCallback((documentId: string) => {
    const pollInterval = setInterval(async () => {
      const status = await getProcessingStatus(documentId)
      if (status) {
        // Stop polling if processing is complete or failed
        if (status.status === 'completed' || status.status === 'failed' || status.progress >= 100) {
          clearInterval(pollInterval)
          setProcessing(prev => ({ ...prev, [documentId]: false }))
          // If completed successfully, the result should be in the document record
          if (status.status === 'completed') {
            // Could fetch the full result here if needed
          }
        }
      }
    }, 2000) // Poll every 2 seconds
    // Clean up after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      setProcessing(prev => ({ ...prev, [documentId]: false }))
    }, 5 * 60 * 1000)
  }, [getProcessingStatus])
  /**
   * Check if a document is currently being processed
   */
  const isProcessing = useCallback((documentId: string) => {
    return processing[documentId] || false
  }, [processing])
  /**
   * Get processing result for a document
   */
  const getResult = useCallback((documentId: string) => {
    return results[documentId] || null
  }, [results])
  /**
   * Get current status for a document
   */
  const getStatus = useCallback((documentId: string) => {
    return statuses[documentId] || null
  }, [statuses])
  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  /**
   * Reset processing state for a document
   */
  const resetDocument = useCallback((documentId: string) => {
    setProcessing(prev => {
      const updated = { ...prev }
      delete updated[documentId]
      return updated
    })
    setResults(prev => {
      const updated = { ...prev }
      delete updated[documentId]
      return updated
    })
    setStatuses(prev => {
      const updated = { ...prev }
      delete updated[documentId]
      return updated
    })
  }, [])
  /**
   * Get processing statistics
   */
  const getProcessingStats = useCallback(() => {
    const totalDocuments = Object.keys(processing).length
    const processingCount = Object.values(processing).filter(Boolean).length
    const completedCount = Object.values(statuses).filter(s => s.status === 'completed').length
    const failedCount = Object.values(statuses).filter(s => s.status === 'failed').length
    return {
      total: totalDocuments,
      processing: processingCount,
      completed: completedCount,
      failed: failedCount,
      pending: totalDocuments - processingCount - completedCount - failedCount
    }
  }, [processing, statuses])
  return {
    // Actions
    processDocument,
    processBatch,
    getProcessingStatus,
    // State queries
    isProcessing,
    getResult,
    getStatus,
    getProcessingStats,
    // State
    processing,
    results,
    statuses,
    error,
    // Utilities
    clearError,
    resetDocument
  }
}
