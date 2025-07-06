import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { ValidationError } from '@/hooks/useAgentValidation'

interface ValidationAlertProps {
  errors: ValidationError[]
  warnings: ValidationError[]
  className?: string
}

export function ValidationAlert({ errors, warnings, className }: ValidationAlertProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return (
      <Alert className={`border-green-200 bg-green-50 dark:bg-green-950/20 ${className}`}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          All configurations are valid and ready to use.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-2">Configuration Errors ({errors.length})</div>
            <ul className="space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Badge variant="destructive" className="text-xs">
                    {getFieldDisplayName(error.field)}
                  </Badge>
                  <span>{error.message}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <div className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">
              Recommendations ({warnings.length})
            </div>
            <ul className="space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                    {getFieldDisplayName(warning.field)}
                  </Badge>
                  <span>{warning.message}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

function getFieldDisplayName(field: string): string {
  const fieldNames: Record<string, string> = {
    name: 'Name',
    description: 'Description',
    voice_config: 'Voice',
    audio_config: 'Audio',
    transcribe_config: 'Transcriber',
    analysis_config: 'Analysis',
    recording_config: 'Recording',
    tools_config: 'Tools',
    security_config: 'Security',
    hooks_config: 'Hooks',
    fallback_config: 'Fallback',
    general: 'General'
  }
  return fieldNames[field] || field
}

interface FieldValidationProps {
  field: string
  errors: ValidationError[]
  warnings: ValidationError[]
  children: React.ReactNode
}

export function FieldValidation({ field, errors, warnings, children }: FieldValidationProps) {
  const fieldErrors = errors.filter(e => e.field === field)
  const fieldWarnings = warnings.filter(w => w.field === field)
  const hasIssues = fieldErrors.length > 0 || fieldWarnings.length > 0

  return (
    <div className="space-y-2">
      {children}
      {hasIssues && (
        <div className="space-y-1">
          {fieldErrors.map((error, index) => (
            <div key={`error-${index}`} className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-3 w-3" />
              <span>{error.message}</span>
            </div>
          ))}
          {fieldWarnings.map((warning, index) => (
            <div key={`warning-${index}`} className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-3 w-3" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ValidationSummaryProps {
  errors: ValidationError[]
  warnings: ValidationError[]
}

export function ValidationSummary({ errors, warnings }: ValidationSummaryProps) {
  const errorCount = errors.length
  const warningCount = warnings.length
  const isValid = errorCount === 0

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        {isValid ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
        <span className={`font-medium ${isValid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
          {isValid ? 'Configuration Valid' : 'Configuration Issues'}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {errorCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {errorCount} Error{errorCount !== 1 ? 's' : ''}
          </Badge>
        )}
        {warningCount > 0 && (
          <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
            {warningCount} Warning{warningCount !== 1 ? 's' : ''}
          </Badge>
        )}
        {errorCount === 0 && warningCount === 0 && (
          <Badge variant="outline" className="text-xs border-green-300 text-green-700">
            All Good
          </Badge>
        )}
      </div>
    </div>
  )
}
