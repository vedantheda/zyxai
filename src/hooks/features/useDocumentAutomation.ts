import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthProvider'
import { useDocuments } from './useSupabaseData'
export interface DocumentRequirement {
  id: string
  category: string
  name: string
  description: string
  required: boolean
  examples: string[]
  deadline?: string
  priority: 'high' | 'medium' | 'low'
}
export interface AutomatedTask {
  id: string
  title: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  status: 'not_started' | 'in_progress' | 'completed'
  due_date?: string
  document_category?: string
}
export function useDocumentAutomation() {
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([])
  const [automatedTasks, setAutomatedTasks] = useState<AutomatedTask[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const isAuthenticated = !!user
  const { documents } = useDocuments()
  // Simple function to get documents by category
  const getDocumentsByCategory = useCallback((category: string) => {
    if (!documents || !Array.isArray(documents)) return []
    return documents.filter(doc => doc.category === category)
  }, [documents])
  // Default document requirements for individual taxpayers
  const defaultRequirements: DocumentRequirement[] = [
    {
      id: 'w2-forms',
      category: 'w2',
      name: 'W-2 Forms',
      description: 'Wage and tax statements from all employers',
      required: true,
      examples: ['W-2 from ABC Company', 'W-2 from XYZ Corp'],
      priority: 'high'
    },
    {
      id: '1099-forms',
      category: '1099',
      name: '1099 Forms',
      description: 'Income statements for freelance/contract work',
      required: false,
      examples: ['1099-NEC', '1099-MISC', '1099-INT', '1099-DIV'],
      priority: 'medium'
    },
    {
      id: 'previous-return',
      category: 'previous-return',
      name: 'Previous Tax Return',
      description: 'Last year\'s tax return for reference',
      required: true,
      examples: ['2023 Tax Return (Form 1040)'],
      priority: 'high'
    },
    {
      id: 'receipts-expenses',
      category: 'receipts',
      name: 'Receipts & Expenses',
      description: 'Deductible expenses and charitable donations',
      required: false,
      examples: ['Business receipts', 'Donation receipts', 'Medical bills'],
      priority: 'low'
    },
    {
      id: 'bank-statements',
      category: 'bank-statements',
      name: 'Bank Statements',
      description: 'Monthly statements for verification',
      required: false,
      examples: ['Checking statements', 'Savings statements'],
      priority: 'low'
    }
  ]
  // Generate automated tasks based on missing documents
  const generateAutomatedTasks = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return
    try {
      const missingDocuments = requirements.filter(req => {
        const categoryDocs = getDocumentsByCategory(req.category)
        return categoryDocs.length === 0
      })
      const newTasks: AutomatedTask[] = []
      // Create tasks for missing required documents
      for (const missing of missingDocuments) {
        if (missing.required) {
          newTasks.push({
            id: `task-${missing.id}-${Date.now()}`,
            title: `Upload ${missing.name}`,
            description: `Please upload your ${missing.name.toLowerCase()}. ${missing.description}`,
            category: 'document_collection',
            priority: missing.priority,
            status: 'not_started',
            document_category: missing.category,
            due_date: missing.deadline
          })
        }
      }
      // Create reminder tasks for optional but recommended documents
      for (const missing of missingDocuments) {
        if (!missing.required && missing.priority !== 'low') {
          newTasks.push({
            id: `reminder-${missing.id}-${Date.now()}`,
            title: `Consider uploading ${missing.name}`,
            description: `${missing.description} This could help maximize your refund.`,
            category: 'document_collection',
            priority: 'low',
            status: 'not_started',
            document_category: missing.category
          })
        }
      }
      // Save tasks to database
      if (newTasks.length > 0) {
        const tasksToInsert = newTasks.map(task => ({
          user_id: user.id,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date ? new Date(task.due_date).toISOString() : null
        }))
        const { data, error } = await supabase
          .from('tasks')
          .insert(tasksToInsert)
          .select()
        if (error) {
          } else {
          setAutomatedTasks(data || [])
        }
      }
    } catch (error) {
      }
  }, [isAuthenticated, user?.id, requirements, getDocumentsByCategory])
  // Mark task as completed when document is uploaded
  const markTaskCompleted = useCallback(async (documentCategory: string) => {
    if (!isAuthenticated || !user?.id) return
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('user_id', user.id)
        .eq('category', 'document_collection')
        .like('description', `%${documentCategory}%`)
      if (error) {
        }
    } catch (error) {
      }
  }, [isAuthenticated, user?.id])
  // Get completion status for each document category
  const getDocumentCompletionStatus = useCallback(() => {
    const status = requirements.map(req => {
      const categoryDocs = getDocumentsByCategory(req.category)
      return {
        category: req.category,
        name: req.name,
        required: req.required,
        completed: categoryDocs.length > 0,
        documentCount: categoryDocs.length,
        priority: req.priority
      }
    })
    const totalRequired = status.filter(s => s.required).length
    const completedRequired = status.filter(s => s.required && s.completed).length
    const totalOptional = status.filter(s => !s.required).length
    const completedOptional = status.filter(s => !s.required && s.completed).length
    return {
      categories: status,
      overall: {
        totalRequired,
        completedRequired,
        totalOptional,
        completedOptional,
        requiredCompletionRate: totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 100,
        overallCompletionRate: Math.round(((completedRequired + completedOptional) / (totalRequired + totalOptional)) * 100)
      }
    }
  }, [requirements, getDocumentsByCategory])
  // Generate personalized recommendations
  const getPersonalizedRecommendations = useCallback(() => {
    const completionStatus = getDocumentCompletionStatus()
    const recommendations: string[] = []
    // Check for missing required documents
    const missingRequired = completionStatus.categories.filter(c => c.required && !c.completed)
    if (missingRequired.length > 0) {
      recommendations.push(`You're missing ${missingRequired.length} required document${missingRequired.length === 1 ? '' : 's'}. Upload these first to proceed with your tax return.`)
    }
    // Check for potential deductions
    const hasReceipts = getDocumentsByCategory('receipts').length > 0
    const hasBankStatements = getDocumentsByCategory('bank-statements').length > 0
    if (!hasReceipts) {
      recommendations.push('Consider uploading receipts for business expenses, charitable donations, or medical expenses to potentially increase your refund.')
    }
    if (!hasBankStatements) {
      recommendations.push('Bank statements can help verify income and expenses, ensuring accuracy in your tax return.')
    }
    // Progress encouragement
    if (completionStatus.overall.requiredCompletionRate === 100) {
      recommendations.push('Great job! You\'ve uploaded all required documents. Consider adding optional documents to maximize your refund.')
    } else if (completionStatus.overall.requiredCompletionRate >= 50) {
      recommendations.push('You\'re making good progress! Just a few more required documents to go.')
    }
    return recommendations
  }, [getDocumentCompletionStatus, getDocumentsByCategory])
  // Initialize requirements and generate tasks
  useEffect(() => {
    setRequirements(defaultRequirements)
    setLoading(false)
  }, [])
  // Generate tasks when documents change
  useEffect(() => {
    if (!loading && isAuthenticated && user?.id && requirements.length > 0) {
      generateAutomatedTasks()
    }
  }, [loading, isAuthenticated, user?.id, requirements, documents, generateAutomatedTasks])
  return {
    requirements,
    automatedTasks,
    loading,
    generateAutomatedTasks,
    markTaskCompleted,
    getDocumentCompletionStatus,
    getPersonalizedRecommendations
  }
}
