import { VapiIntegrationTest } from '@/components/test/VapiIntegrationTest'

export default function AudioTestPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">VAPI Integration Test</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          This page tests the simplified VAPI integration and verifies that
          voice calls work without any complex audio configuration.
        </p>
      </div>

      <VapiIntegrationTest />

      <div className="mt-8 max-w-2xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">What This Test Does</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Tests simple VAPI integration with minimal configuration</li>
            <li>• Verifies that voice calls work without complex audio setup</li>
            <li>• Confirms that VAPI handles audio processing automatically</li>
            <li>• Ensures no worklet or audio processing errors occur</li>
          </ul>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-green-900 mb-2">Expected Results</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• ✅ No "Unable to load a worklet's module" errors</li>
            <li>• ✅ VAPI handles all audio processing automatically</li>
            <li>• ✅ Voice calls work with minimal configuration</li>
            <li>• ✅ Clean, simple integration without complex setup</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
