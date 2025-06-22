'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mic, 
  Bot, 
  Zap, 
  Play, 
  Pause, 
  Volume2, 
  Brain,
  Sparkles,
  Waveform,
  Activity
} from 'lucide-react'

export function ZyxAIShowcase() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-ai rounded-xl flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gradient-ai">ZyxAI</h1>
        </div>
        <h2 className="text-2xl font-semibold text-foreground">UI Design System Showcase</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience the new ZyxAI design system with AI voice-powered business automation aesthetics
        </p>
      </div>

      {/* Color Palette */}
      <Card className="ai-card">
        <CardHeader>
          <CardTitle className="text-gradient-ai">Color Palette</CardTitle>
          <CardDescription>ZyxAI brand colors and gradients</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gradient-ai">AI Colors</h4>
              <div className="space-y-2">
                <div className="h-12 bg-gradient-ai rounded-lg flex items-center justify-center text-white font-medium">
                  Primary AI
                </div>
                <div className="h-8 bg-ai-secondary rounded-lg flex items-center justify-center text-white text-sm">
                  Secondary AI
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gradient-voice">Voice Colors</h4>
              <div className="space-y-2">
                <div className="h-12 bg-gradient-voice rounded-lg flex items-center justify-center text-white font-medium">
                  Primary Voice
                </div>
                <div className="h-8 bg-voice-secondary rounded-lg flex items-center justify-center text-white text-sm">
                  Secondary Voice
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gradient-automation">Automation Colors</h4>
              <div className="space-y-2">
                <div className="h-12 bg-gradient-automation rounded-lg flex items-center justify-center text-white font-medium">
                  Primary Auto
                </div>
                <div className="h-8 bg-automation-light rounded-lg flex items-center justify-center text-white text-sm">
                  Light Auto
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Buttons */}
        <Card className="feature-card">
          <CardHeader>
            <CardTitle className="text-gradient-ai">Interactive Buttons</CardTitle>
            <CardDescription>Modern button styles with hover effects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button className="btn-primary w-full">
                <Bot className="w-4 h-4 mr-2" />
                AI Primary Button
              </Button>
              <Button className="btn-secondary w-full">
                <Mic className="w-4 h-4 mr-2" />
                Voice Secondary Button
              </Button>
              <Button variant="outline" className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                Automation Outline
              </Button>
              <Button variant="ghost" className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Ghost Button
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Voice Interface */}
        <Card className="service-card">
          <CardHeader>
            <CardTitle className="text-gradient-voice">Voice Interface</CardTitle>
            <CardDescription>AI voice interaction components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <Button
                size="lg"
                className={`rounded-full w-16 h-16 ${isRecording ? 'bg-red-500 animate-pulse' : 'btn-secondary'}`}
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic className="w-6 h-6" />
              </Button>
              <div className="voice-indicator">
                <span className="animate-voiceWave"></span>
                <span className="animate-voiceWave delay-150"></span>
                <span className="animate-voiceWave delay-300"></span>
              </div>
              <Button
                size="lg"
                className="rounded-full w-16 h-16 btn-primary"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isRecording ? 'Recording...' : 'Click to start voice interaction'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Badges and Status */}
      <Card className="designer-card">
        <CardHeader>
          <CardTitle className="text-gradient-automation">Status Indicators</CardTitle>
          <CardDescription>Badges and status components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Badge className="badge">AI Processing</Badge>
            <Badge className="badge-voice">Voice Active</Badge>
            <Badge className="badge-automation">Automation Running</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="status-indicator status-active">
              <Activity className="w-4 h-4" />
              Active
            </div>
            <div className="status-indicator status-processing">
              <Waveform className="w-4 h-4" />
              Processing
            </div>
            <div className="status-indicator status-inactive">
              <Volume2 className="w-4 h-4" />
              Inactive
            </div>
            <div className="status-indicator status-error">
              <Zap className="w-4 h-4" />
              Error
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animations */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-gradient-ai">Animations & Effects</CardTitle>
          <CardDescription>Smooth animations and visual effects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-ai rounded-full mx-auto animate-float glow-ai"></div>
              <p className="text-sm">Float Animation</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-voice rounded-full mx-auto animate-aiPulse"></div>
              <p className="text-sm">AI Pulse</p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-automation rounded-full mx-auto animate-shimmer"></div>
              <p className="text-sm">Shimmer Effect</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card className="interactive-card">
        <CardHeader>
          <CardTitle className="text-gradient-voice">Loading States</CardTitle>
          <CardDescription>Loading indicators and skeleton screens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="loading-skeleton h-4 rounded"></div>
          <div className="loading-skeleton h-4 rounded w-3/4"></div>
          <div className="loading-skeleton h-4 rounded w-1/2"></div>
          <div className="flex items-center space-x-2 mt-4">
            <span className="text-sm">Processing</span>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
