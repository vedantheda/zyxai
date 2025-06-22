/**
 * ZyxAI Brand Configuration
 * Central configuration for all branding elements
 */

export const BRAND_CONFIG = {
  // Core Brand Identity
  name: 'ZyxAI',
  fullName: 'ZyxAI - AI Voice Business Automation',
  tagline: 'AI Voice-Powered Business Automation Platform',
  description: 'Enterprise-grade business automation platform powered by advanced AI voice technology. Streamline operations, automate workflows, and enhance customer interactions through intelligent voice assistants.',

  // URLs and Links
  website: 'https://zyxai.app',
  supportEmail: 'support@zyxai.app',
  salesEmail: 'sales@zyxai.app',

  // Social Media
  social: {
    twitter: '@zyxai',
    linkedin: 'company/zyxai',
    github: 'zyxai'
  },

  // Product Features
  features: [
    'AI Voice Integration',
    'Smart Automation',
    'Client Management',
    'Document Processing',
    'Voice Communication',
    'Workflow Automation',
    'Analytics & Insights'
  ],

  // Technology Stack
  integrations: [
    'Vapi',
    'Eleven Labs',
    'OpenRouter',
    'Supabase',
    'Next.js'
  ],

  // UI Text
  auth: {
    signInTitle: 'Welcome back',
    signInSubtitle: 'Sign in to your AI voice automation platform',
    signUpTitle: 'Create your account',
    signUpSubtitle: 'Start automating your business with AI voice technology'
  },

  // SEO Keywords
  keywords: [
    'AI voice automation',
    'business automation',
    'voice AI platform',
    'workflow automation',
    'AI voice assistants',
    'enterprise automation',
    'Vapi integration',
    'Eleven Labs'
  ],

  // Design System
  design: {
    colors: {
      ai: {
        primary: 'hsl(199 89% 48%)',
        secondary: 'hsl(189 85% 55%)'
      },
      voice: {
        primary: 'hsl(263 70% 50%)',
        secondary: 'hsl(280 60% 60%)'
      },
      automation: {
        primary: 'hsl(142 76% 36%)',
        light: 'hsl(142 76% 46%)'
      }
    },
    gradients: {
      ai: 'linear-gradient(135deg, hsl(199 89% 48%) 0%, hsl(189 85% 55%) 100%)',
      voice: 'linear-gradient(135deg, hsl(263 70% 50%) 0%, hsl(280 60% 60%) 100%)',
      automation: 'linear-gradient(135deg, hsl(142 76% 36%) 0%, hsl(142 76% 46%) 100%)'
    },
    animations: {
      float: 'float 6s ease-in-out infinite',
      voiceWave: 'voiceWave 1.5s ease-in-out infinite',
      aiPulse: 'aiPulse 2s ease-in-out infinite',
      shimmer: 'shimmer 2s linear infinite'
    }
  }
} as const

export type BrandConfig = typeof BRAND_CONFIG
