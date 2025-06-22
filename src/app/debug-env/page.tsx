'use client'
import { useEffect, useState } from 'react'

export default function DebugEnvPage() {
  const [envInfo, setEnvInfo] = useState<any>(null)

  useEffect(() => {
    // Check client-side environment variables
    const clientEnv = {
      NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? 'Present' : 'Missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing',
    }

    // Check localStorage
    const localStorageKey = localStorage.getItem('openrouter_api_key')

    setEnvInfo({
      clientEnv,
      localStorage: localStorageKey ? 'Present' : 'Missing',
      localStoragePrefix: localStorageKey ? localStorageKey.substring(0, 20) + '...' : 'N/A'
    })
  }, [])

  const testAI = async () => {
    try {
      const response = await fetch('/api/test-ai')
      const data = await response.json()
      console.log('AI Test Result:', data)
      alert(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('AI Test Error:', error)
      alert('Error: ' + error)
    }
  }

  if (!envInfo) return <div>Loading...</div>

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Environment Debug</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Client-side Environment Variables</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(envInfo.clientEnv, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Local Storage</h2>
          <pre className="bg-gray-100 p-4 rounded">
            Status: {envInfo.localStorage}
            {envInfo.localStorage === 'Present' && (
              <div>Prefix: {envInfo.localStoragePrefix}</div>
            )}
          </pre>
        </div>

        <button 
          onClick={testAI}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test AI Connection
        </button>
      </div>
    </div>
  )
}
