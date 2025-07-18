/**
 * UI Store - Zustand
 * Manages global UI state, modals, sidebars, and user preferences
 */

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// Types
export interface UIState {
  // Sidebar state
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  
  // Modal state
  modals: {
    createAgent: boolean
    editAgent: boolean
    deleteAgent: boolean
    createCampaign: boolean
    editCampaign: boolean
    userInvitation: boolean
    profileCompletion: boolean
    [key: string]: boolean
  }
  
  // Loading states
  globalLoading: boolean
  loadingStates: {
    [key: string]: boolean
  }
  
  // Theme and preferences
  theme: 'light' | 'dark' | 'system'
  compactMode: boolean
  animationsEnabled: boolean
  
  // Navigation
  currentPage: string
  breadcrumbs: Array<{ label: string; href?: string }>
  
  // Search
  globalSearchOpen: boolean
  globalSearchQuery: string
  
  // Notifications UI
  notificationsPanelOpen: boolean
  
  // Actions
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  toggleSidebarCollapsed: () => void
  
  // Modal actions
  openModal: (modalKey: string) => void
  closeModal: (modalKey: string) => void
  closeAllModals: () => void
  isModalOpen: (modalKey: string) => boolean
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void
  setLoading: (key: string, loading: boolean) => void
  isLoading: (key: string) => boolean
  
  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setCompactMode: (compact: boolean) => void
  setAnimationsEnabled: (enabled: boolean) => void
  
  // Navigation actions
  setCurrentPage: (page: string) => void
  setBreadcrumbs: (breadcrumbs: Array<{ label: string; href?: string }>) => void
  
  // Search actions
  setGlobalSearchOpen: (open: boolean) => void
  setGlobalSearchQuery: (query: string) => void
  
  // Notifications actions
  setNotificationsPanelOpen: (open: boolean) => void
  
  // Utilities
  reset: () => void
}

// Initial state
const initialState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  modals: {
    createAgent: false,
    editAgent: false,
    deleteAgent: false,
    createCampaign: false,
    editCampaign: false,
    userInvitation: false,
    profileCompletion: false,
  },
  globalLoading: false,
  loadingStates: {},
  theme: 'system' as const,
  compactMode: false,
  animationsEnabled: true,
  currentPage: '',
  breadcrumbs: [],
  globalSearchOpen: false,
  globalSearchQuery: '',
  notificationsPanelOpen: false,
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Sidebar actions
        setSidebarOpen: (sidebarOpen) => 
          set({ sidebarOpen }, false, 'setSidebarOpen'),
        
        setSidebarCollapsed: (sidebarCollapsed) => 
          set({ sidebarCollapsed }, false, 'setSidebarCollapsed'),
        
        toggleSidebar: () => 
          set((state) => ({ sidebarOpen: !state.sidebarOpen }), false, 'toggleSidebar'),
        
        toggleSidebarCollapsed: () => 
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }), false, 'toggleSidebarCollapsed'),
        
        // Modal actions
        openModal: (modalKey) => 
          set((state) => ({
            modals: { ...state.modals, [modalKey]: true }
          }), false, `openModal:${modalKey}`),
        
        closeModal: (modalKey) => 
          set((state) => ({
            modals: { ...state.modals, [modalKey]: false }
          }), false, `closeModal:${modalKey}`),
        
        closeAllModals: () => 
          set((state) => {
            const modals = { ...state.modals }
            Object.keys(modals).forEach(key => {
              modals[key] = false
            })
            return { modals }
          }, false, 'closeAllModals'),
        
        isModalOpen: (modalKey) => get().modals[modalKey] || false,
        
        // Loading actions
        setGlobalLoading: (globalLoading) => 
          set({ globalLoading }, false, 'setGlobalLoading'),
        
        setLoading: (key, loading) => 
          set((state) => ({
            loadingStates: { ...state.loadingStates, [key]: loading }
          }), false, `setLoading:${key}`),
        
        isLoading: (key) => get().loadingStates[key] || false,
        
        // Theme actions
        setTheme: (theme) => 
          set({ theme }, false, 'setTheme'),
        
        setCompactMode: (compactMode) => 
          set({ compactMode }, false, 'setCompactMode'),
        
        setAnimationsEnabled: (animationsEnabled) => 
          set({ animationsEnabled }, false, 'setAnimationsEnabled'),
        
        // Navigation actions
        setCurrentPage: (currentPage) => 
          set({ currentPage }, false, 'setCurrentPage'),
        
        setBreadcrumbs: (breadcrumbs) => 
          set({ breadcrumbs }, false, 'setBreadcrumbs'),
        
        // Search actions
        setGlobalSearchOpen: (globalSearchOpen) => 
          set({ globalSearchOpen }, false, 'setGlobalSearchOpen'),
        
        setGlobalSearchQuery: (globalSearchQuery) => 
          set({ globalSearchQuery }, false, 'setGlobalSearchQuery'),
        
        // Notifications actions
        setNotificationsPanelOpen: (notificationsPanelOpen) => 
          set({ notificationsPanelOpen }, false, 'setNotificationsPanelOpen'),
        
        // Reset
        reset: () => set(initialState, false, 'reset'),
      }),
      {
        name: 'zyxai-ui-store',
        partialize: (state) => ({
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          compactMode: state.compactMode,
          animationsEnabled: state.animationsEnabled,
        }),
      }
    ),
    {
      name: 'ui-store',
    }
  )
)
