'use client'

import { useAuth } from '@/contexts/AuthProvider'
import { SimpleLoading } from '@/components/ui/simple-loading'
import { Brain } from 'lucide-react'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  // Show loading during auth initialization
  if (loading) {
    return <SimpleLoading text="Loading onboarding..." />
  }

  // Handle unauthenticated state
  if (!user) {
    return <SimpleLoading text="Please log in to continue" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">ZyxAI</h1>
            </div>
            <div className="text-sm text-slate-400">
              Welcome, {user.email}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
