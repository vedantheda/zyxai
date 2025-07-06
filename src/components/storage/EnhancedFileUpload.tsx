/**
 * Enhanced File Upload Component
 */

import React from 'react'

interface EnhancedFileUploadProps {
  onUpload?: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number
  className?: string
}

const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({
  onUpload,
  accept,
  multiple = false,
  maxSize,
  className
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (maxSize) {
      const validFiles = files.filter(file => file.size <= maxSize)
      if (validFiles.length !== files.length) {
        console.warn('Some files exceeded maximum size limit')
      }
      onUpload?.(validFiles)
    } else {
      onUpload?.(files)
    }
  }

  return (
    <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 ${className}`}>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="w-full"
      />
      <div className="text-center text-gray-500 mt-2">
        <p>Drop files here or click to browse</p>
        {maxSize && (
          <p className="text-sm">Maximum file size: {Math.round(maxSize / 1024 / 1024)}MB</p>
        )}
      </div>
    </div>
  )
}

export default EnhancedFileUpload
