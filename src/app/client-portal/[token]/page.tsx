'use client'
import { useParams } from 'next/navigation'
import ClientPortal from '@/components/features/documents/storage/ClientPortal'
export default function ClientPortalPage() {
  const params = useParams()
  const token = params.token as string
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Invalid Access</h1>
          <p className="text-muted-foreground">
            The portal link you used is invalid or has expired.
          </p>
        </div>
      </div>
    )
  }
  return <ClientPortal accessToken={token} />
}
