'use client'
import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}
interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}
const ToastContext = createContext<ToastContextType | undefined>(undefined)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...toast, id }
    setToasts(prev => [...prev, newToast])
    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
function ToastContainer() {
  const { toasts } = useToast()
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast()

  const handleClose = () => {
    removeToast(toast.id)
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      default:
        return <Info className="w-5 h-5 text-blue-600" />
    }
  }

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'
      case 'error':
        return 'border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800'
      default:
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.5 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'border rounded-lg shadow-lg p-4 w-full backdrop-blur-sm',
        getStyles()
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-sm">{toast.title}</h4>
          {toast.description && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {toast.description}
            </p>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-background/50"
        >
          <X className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}
// Helper functions for easy usage
export const toast = {
  success: (title: string, description?: string) => {
    // This will be implemented when ToastProvider is available
    
  },
  error: (title: string, description?: string) => {
    
  },
  warning: (title: string, description?: string) => {
    
  },
  info: (title: string, description?: string) => {
    
  },
}
