/**
 * ZyxAI Zustand Store Index
 * Central export for all application stores
 */

// Core stores
export { useAuthStore } from './authStore'
export { useUIStore } from './uiStore'
export { useNotificationStore } from './notificationStore'
export { useVapiStore } from './vapiStore'

// Store types
export type { AuthState } from './authStore'
export type { UIState } from './uiStore'
export type { NotificationState } from './notificationStore'
export type { VapiState } from './vapiStore'
