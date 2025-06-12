'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClientsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/clients')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Redirecting to clients...</p>
      </div>
    </div>
  )
}
