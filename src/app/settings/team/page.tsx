/**
 * Team Settings Page
 * Team management and roles
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/animated'
import { Users } from 'lucide-react'

export default function TeamSettingsPage() {
  return (
    <div className="space-y-6">
      <FadeIn>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Management
            </CardTitle>
            <CardDescription>
              Manage team members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Team management page coming soon...
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
