'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InteractiveButton } from '@/components/ui/interactive-button'
import { InteractiveLink, ButtonLink, NavLink, SubtleLink } from '@/components/ui/interactive-link'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useCardFeedback } from '@/hooks/useClickFeedback'
import { 
  Mouse, 
  Smartphone, 
  Volume2, 
  Eye, 
  Zap, 
  ArrowRight,
  ExternalLink,
  Home,
  Settings,
  User
} from 'lucide-react'

/**
 * Demo component showcasing the click feedback system
 */
export function ClickFeedbackDemo() {
  const [hapticEnabled, setHapticEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  
  const { getCardProps } = useCardFeedback({ haptic: hapticEnabled, sound: soundEnabled })

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gradient-ai">Click Feedback System</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience enhanced user interaction with haptic feedback, visual animations, and responsive cursor changes.
          Try clicking on different elements below to feel the difference.
        </p>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Feedback Settings
          </CardTitle>
          <CardDescription>
            Customize your interaction experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Haptic Feedback
              </Label>
              <p className="text-sm text-muted-foreground">
                Subtle vibrations on mobile devices
              </p>
            </div>
            <Switch
              checked={hapticEnabled}
              onCheckedChange={setHapticEnabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Sound Feedback
              </Label>
              <p className="text-sm text-muted-foreground">
                Audio clicks for interactions
              </p>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
            />
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-2">
              <Mouse className="w-4 h-4" />
              <span className="text-sm">Total Clicks: </span>
              <Badge variant="secondary">{clickCount}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Interactive Buttons
          </CardTitle>
          <CardDescription>
            Enhanced buttons with click feedback and visual effects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InteractiveButton
              haptic={hapticEnabled}
              sound={soundEnabled}
              onClick={() => setClickCount(c => c + 1)}
            >
              <Zap className="w-4 h-4" />
              Primary Action
            </InteractiveButton>

            <InteractiveButton
              variant="outline"
              haptic={hapticEnabled}
              sound={soundEnabled}
              onClick={() => setClickCount(c => c + 1)}
            >
              <Eye className="w-4 h-4" />
              Outline Button
            </InteractiveButton>

            <InteractiveButton
              variant="secondary"
              haptic={hapticEnabled}
              sound={soundEnabled}
              onClick={() => setClickCount(c => c + 1)}
            >
              <Settings className="w-4 h-4" />
              Secondary
            </InteractiveButton>

            <InteractiveButton
              variant="destructive"
              haptic={hapticEnabled}
              sound={soundEnabled}
              onClick={() => setClickCount(c => c + 1)}
            >
              Delete Item
            </InteractiveButton>

            <InteractiveButton
              variant="ghost"
              haptic={hapticEnabled}
              sound={soundEnabled}
              onClick={() => setClickCount(c => c + 1)}
            >
              Ghost Button
            </InteractiveButton>

            <InteractiveButton
              loading
              loadingText="Processing..."
              haptic={hapticEnabled}
              sound={soundEnabled}
            >
              Loading State
            </InteractiveButton>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Button Sizes</h4>
            <div className="flex items-center gap-2">
              <InteractiveButton 
                size="sm" 
                haptic={hapticEnabled}
                sound={soundEnabled}
                onClick={() => setClickCount(c => c + 1)}
              >
                Small
              </InteractiveButton>
              <InteractiveButton 
                haptic={hapticEnabled}
                sound={soundEnabled}
                onClick={() => setClickCount(c => c + 1)}
              >
                Default
              </InteractiveButton>
              <InteractiveButton 
                size="lg" 
                haptic={hapticEnabled}
                sound={soundEnabled}
                onClick={() => setClickCount(c => c + 1)}
              >
                Large
              </InteractiveButton>
              <InteractiveButton 
                size="icon" 
                haptic={hapticEnabled}
                sound={soundEnabled}
                onClick={() => setClickCount(c => c + 1)}
              >
                <User className="w-4 h-4" />
              </InteractiveButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Interactive Links
          </CardTitle>
          <CardDescription>
            Enhanced navigation with hover effects and feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium mb-2">Link Variants</h4>
              <div className="space-y-2">
                <div>
                  <InteractiveLink
                    href="/"
                    haptic={hapticEnabled}
                    sound={soundEnabled}
                  >
                    Default Link Style
                  </InteractiveLink>
                </div>

                <div>
                  <ButtonLink
                    href="/agents"
                    haptic={hapticEnabled}
                    sound={soundEnabled}
                  >
                    <Zap className="w-4 h-4" />
                    Button Link Style
                  </ButtonLink>
                </div>

                <div>
                  <SubtleLink 
                    href="/dashboard/settings" 
                    haptic={hapticEnabled}
                    sound={soundEnabled}
                  >
                    Subtle Link Style
                  </SubtleLink>
                </div>

                <div>
                  <InteractiveLink 
                    href="https://example.com" 
                    external
                    haptic={hapticEnabled}
                    sound={soundEnabled}
                  >
                    External Link <ExternalLink className="w-3 h-3 inline ml-1" />
                  </InteractiveLink>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Navigation Links</h4>
              <div className="space-y-1">
                <NavLink
                  href="/"
                  haptic={hapticEnabled}
                  sound={soundEnabled}
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </NavLink>
                <NavLink
                  href="/agents"
                  haptic={hapticEnabled}
                  sound={soundEnabled}
                >
                  <Zap className="w-4 h-4" />
                  AI Agents
                </NavLink>
                <NavLink
                  href="/settings"
                  haptic={hapticEnabled}
                  sound={soundEnabled}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </NavLink>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Interactive Cards
          </CardTitle>
          <CardDescription>
            Clickable cards with hover and press effects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              {...getCardProps()}
              onClick={() => setClickCount(c => c + 1)}
            >
              <CardHeader>
                <CardTitle className="text-lg">Feature Card</CardTitle>
                <CardDescription>
                  Click me for feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This card provides haptic and visual feedback when clicked.
                </p>
              </CardContent>
            </Card>

            <Card 
              {...getCardProps()}
              onClick={() => setClickCount(c => c + 1)}
            >
              <CardHeader>
                <CardTitle className="text-lg">Analytics</CardTitle>
                <CardDescription>
                  Interactive dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {clickCount}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total interactions
                </p>
              </CardContent>
            </Card>

            <Card 
              {...getCardProps()}
              onClick={() => setClickCount(c => c + 1)}
            >
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
                <CardDescription>
                  Configuration panel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Customize your experience with enhanced feedback.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
