/**
 * Integrations Settings Page
 * CRM and third-party integrations
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FadeIn } from '@/components/ui/animated'
import { Zap } from 'lucide-react'

export default function IntegrationsSettingsPage() {
  return (
    <div className="space-y-6">
      <FadeIn>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Integrations
            </CardTitle>
            <CardDescription>
              Connect with CRM and third-party services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Integrations page coming soon...
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
