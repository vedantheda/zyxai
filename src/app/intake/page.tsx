'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  User,
  Building,
  DollarSign,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Send
} from 'lucide-react'
import { toast } from 'sonner'
interface IntakeFormData {
  // Personal Information
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  ssn: string
  // Address
  address: string
  city: string
  state: string
  zipCode: string
  // Client Type & Services
  clientType: 'individual' | 'business' | 'both'
  filingStatus: string
  serviceLevel: string
  // Business Information (if applicable)
  businessName?: string
  businessType?: string
  ein?: string
  // Tax Situation
  previousYear: boolean
  previousPreparer: string
  estimatedIncome: string
  hasW2: boolean
  has1099: boolean
  hasBusinessIncome: boolean
  hasRentalIncome: boolean
  hasInvestments: boolean
  // Special Circumstances
  specialCircumstances: string[]
  additionalNotes: string
  // Consent & Agreements
  consentToContact: boolean
  consentToElectronic: boolean
  agreesToTerms: boolean
}
const INTAKE_STEPS = [
  { id: 'personal', title: 'Personal Information', icon: User },
  { id: 'client-type', title: 'Client Type & Services', icon: Building },
  { id: 'tax-situation', title: 'Tax Situation', icon: DollarSign },
  { id: 'review', title: 'Review & Submit', icon: CheckCircle }
]
export default function IntakeFormPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<IntakeFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ssn: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    clientType: 'individual',
    filingStatus: '',
    serviceLevel: '',
    businessName: '',
    businessType: '',
    ein: '',
    previousYear: false,
    previousPreparer: '',
    estimatedIncome: '',
    hasW2: false,
    has1099: false,
    hasBusinessIncome: false,
    hasRentalIncome: false,
    hasInvestments: false,
    specialCircumstances: [],
    additionalNotes: '',
    consentToContact: false,
    consentToElectronic: false,
    agreesToTerms: false
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const updateFormData = (field: keyof IntakeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}
    switch (currentStep) {
      case 0: // Personal Information
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
        if (!formData.email.trim()) newErrors.email = 'Email is required'
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
        if (!formData.address.trim()) newErrors.address = 'Address is required'
        break
      case 1: // Client Type & Services
        if (!formData.clientType) newErrors.clientType = 'Client type is required'
        if (!formData.serviceLevel) newErrors.serviceLevel = 'Service level is required'
        break
      case 2: // Tax Situation
        if (!formData.estimatedIncome) newErrors.estimatedIncome = 'Estimated income is required'
        break
      case 3: // Review & Submit
        if (!formData.consentToContact) newErrors.consentToContact = 'Consent to contact is required'
        if (!formData.consentToElectronic) newErrors.consentToElectronic = 'Consent to electronic communication is required'
        if (!formData.agreesToTerms) newErrors.agreesToTerms = 'Agreement to terms is required'
        break
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const nextStep = () => {
    if (validateCurrentStep() && currentStep < INTAKE_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }
  const submitForm = async () => {
    if (!validateCurrentStep()) return
    setLoading(true)
    try {
      
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          practiceId: 'demo-practice-001' // In production, this would come from the practice
        }),
      })
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit form')
      }
      
      toast.success('Intake form submitted successfully! Automated onboarding has begun.')
      // Store the client ID for the success page
      if (result.data.clientId) {
        localStorage.setItem('newClientId', result.data.clientId)
      }
      router.push('/intake/success')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit intake form. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  const progress = ((currentStep + 1) / INTAKE_STEPS.length) * 100
  const renderPersonalInformation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => updateFormData('address', e.target.value)}
          className={errors.address ? 'border-red-500' : ''}
        />
        {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => updateFormData('state', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">ZIP Code</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => updateFormData('zipCode', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
  const renderClientTypeServices = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Client Type *</Label>
        <Select value={formData.clientType} onValueChange={(value: string) => updateFormData('clientType', value as 'individual' | 'business' | 'both')}>
          <SelectTrigger>
            <SelectValue placeholder="Select client type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Individual</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="both">Both Individual & Business</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Service Level *</Label>
        <Select value={formData.serviceLevel} onValueChange={(value) => updateFormData('serviceLevel', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select service level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="basic">Basic Tax Preparation - $199</SelectItem>
            <SelectItem value="standard">Standard Service - $399</SelectItem>
            <SelectItem value="premium">Premium Service - $699</SelectItem>
            <SelectItem value="business">Business Tax Service - $999</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {formData.clientType !== 'individual' && (
        <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
          <h4 className="font-medium">Business Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName || ''}
                onChange={(e) => updateFormData('businessName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Business Type</Label>
              <Select value={formData.businessType || ''} onValueChange={(value) => updateFormData('businessType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="llc">LLC</SelectItem>
                  <SelectItem value="corporation">Corporation</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
  const renderTaxSituation = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Estimated Annual Income *</Label>
        <Select value={formData.estimatedIncome} onValueChange={(value) => updateFormData('estimatedIncome', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select income range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="under-25k">Under $25,000</SelectItem>
            <SelectItem value="25k-50k">$25,000 - $50,000</SelectItem>
            <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
            <SelectItem value="100k-200k">$100,000 - $200,000</SelectItem>
            <SelectItem value="over-200k">Over $200,000</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        <Label>Income Sources (check all that apply)</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'hasW2', label: 'W-2 (Employment Income)' },
            { key: 'has1099', label: '1099 (Contract/Freelance)' },
            { key: 'hasBusinessIncome', label: 'Business Income' },
            { key: 'hasRentalIncome', label: 'Rental Income' },
            { key: 'hasInvestments', label: 'Investment Income' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={key}
                checked={formData[key as keyof IntakeFormData] as boolean}
                onCheckedChange={(checked) => updateFormData(key as keyof IntakeFormData, checked)}
              />
              <Label htmlFor={key}>{label}</Label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="additionalNotes">Additional Notes</Label>
        <Textarea
          id="additionalNotes"
          placeholder="Any additional information about your tax situation..."
          value={formData.additionalNotes}
          onChange={(e) => updateFormData('additionalNotes', e.target.value)}
          rows={4}
        />
      </div>
    </div>
  )
  const renderReviewSubmit = () => (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg bg-accent/50">
        <h4 className="font-medium mb-4">Review Your Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Name:</strong> {formData.firstName} {formData.lastName}
          </div>
          <div>
            <strong>Email:</strong> {formData.email}
          </div>
          <div>
            <strong>Client Type:</strong> {formData.clientType}
          </div>
          <div>
            <strong>Service Level:</strong> {formData.serviceLevel}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="consentToContact"
            checked={formData.consentToContact}
            onCheckedChange={(checked) => updateFormData('consentToContact', checked)}
          />
          <Label htmlFor="consentToContact">
            I consent to be contacted by email and phone regarding my tax preparation services *
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="consentToElectronic"
            checked={formData.consentToElectronic}
            onCheckedChange={(checked) => updateFormData('consentToElectronic', checked)}
          />
          <Label htmlFor="consentToElectronic">
            I agree to receive documents and communications electronically *
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="agreesToTerms"
            checked={formData.agreesToTerms}
            onCheckedChange={(checked) => updateFormData('agreesToTerms', checked)}
          />
          <Label htmlFor="agreesToTerms">
            I agree to the terms of service and engagement letter *
          </Label>
        </div>
      </div>
      {Object.keys(errors).length > 0 && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600 text-sm">Please complete all required fields and agreements.</p>
        </div>
      )}
    </div>
  )
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderPersonalInformation()
      case 1: return renderClientTypeServices()
      case 2: return renderTaxSituation()
      case 3: return renderReviewSubmit()
      default: return null
    }
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold">Client Intake Form</h1>
              <p className="text-muted-foreground">
                Please provide your information to begin the tax preparation process
              </p>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {INTAKE_STEPS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
      {/* Step Navigation */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center space-x-4">
              {INTAKE_STEPS.map((step, index) => {
                const isCurrent = index === currentStep
                const isCompleted = index < currentStep
                return (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium ${
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-green-100 text-green-800'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <step.icon className="w-4 h-4" />
                    <span className="hidden md:inline">{step.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {React.createElement(INTAKE_STEPS[currentStep].icon, { className: "w-5 h-5" })}
                <span>{INTAKE_STEPS[currentStep].title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderStepContent()}
            </CardContent>
          </Card>
          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            {currentStep === INTAKE_STEPS.length - 1 ? (
              <Button onClick={submitForm} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Intake Form
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
