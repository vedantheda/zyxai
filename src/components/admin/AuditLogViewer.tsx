'use client'

import { useState, useEffect } from 'react'
import { AuditLogger, type AuditLogFilter } from '@/lib/audit/auditLogger'
import { AdminGuard } from '@/components/auth/PermissionGuard'

interface AuditLog {
  id: string
  user_id?: string
  action: string
  resource_type: string
  resource_id?: string
  details?: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  users?: {
    email: string
    first_name?: string
    last_name?: string
  }
}

/**
 * Enterprise audit log viewer component
 * Only accessible to admin-level users
 */
export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<AuditLogFilter>({
    limit: 50,
    offset: 0
  })

  const loadLogs = async () => {
    try {
      setLoading(true)
      const { data, error } = await AuditLogger.getLogs(filter)
      
      if (error) {
        setError('Failed to load audit logs')
        console.error('Audit log error:', error)
      } else {
        setLogs(data)
        setError(null)
      }
    } catch (err) {
      setError('Failed to load audit logs')
      console.error('Audit log error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [filter])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatAction = (action: string) => {
    return action.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ')
  }

  const formatUserName = (log: AuditLog) => {
    if (!log.users) return 'System'
    const { first_name, last_name, email } = log.users
    if (first_name || last_name) {
      return `${first_name || ''} ${last_name || ''}`.trim()
    }
    return email
  }

  return (
    <AdminGuard fallback={
      <div className="p-4 text-center text-red-600">
        Access denied. Admin privileges required.
      </div>
    }>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <button
            onClick={loadLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <select
                value={filter.action || ''}
                onChange={(e) => setFilter({ ...filter, action: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Actions</option>
                <option value="auth.login">Login</option>
                <option value="auth.logout">Logout</option>
                <option value="auth.failed_login">Failed Login</option>
                <option value="user.create">User Create</option>
                <option value="user.update">User Update</option>
                <option value="user.delete">User Delete</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={filter.severity || ''}
                onChange={(e) => setFilter({ ...filter, severity: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource Type
              </label>
              <select
                value={filter.resource_type || ''}
                onChange={(e) => setFilter({ ...filter, resource_type: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">All Resources</option>
                <option value="authentication">Authentication</option>
                <option value="user">User</option>
                <option value="organization">Organization</option>
                <option value="agent">Agent</option>
                <option value="campaign">Campaign</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Limit
              </label>
              <select
                value={filter.limit || 50}
                onChange={(e) => setFilter({ ...filter, limit: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading audit logs...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No audit logs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatUserName(log)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatAction(log.action)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.resource_type}
                        {log.resource_id && (
                          <span className="text-gray-500 text-xs block">
                            ID: {log.resource_id.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.details && Object.keys(log.details).length > 0 ? (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-800">
                              View Details
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-gray-400">No details</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  )
}
