/**
 * Client Portal Component
 */

import React from 'react'

interface ClientPortalProps {
  clientId?: string
  token?: string
  className?: string
}

const ClientPortal: React.FC<ClientPortalProps> = ({
  clientId,
  token,
  className
}) => {
  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Client Portal</h2>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Document Upload</h3>
          <p className="text-gray-600 text-sm mb-3">
            Upload your documents securely through this portal
          </p>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Upload Documents
          </button>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Document Status</h3>
          <p className="text-gray-600 text-sm mb-3">
            Track the status of your submitted documents
          </p>
          <div className="text-sm">
            <div className="flex justify-between py-1">
              <span>Tax Documents</span>
              <span className="text-green-600">Completed</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Financial Statements</span>
              <span className="text-yellow-600">In Review</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Supporting Documents</span>
              <span className="text-gray-500">Pending</span>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-2">Communication</h3>
          <p className="text-gray-600 text-sm mb-3">
            Messages and updates from your service provider
          </p>
          <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            View Messages
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientPortal
