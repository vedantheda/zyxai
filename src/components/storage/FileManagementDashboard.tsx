/**
 * File Management Dashboard Component
 */

import React from 'react'

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
}

interface FileManagementDashboardProps {
  files?: FileItem[]
  onDelete?: (fileId: string) => void
  onDownload?: (fileId: string) => void
  className?: string
}

const FileManagementDashboard: React.FC<FileManagementDashboardProps> = ({
  files = [],
  onDelete,
  onDownload,
  className
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">File Management</h3>
      
      {files.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No files uploaded yet</p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => onDownload?.(file.id)}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Download
                </button>
                <button
                  onClick={() => onDelete?.(file.id)}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileManagementDashboard
