'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { CheckCircle, Star, Zap, Shield, Users } from 'lucide-react'

interface ServiceSelectionData {
  selectedService: string
  preferredStartDate: string
  communicationPreference: string
  specialRequests: string
}

interface ServiceSelectionStepProps {
  data: Partial<ServiceSelectionData>
  onUpdate: (data: Partial<ServiceSelectionData>) => void
  onNext: () => void
  onComplete: () => void
  isLastStep: boolean
}

const SERVICE_PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Tax Preparation',
    price: '$149',
    description: 'Perfect for simple tax situations',
    features: [
      'W-2 and 1099 processing',
      'Standard deduction optimization',
      'Basic tax credits',
      'E-filing included',
      'Email support'
    ],
    icon: CheckCircle,
    color: 'border-gray-200',
    recommended: false
  },
  {
    id: 'standard',
    name: 'Standard Tax Service',
    price: '$249',
    description: 'Most popular for typical tax situations',
    features: [
      'All Basic features',
      'Itemized deduction analysis',
      'Investment income reporting',
      'Rental property income',
      'Phone consultation included',
      'Tax planning advice'
    ],
    icon: Star,
    color: 'border-blue-200 bg-blue-50',
    recommended: true
  },
  {
    id: 'premium',
    name: 'Premium Tax Service',
    price: '$399',
    description: 'Comprehensive service for complex situations',
    features: [
      'All Standard features',
      'Business income & expenses',
      'Multi-state tax returns',
      'Advanced tax strategies',
      'Dedicated tax professional',
      'Year-round tax support',
      'Audit protection'
    ],
    icon: Zap,
    color: 'border-purple-200 bg-purple-50',
    recommended: false
  },
  {
    id: 'business',
    name: 'Business Tax Service',
    price: '$599',
    description: 'Specialized service for business owners',
    features: [
      'All Premium features',
      'Business tax return preparation',
      'Quarterly tax planning',
      'Payroll tax guidance',
      'Business expense optimization',
      'Entity structure advice',
      'Priority support'
    ],
    icon: Users,
    color: 'border-green-200 bg-green-50',
    recommended: false
  }
]

export default function ServiceSelectionStep({
  data,
  onUpdate,
  onNext,
  onComplete,
  isLastStep
}: ServiceSelectionStepProps) {
  const [formData, setFormData] = useState<Partial<ServiceSelectionData>>(data)

  useEffect(() => {
    onUpdate(formData)
  }, [formData, onUpdate])

  const updateField = (field: keyof ServiceSelectionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleComplete = () => {
    onComplete()
  }

  const selectedPackage = SERVICE_PACKAGES.find(pkg => pkg.id === formData.selectedService)

  return (
    <div className="space-y-8">
      {/* Service Packages */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold">Choose Your Tax Service</h3>
          <p className="text-muted-foreground mt-2">
            Select the service level that best fits your tax situation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SERVICE_PACKAGES.map((pkg) => {
            const Icon = pkg.icon
            const isSelected = formData.selectedService === pkg.id
            
            return (
              <Card 
                key={pkg.id} 
                className={`relative cursor-pointer transition-all hover:shadow-lg ${pkg.color} ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => updateField('selectedService', pkg.id)}
              >
                {pkg.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold text-primary">{pkg.price}</div>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-6">
                    <RadioGroup
                      value={formData.selectedService || ''}
                      onValueChange={(value) => updateField('selectedService', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value={pkg.id} id={pkg.id} />
                        <Label htmlFor={pkg.id} className="font-medium">
                          Select {pkg.name}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Selected Service Summary */}
      {selectedPackage && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>Your Selected Service</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-lg">{selectedPackage.name}</h4>
                <p className="text-muted-foreground">{selectedPackage.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{selectedPackage.price}</div>
                <p className="text-sm text-muted-foreground">One-time fee</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h5 className="font-medium">Account Setup</h5>
                <p className="text-sm text-muted-foreground">
                  We'll create your secure account and set up your tax return workspace
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h5 className="font-medium">Document Collection</h5>
                <p className="text-sm text-muted-foreground">
                  Upload your tax documents (W-2s, 1099s, receipts) through our secure portal
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h5 className="font-medium">Tax Preparation</h5>
                <p className="text-sm text-muted-foreground">
                  Our tax professionals will prepare your return and identify all available deductions
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                4
              </div>
              <div>
                <h5 className="font-medium">Review & Filing</h5>
                <p className="text-sm text-muted-foreground">
                  Review your completed return, ask questions, and we'll file it electronically
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleComplete} 
          size="lg" 
          className="px-8"
          disabled={!formData.selectedService}
        >
          Complete Setup & Get Started
        </Button>
      </div>

      {/* Trust Indicators */}
      <div className="text-center space-y-2">
        <div className="flex justify-center items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Shield className="w-4 h-4" />
            <span>Bank-level security</span>
          </div>
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4" />
            <span>IRS-approved e-filing</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4" />
            <span>100% accuracy guarantee</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Your information is encrypted and secure. We never share your data with third parties.
        </p>
      </div>
    </div>
  )
}
