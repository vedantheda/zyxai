'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSessionSync } from '@/hooks/useSessionSync'
import { LoadingScreen } from '@/components/ui/loading-screen'
import {
  CreditCard,
  DollarSign,
  Calendar,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Settings,
  Receipt,
  Zap,
  Users,
  Phone,
  Crown,
  Star,
  Shield
} from 'lucide-react'

interface BillingData {
  subscription: {
    plan: string
    status: 'active' | 'past_due' | 'canceled' | 'trialing'
    currentPeriodStart: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    trialEnd?: string
  }
  usage: {
    callMinutes: number
    callMinutesLimit: number
    apiCalls: number
    apiCallsLimit: number
    users: number
    usersLimit: number
  }
  billing: {
    nextBillingDate: string
    amount: number
    currency: string
    paymentMethod: {
      type: string
      last4: string
      brand: string
    }
  }
  invoices: Array<{
    id: string
    date: string
    amount: number
    status: string
    downloadUrl: string
  }>
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    features: [
      '500 call minutes/month',
      '5,000 API calls/month',
      '3 team members',
      'Basic analytics',
      'Email support'
    ],
    limits: {
      callMinutes: 500,
      apiCalls: 5000,
      users: 3
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 149,
    features: [
      '2,000 call minutes/month',
      '25,000 API calls/month',
      '10 team members',
      'Advanced analytics',
      'Priority support',
      'Custom workflows'
    ],
    limits: {
      callMinutes: 2000,
      apiCalls: 25000,
      users: 10
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 399,
    features: [
      'Unlimited call minutes',
      'Unlimited API calls',
      'Unlimited team members',
      'Custom analytics',
      '24/7 phone support',
      'Custom integrations',
      'Dedicated account manager'
    ],
    limits: {
      callMinutes: -1, // Unlimited
      apiCalls: -1,
      users: -1
    }
  }
]

export default function BillingPage() {
  const { user, loading, isSessionReady, isAuthenticated } = useSessionSync()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [billingData, setBillingData] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Show loading during session sync
  if (loading || !isSessionReady) {
    return <LoadingScreen />
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <LoadingScreen />
  }

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/billing/overview')
      if (response.ok) {
        const data = await response.json()
        setBillingData(data.billing)
      }
    } catch (error) {
      console.error('Failed to load billing data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const changePlan = async (planId: string) => {
    try {
      const response = await fetch('/api/billing/change-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        await loadBillingData()
      }
    } catch (error) {
      console.error('Failed to change plan:', error)
    }
  }

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/download`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice-${invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to download invoice:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((used / limit) * 100, 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'trialing': return 'bg-blue-500'
      case 'past_due': return 'bg-yellow-500'
      case 'canceled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'trialing': return Clock
      case 'past_due': return AlertTriangle
      case 'canceled': return AlertTriangle
      default: return Clock
    }
  }

  if (isLoading || !billingData) {
    return <LoadingScreen />
  }

  const StatusIcon = getStatusIcon(billingData.subscription.status)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <CreditCard className="h-8 w-8" />
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription, usage, and billing information
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Payment Settings
          </Button>
        </div>
      </div>

      {/* Subscription Status Alert */}
      {billingData.subscription.status === 'past_due' && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Your payment is past due. Please update your payment method to avoid service interruption.
          </AlertDescription>
        </Alert>
      )}

      {billingData.subscription.status === 'trialing' && (
        <Alert className="border-blue-500 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            You're currently on a free trial. Your trial ends on {new Date(billingData.subscription.trialEnd!).toLocaleDateString()}.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                <p className="text-2xl font-bold capitalize">{billingData.subscription.plan}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`p-1 rounded-full ${getStatusColor(billingData.subscription.status)}`}>
                    <StatusIcon className="h-3 w-3 text-white" />
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {billingData.subscription.status}
                  </Badge>
                </div>
              </div>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Crown className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Billing</p>
                <p className="text-2xl font-bold">{formatCurrency(billingData.billing.amount)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Due {new Date(billingData.billing.nextBillingDate).toLocaleDateString()}
                </p>
              </div>
              <div className="p-2 bg-green-500 rounded-lg">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                <p className="text-lg font-bold">{billingData.billing.paymentMethod.brand} •••• {billingData.billing.paymentMethod.last4}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {billingData.billing.paymentMethod.type}
                </p>
              </div>
              <div className="p-2 bg-purple-500 rounded-lg">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Usage</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Usage Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Call Minutes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used</span>
                    <span>
                      {billingData.usage.callMinutes.toLocaleString()} / {
                        billingData.usage.callMinutesLimit === -1 
                          ? 'Unlimited' 
                          : billingData.usage.callMinutesLimit.toLocaleString()
                      }
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(billingData.usage.callMinutes, billingData.usage.callMinutesLimit)} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  API Calls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used</span>
                    <span>
                      {billingData.usage.apiCalls.toLocaleString()} / {
                        billingData.usage.apiCallsLimit === -1 
                          ? 'Unlimited' 
                          : billingData.usage.apiCallsLimit.toLocaleString()
                      }
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(billingData.usage.apiCalls, billingData.usage.apiCallsLimit)} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active</span>
                    <span>
                      {billingData.usage.users} / {
                        billingData.usage.usersLimit === -1 
                          ? 'Unlimited' 
                          : billingData.usage.usersLimit
                      }
                    </span>
                  </div>
                  <Progress 
                    value={getUsagePercentage(billingData.usage.users, billingData.usage.usersLimit)} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plans */}
        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {billingData.subscription.plan === plan.id && (
                      <Badge variant="outline">Current</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                    <span className="text-muted-foreground">/month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={billingData.subscription.plan === plan.id ? "outline" : "default"}
                    onClick={() => changePlan(plan.id)}
                    disabled={billingData.subscription.plan === plan.id}
                  >
                    {billingData.subscription.plan === plan.id ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                Download and view your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billingData.invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Receipt className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Invoice #{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadInvoice(invoice.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>
                Manage your payment methods and billing preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Settings Coming Soon</h3>
                <p>Payment method management and billing preferences will be available here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
