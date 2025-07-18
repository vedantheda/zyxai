'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { HelpCircle, Info, RotateCcw, CheckCircle, Settings } from 'lucide-react'
import { useTooltipPreferences, useTooltipTracking } from '@/hooks/useTooltipPreferences'
import { HelpTooltip } from '@/components/ui/help-tooltip'

/**
 * Tooltip settings component for user preferences
 */
export function TooltipSettings() {
  const {
    preferences,
    isNewUser,
    shouldShowTooltips,
    toggleTooltips,
    toggleCategory,
    markAsExperienced,
    resetTooltips
  } = useTooltipPreferences()

  const { viewedCount, resetViewedTooltips } = useTooltipTracking()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleToggleTooltips = (enabled: boolean) => {
    toggleTooltips(enabled)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleCategoryToggle = (category: keyof typeof preferences.categories, enabled: boolean) => {
    toggleCategory(category, enabled)
  }

  const handleResetTooltips = () => {
    resetTooltips()
    resetViewedTooltips()
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const categoryLabels = {
    dashboard: 'Dashboard',
    agents: 'AI Agents',
    calls: 'Voice Calls',
    contacts: 'Contacts',
    campaigns: 'Campaigns',
    team: 'Team Management',
    settings: 'Settings'
  }

  const categoryDescriptions = {
    dashboard: 'Help with dashboard metrics and navigation',
    agents: 'Guidance for creating and managing AI agents',
    calls: 'Assistance with voice calls and call management',
    contacts: 'Help with contact management and organization',
    campaigns: 'Support for campaign creation and management',
    team: 'Guidance for team and user management',
    settings: 'Help with platform configuration and preferences'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tooltip & Help Settings</h2>
        <p className="text-gray-600 mt-1">
          Customize your help and guidance experience
        </p>
      </div>

      {/* Success Alert */}
      {showSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Tooltip settings updated successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* User Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Your Help Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">User Experience Level</Label>
              <p className="text-sm text-gray-600">
                {isNewUser ? 'New user - showing all helpful tooltips' : 'Experienced user - minimal tooltips'}
              </p>
            </div>
            <Badge variant={isNewUser ? 'default' : 'secondary'}>
              {isNewUser ? 'New User' : 'Experienced'}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Tooltips Viewed</Label>
              <p className="text-sm text-gray-600">
                You've seen {viewedCount} helpful tooltips so far
              </p>
            </div>
            <Badge variant="outline">{viewedCount} viewed</Badge>
          </div>

          {isNewUser && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={markAsExperienced}
                className="w-full"
              >
                Mark as Experienced User
              </Button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                This will reduce the number of tooltips shown
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tooltip Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Tooltip Settings
          </CardTitle>
          <CardDescription>
            Control when and where helpful tooltips appear
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Tooltips</Label>
              <p className="text-sm text-gray-600">
                Show helpful tooltips throughout the application
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={preferences.enabled}
                onCheckedChange={handleToggleTooltips}
              />
              <HelpTooltip
                content="Turn this off to disable all tooltips across the platform"
                variant="info"
              />
            </div>
          </div>

          {/* Category Settings */}
          {preferences.enabled && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <Label className="text-base font-medium">Tooltip Categories</Label>
                <p className="text-sm text-gray-600 mb-4">
                  Choose which areas you'd like help with
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(preferences.categories).map(([category, enabled]) => (
                  <div
                    key={category}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label className="font-medium">
                          {categoryLabels[category as keyof typeof categoryLabels]}
                        </Label>
                        <Badge
                          variant={enabled ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {enabled ? 'On' : 'Off'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                      </p>
                    </div>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => 
                        handleCategoryToggle(category as keyof typeof preferences.categories, checked)
                      }
                      className="ml-3"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Reset Options
          </CardTitle>
          <CardDescription>
            Reset your tooltip preferences and viewing history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Reset All Tooltips</Label>
              <p className="text-sm text-gray-600">
                Show all tooltips again as if you're a new user
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleResetTooltips}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Clear Viewing History</Label>
              <p className="text-sm text-gray-600">
                Reset which tooltips you've already seen
              </p>
            </div>
            <Button
              variant="outline"
              onClick={resetViewedTooltips}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Clear History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            About Tooltips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Tooltips</strong> provide contextual help and guidance as you use ZyxAI.
              They're especially helpful when you're learning new features.
            </p>
            <p>
              <strong>Smart Display:</strong> Tooltips automatically reduce for experienced users
              and won't show again once you've seen them.
            </p>
            <p>
              <strong>Categories:</strong> You can enable tooltips for specific areas while
              disabling them for features you're already comfortable with.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
