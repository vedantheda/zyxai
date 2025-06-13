'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Oops!</h1>
          <h2 className="text-xl text-muted-foreground">Something went wrong</h2>
        </div>
        <p className="text-muted-foreground">
          We encountered an unexpected error. Don't worry, our team has been notified.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={reset}
            className="bg-primary hover:bg-primary/90"
          >
            Try again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}
