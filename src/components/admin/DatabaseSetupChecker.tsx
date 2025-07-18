'use client'

import { useState, useEffect } from 'react'
import { AdminGuard } from '@/components/auth/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle, Database, ExternalLink } from 'lucide-react'

interface TableStatus {
  name: string
  exists: boolean
  description: string
  setupScript?: string
}

/**
 * Database setup checker for admins
 * Helps identify missing tables and provides setup instructions
 */
export function DatabaseSetupChecker() {
  const [tables, setTables] = useState<TableStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  const requiredTables = [
    {
      name: 'user_invitations',
      description: 'Team member invitations',
      setupScript: 'database/06-invitations-setup.sql'
    },
    {
      name: 'audit_logs',
      description: 'Enterprise audit logging',
      setupScript: 'database/audit-logs-schema.sql'
    },
    {
      name: 'ai_agents',
      description: 'AI agents and assistants',
      setupScript: 'database/01-schema.sql'
    },
    {
      name: 'campaigns',
      description: 'Marketing campaigns',
      setupScript: 'database/01-schema.sql'
    },
    {
      name: 'contacts',
      description: 'Contact management',
      setupScript: 'database/01-schema.sql'
    },
    {
      name: 'calls',
      description: 'Call tracking and analytics',
      setupScript: 'database/01-schema.sql'
    }
  ]

  useEffect(() => {
    checkDatabaseTables()
  }, [])

  const checkDatabaseTables = async () => {
    try {
      setLoading(true)
      setChecking(true)

      const tableStatuses: TableStatus[] = []

      // Check each required table
      for (const table of requiredTables) {
        try {
          // Try to query the table to see if it exists
          const response = await fetch(`/api/admin/check-table?table=${table.name}`)
          const result = await response.json()

          tableStatuses.push({
            name: table.name,
            exists: result.exists || false,
            description: table.description,
            setupScript: table.setupScript
          })
        } catch (error) {
          // If there's an error, assume table doesn't exist
          tableStatuses.push({
            name: table.name,
            exists: false,
            description: table.description,
            setupScript: table.setupScript
          })
        }
      }

      setTables(tableStatuses)
    } catch (error) {
      console.error('Error checking database tables:', error)
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  const getStatusIcon = (exists: boolean) => {
    if (exists) {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    } else {
      return <XCircle className="w-5 h-5 text-red-600" />
    }
  }

  const getStatusColor = (exists: boolean) => {
    return exists ? 'text-green-600' : 'text-red-600'
  }

  const missingTables = tables.filter(table => !table.exists)
  const allTablesExist = missingTables.length === 0

  return (
    <AdminGuard fallback={
      <div className="p-4 text-center text-red-600">
        Access denied. Admin privileges required.
      </div>
    }>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Database Setup</h2>
            <p className="text-gray-600">
              Check and manage database table setup for ZyxAI features
            </p>
          </div>
          <Button
            onClick={checkDatabaseTables}
            disabled={checking}
            variant="outline"
          >
            <Database className="w-4 h-4 mr-2" />
            {checking ? 'Checking...' : 'Refresh Check'}
          </Button>
        </div>

        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {allTablesExist ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
              Database Status
            </CardTitle>
            <CardDescription>
              {allTablesExist 
                ? 'All required database tables are set up correctly.'
                : `${missingTables.length} table(s) need to be set up.`
              }
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Missing Tables Alert */}
        {missingTables.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Action Required:</strong> Some database tables are missing. 
              Run the setup scripts in your Supabase SQL Editor to enable all features.
            </AlertDescription>
          </Alert>
        )}

        {/* Tables Status */}
        <Card>
          <CardHeader>
            <CardTitle>Required Tables</CardTitle>
            <CardDescription>
              Status of all required database tables for ZyxAI features
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {tables.map((table) => (
                  <div
                    key={table.name}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      table.exists ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${getStatusColor(table.exists)}`}>
                          {table.name}
                        </h3>
                        {getStatusIcon(table.exists)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {table.description}
                      </p>
                      {!table.exists && table.setupScript && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Setup script: {table.setupScript}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Copy setup instructions to clipboard
                              navigator.clipboard.writeText(
                                `Run this script in Supabase SQL Editor:\n${table.setupScript}`
                              )
                              alert('Setup instructions copied to clipboard!')
                            }}
                          >
                            Copy Setup
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <span className={`text-sm font-medium ${getStatusColor(table.exists)}`}>
                        {table.exists ? 'Ready' : 'Missing'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        {missingTables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Setup Instructions</CardTitle>
              <CardDescription>
                Follow these steps to set up missing database tables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Open Supabase SQL Editor</h4>
                    <p className="text-sm text-gray-600">
                      Go to your Supabase dashboard → SQL Editor
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Run Setup Scripts</h4>
                    <p className="text-sm text-gray-600">
                      Copy and run the setup scripts for missing tables:
                    </p>
                    <ul className="mt-2 space-y-1">
                      {missingTables.map((table) => (
                        <li key={table.name} className="text-sm text-gray-600">
                          • <code className="bg-gray-100 px-1 rounded">{table.setupScript}</code> for {table.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Verify Setup</h4>
                    <p className="text-sm text-gray-600">
                      Click "Refresh Check" above to verify all tables are created
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                  variant="outline"
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Supabase Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminGuard>
  )
}
