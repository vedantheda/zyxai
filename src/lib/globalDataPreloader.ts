'use client'

import { supabase } from '@/lib/supabase'
import { setCache, getFromCache } from '@/lib/globalCache'

// AGGRESSIVE DATA PRELOADING - LOAD EVERYTHING UPFRONT
export const preloadAllUserData = async (userId: string) => {
  if (!userId) return

  console.log('🚀 PRELOADING ALL USER DATA')

  try {
    // Preload clients
    const clientsCacheKey = `clients-${userId}`
    if (!getFromCache(clientsCacheKey)) {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (clientsData) {
        setCache(clientsCacheKey, clientsData)
        console.log('✅ PRELOADED CLIENTS')
      }
    }

    // Preload documents
    const documentsCacheKey = `documents-${userId}`
    if (!getFromCache(documentsCacheKey)) {
      const { data: documentsData } = await supabase
        .from('documents')
        .select(`
          *,
          clients (
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (documentsData) {
        setCache(documentsCacheKey, documentsData)
        console.log('✅ PRELOADED DOCUMENTS')
      }
    }

    // Preload tasks
    const tasksCacheKey = `tasks-${userId}-all`
    if (!getFromCache(tasksCacheKey)) {
      const { data: tasksData } = await supabase
        .from('tasks')
        .select(`
          *,
          clients (
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (tasksData) {
        setCache(tasksCacheKey, tasksData)
        console.log('✅ PRELOADED TASKS')
      }
    }

    // Preload workflows
    const workflowsCacheKey = `workflows-${userId}`
    if (!getFromCache(workflowsCacheKey)) {
      const { data: workflowsData } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (workflowsData) {
        setCache(workflowsCacheKey, {
          workflows: workflowsData,
          alerts: [],
          stats: { total: workflowsData.length, active: 0, completed: 0 }
        })
        console.log('✅ PRELOADED WORKFLOWS')
      }
    }

    console.log('🎉 ALL USER DATA PRELOADED')

  } catch (error) {
    console.error('❌ PRELOAD ERROR:', error)
  }
}

// Hook to trigger preloading
export const useDataPreloader = (userId?: string) => {
  const preload = () => {
    if (userId) {
      preloadAllUserData(userId)
    }
  }

  return { preload }
}
