'use client'

import { VisualWorkflowBuilderWrapper } from '@/components/workflows/VisualWorkflowBuilder'

export default function WorkflowBuilderPage() {
  const handleSave = (workflow: any) => {
    console.log('Saving workflow:', workflow)
    // TODO: Implement save logic
  }

  const handleTest = (workflow: any) => {
    console.log('Testing workflow:', workflow)
    // TODO: Implement test logic
  }

  return (
    <VisualWorkflowBuilderWrapper 
      onSave={handleSave}
      onTest={handleTest}
    />
  )
}
