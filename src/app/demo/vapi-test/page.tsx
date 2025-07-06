import VapiTest from '@/components/voice/VapiTest'

export default function VapiTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">VAPI & Microphone Diagnostic Test</h1>
        <VapiTest />
      </div>
    </div>
  )
}
