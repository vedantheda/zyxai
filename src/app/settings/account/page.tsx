/**
 * Account Settings Page
 * Profile and account management
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/animated'
import { User } from 'lucide-react'

export default function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <FadeIn>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Manage your profile and account preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Account settings page coming soon...
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
