'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  Mail,
  FileText,
  FolderPlus,
  Users,
  Calendar,
  ArrowRight,
  Download,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'

export default function IntakeSuccessPage() {
  const automatedTasks = [
    {
      name: 'CRM Entry Created',
      description: 'Your client profile has been automatically created in our system',
      status: 'completed',
      icon: Users,
      timestamp: 'Just now'
    },
    {
      name: 'Folder Structure Created',
      description: 'Organized digital folders have been set up for your documents',
      status: 'completed',
      icon: FolderPlus,
      timestamp: 'Just now'
    },
    {
      name: 'Welcome Email Sent',
      description: 'Welcome email with next steps has been sent to your inbox',
      status: 'completed',
      icon: Mail,
      timestamp: 'Just now'
    },
    {
      name: 'Engagement Letter Generated',
      description: 'Your engagement letter is being prepared for e-signature',
      status: 'in_progress',
      icon: FileText,
      timestamp: 'In progress'
    },
    {
      name: 'Document Checklist Prepared',
      description: 'Customized document checklist based on your tax situation',
      status: 'pending',
      icon: CheckCircle,
      timestamp: 'Coming soon'
    },
    {
      name: 'Initial Consultation Scheduled',
      description: 'Calendar invitation for your initial consultation',
      status: 'pending',
      icon: Calendar,
      timestamp: 'Coming soon'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress': return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      case 'pending': return <div className="w-4 h-4 border-2 border-yellow-600 rounded-full" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Intake Form Submitted Successfully!</h1>
            <p className="text-muted-foreground text-lg">
              Thank you for choosing our tax preparation services. Your automated onboarding process has begun.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* What Happens Next */}
          <Card>
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
              <CardDescription>
                Our automated system is already working on your behalf. Here's what's happening behind the scenes:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {automatedTasks.map((task, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{task.name}</h4>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <p className="text-xs text-muted-foreground">{task.timestamp}</p>
                    </div>
                    <task.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="w-5 h-5" />
                  <span>Check Your Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We've sent you a welcome email with important information including:
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Your client portal login credentials</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Document upload instructions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Next steps in the process</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Contact information for questions</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Engagement Letter</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your engagement letter is being prepared and will be sent for e-signature within the next hour.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Document Generation</span>
                    <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>E-Signature Setup</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Email Delivery</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Information */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">Important Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Timeline</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Engagement letter: Within 1 hour</li>
                    <li>• Document checklist: Within 2 hours</li>
                    <li>• Initial consultation: Within 24 hours</li>
                    <li>• Document collection: 3-5 business days</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Contact Information</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Email: support@neuronize.com</li>
                    <li>• Phone: (555) 123-4567</li>
                    <li>• Hours: Mon-Fri 9AM-6PM EST</li>
                    <li>• Emergency: Available 24/7</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/client-portal">
                <Users className="w-4 h-4 mr-2" />
                Access Client Portal
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/documents">
                <Download className="w-4 h-4 mr-2" />
                Download Document Checklist
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
              </Link>
            </Button>
          </div>

          {/* Reference Information */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h4 className="font-medium">Reference Information</h4>
                <p className="text-sm text-muted-foreground">
                  Please save this information for your records:
                </p>
                <div className="inline-flex items-center space-x-4 text-sm bg-accent px-4 py-2 rounded-lg">
                  <span><strong>Client ID:</strong> CLT-2024-001</span>
                  <span><strong>Submission Date:</strong> {new Date().toLocaleDateString()}</span>
                  <span><strong>Service Level:</strong> Standard</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
