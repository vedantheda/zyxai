'use client'

import { useState, useCallback, useMemo, memo } from 'react'
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
import { Badge } from '@/components/ui/badge'
import {
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Users,
  Heart,
  Home,
  Briefcase
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { TaskAutomationService } from '@/lib/taskAutomation'
import ClientSetupService from '@/services/clientSetupService'

interface IntakeFormData {
  // Personal Information
  firstName: string
  lastName: string
  middleName: string
  preferredName: string
  email: string
  phone: string
  dateOfBirth: string
  ssn: string
  citizenship: string

  // Address Information
  address: string
  city: string
  state: string
  zipCode: string
  county: string
  mailingDifferent: boolean
  mailingAddress: string
  mailingCity: string
  mailingState: string
  mailingZipCode: string

  // Spouse Information
  hasSpouse: boolean
  spouseFirstName: string
  spouseLastName: string
  spouseSSN: string
  spouseDateOfBirth: string
  marriageDate: string

  // Tax Information
  filingStatus: string
  clientType: 'individual' | 'business'
  previousYear: boolean
  previousPreparer: string

  // Business Information (if applicable)
  businessName: string
  businessType: string
  ein: string
  businessAddress: string

  // Income Sources
  w2Income: boolean
  selfEmployment: boolean
  rentalIncome: boolean
  investmentIncome: boolean
  retirementIncome: boolean
  socialSecurityIncome: boolean
  unemploymentIncome: boolean
  gamblingIncome: boolean
  otherIncome: string

  // Detailed Deductions & Credits
  homeOwnership: boolean
  mortgageInterest: number
  propertyTaxes: number
  charitableDonations: boolean
  charitableCash: number
  charitableNonCash: number
  medicalExpenses: boolean
  medicalAmount: number
  educationExpenses: boolean
  educationAmount: number
  childcare: boolean
  childcareAmount: number
  dependents: number

  // Life Changes & Special Circumstances
  marriageThisYear: boolean
  divorceThisYear: boolean
  newChild: boolean
  jobChange: boolean
  homePurchase: boolean
  homeSale: boolean
  foreignIncome: boolean
  cryptocurrency: boolean
  estimatedTaxPayments: boolean
  priorYearIssues: boolean
  lifeChanges: string[]
  specialCircumstances: string

  // Service Selection & Preferences
  serviceLevel: string
  communicationPreference: string
  meetingPreference: string
  documentDelivery: string
  updateFrequency: string
  paymentMethod: string
  paymentTiming: string
  urgency: string

  // Consent & Agreements
  consentToContact: boolean
  consentToElectronic: boolean
  privacyPolicy: boolean
  termsOfService: boolean
}

const initialFormData: IntakeFormData = {
  firstName: '',
  lastName: '',
  middleName: '',
  preferredName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  ssn: '',
  citizenship: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  county: '',
  mailingDifferent: false,
  mailingAddress: '',
  mailingCity: '',
  mailingState: '',
  mailingZipCode: '',
  hasSpouse: false,
  spouseFirstName: '',
  spouseLastName: '',
  spouseSSN: '',
  spouseDateOfBirth: '',
  marriageDate: '',
  filingStatus: '',
  clientType: 'individual',
  previousYear: false,
  previousPreparer: '',
  businessName: '',
  businessType: '',
  ein: '',
  businessAddress: '',
  w2Income: false,
  selfEmployment: false,
  rentalIncome: false,
  investmentIncome: false,
  retirementIncome: false,
  socialSecurityIncome: false,
  unemploymentIncome: false,
  gamblingIncome: false,
  otherIncome: '',
  homeOwnership: false,
  mortgageInterest: 0,
  propertyTaxes: 0,
  charitableDonations: false,
  charitableCash: 0,
  charitableNonCash: 0,
  medicalExpenses: false,
  medicalAmount: 0,
  educationExpenses: false,
  educationAmount: 0,
  childcare: false,
  childcareAmount: 0,
  dependents: 0,
  marriageThisYear: false,
  divorceThisYear: false,
  newChild: false,
  jobChange: false,
  homePurchase: false,
  homeSale: false,
  foreignIncome: false,
  cryptocurrency: false,
  estimatedTaxPayments: false,
  priorYearIssues: false,
  lifeChanges: [],
  specialCircumstances: '',
  serviceLevel: '',
  communicationPreference: '',
  meetingPreference: '',
  documentDelivery: '',
  updateFrequency: '',
  paymentMethod: '',
  paymentTiming: '',
  urgency: '',
  consentToContact: false,
  consentToElectronic: false,
  privacyPolicy: false,
  termsOfService: false
}

interface ClientIntakeFormProps {
  onComplete?: (clientId: string) => void
}

// Memoized input component to prevent focus loss
const MemoizedInput = memo(({
  id,
  type = "text",
  value,
  onChange,
  className,
  placeholder,
  ...props
}: {
  id: string
  type?: string
  value: string | number
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  placeholder?: string
  [key: string]: any
}) => (
  <Input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    className={className}
    placeholder={placeholder}
    {...props}
  />
))

MemoizedInput.displayName = 'MemoizedInput'

// Memoized textarea component
const MemoizedTextarea = memo(({
  id,
  value,
  onChange,
  className,
  placeholder,
  ...props
}: {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  className?: string
  placeholder?: string
  [key: string]: any
}) => (
  <Textarea
    id={id}
    value={value}
    onChange={onChange}
    className={className}
    placeholder={placeholder}
    {...props}
  />
))

MemoizedTextarea.displayName = 'MemoizedTextarea'

export default function ClientIntakeForm({ onComplete }: ClientIntakeFormProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalSteps = 9

  // Memoize expensive calculations
  const progress = useMemo(() => (currentStep / totalSteps) * 100, [currentStep])

  const stepTitles = useMemo(() => [
    'Personal Information',
    'Contact & Address',
    'Tax Situation',
    'Income Sources',
    'Tax Situation Details',
    'Deductions & Credits',
    'Life Changes & Special Circumstances',
    'Service Selection & Preferences',
    'Review & Submit'
  ], [])

  // Memoize form update function to prevent unnecessary re-renders
  const updateFormData = useCallback((field: keyof IntakeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      }
      return prev
    })
  }, [])

  // Memoize validation function
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
        if (!formData.email.trim()) newErrors.email = 'Email is required'
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
        break
      case 2:
        if (!formData.address.trim()) newErrors.address = 'Address is required'
        if (!formData.city.trim()) newErrors.city = 'City is required'
        if (!formData.state.trim()) newErrors.state = 'State is required'
        if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required'
        if (formData.hasSpouse) {
          if (!formData.spouseFirstName.trim()) newErrors.spouseFirstName = 'Spouse first name is required'
          if (!formData.spouseLastName.trim()) newErrors.spouseLastName = 'Spouse last name is required'
        }
        break
      case 3:
        if (!formData.filingStatus) newErrors.filingStatus = 'Filing status is required'
        if (formData.clientType === 'business' && !formData.businessName.trim()) {
          newErrors.businessName = 'Business name is required'
        }
        break
      case 8:
        if (!formData.serviceLevel) newErrors.serviceLevel = 'Service level is required'
        if (!formData.communicationPreference) newErrors.communicationPreference = 'Communication preference is required'
        break
      case 9:
        if (!formData.consentToContact) newErrors.consentToContact = 'Consent to contact is required'
        if (!formData.privacyPolicy) newErrors.privacyPolicy = 'Privacy policy acceptance is required'
        if (!formData.termsOfService) newErrors.termsOfService = 'Terms of service acceptance is required'
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Memoize navigation functions
  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }, [currentStep, validateStep, totalSteps])

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }, [])

  // Memoized change handlers to prevent re-renders
  const handleInputChange = useCallback((field: keyof IntakeFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFormData(field, e.target.value)
    }, [updateFormData])

  const handleTextareaChange = useCallback((field: keyof IntakeFormData) =>
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateFormData(field, e.target.value)
    }, [updateFormData])

  const handleNumberChange = useCallback((field: keyof IntakeFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateFormData(field, parseFloat(e.target.value) || 0)
    }, [updateFormData])

  const handleCheckboxChange = useCallback((field: keyof IntakeFormData) =>
    (checked: boolean) => {
      updateFormData(field, checked)
    }, [updateFormData])

  const handleSelectChange = useCallback((field: keyof IntakeFormData) =>
    (value: string) => {
      updateFormData(field, value)
    }, [updateFormData])

  // Memoize submit function
  const submitForm = useCallback(async () => {
    if (!validateStep(currentStep) || !user) return

    setIsSubmitting(true)
    try {
      // Create client record
      const clientData = {
        user_id: user.id,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        type: formData.clientType,
        status: 'intake_complete',
        priority: formData.urgency === 'urgent' ? 'high' : 'medium',
        progress: 0,
        client_details: {
          personal: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dateOfBirth: formData.dateOfBirth,
            ssn: formData.ssn
          },
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
          },
          tax: {
            filingStatus: formData.filingStatus,
            previousYear: formData.previousYear,
            previousPreparer: formData.previousPreparer
          },
          business: formData.clientType === 'business' ? {
            name: formData.businessName,
            type: formData.businessType,
            ein: formData.ein,
            address: formData.businessAddress
          } : null,
          income: {
            w2: formData.w2Income,
            selfEmployment: formData.selfEmployment,
            rental: formData.rentalIncome,
            investment: formData.investmentIncome,
            retirement: formData.retirementIncome,
            other: formData.otherIncome
          },
          deductions: {
            homeOwnership: formData.homeOwnership,
            charitable: formData.charitableDonations,
            medical: formData.medicalExpenses,
            education: formData.educationExpenses,
            childcare: formData.childcare,
            dependents: formData.dependents
          },
          circumstances: {
            lifeChanges: formData.lifeChanges,
            special: formData.specialCircumstances
          },
          preferences: {
            communication: formData.communicationPreference,
            meeting: formData.meetingPreference,
            urgency: formData.urgency
          }
        }
      }

      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single()

      if (clientError) throw clientError

      // Create intake record
      const intakeData = {
        user_id: user.id,
        client_id: client.id,
        form_data: formData,
        status: 'completed',
        submitted_at: new Date().toISOString()
      }

      const { error: intakeError } = await supabase
        .from('client_intakes')
        .insert(intakeData)

      if (intakeError) throw intakeError

      // Complete comprehensive client setup
      const setupData = {
        id: client.id,
        name: client.name,
        email: client.email,
        type: client.type,
        filingStatus: formData.filingStatus,
        serviceLevel: formData.serviceLevel,
        hasSpouse: formData.hasSpouse,
        dependents: formData.dependents,
        homeOwnership: formData.homeOwnership,
        businessName: formData.businessName,
        businessType: formData.businessType
      }

      await ClientSetupService.completeClientSetup(setupData)

      if (onComplete) {
        onComplete(client.id)
      }

    } catch (error) {
      console.error('Error submitting intake form:', error)
      setErrors({ submit: 'Failed to submit form. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }, [currentStep, validateStep, user, formData, onComplete])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Personal Information</h3>
              <p className="text-muted-foreground">Let's start with your basic information</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <MemoizedInput
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange('firstName')}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <MemoizedInput
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange('lastName')}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <MemoizedInput
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <MemoizedInput
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <MemoizedInput
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange('dateOfBirth')}
                  className={errors.dateOfBirth ? 'border-red-500' : ''}
                />
                {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
              </div>
              <div>
                <Label htmlFor="ssn">Social Security Number</Label>
                <MemoizedInput
                  id="ssn"
                  type="password"
                  placeholder="XXX-XX-XXXX"
                  value={formData.ssn}
                  onChange={handleInputChange('ssn')}
                />
                <p className="text-xs text-muted-foreground mt-1">Optional - can be provided later</p>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Contact & Address</h3>
              <p className="text-muted-foreground">Where can we reach you?</p>
            </div>

            <div>
              <Label htmlFor="address">Street Address *</Label>
              <MemoizedInput
                id="address"
                value={formData.address}
                onChange={handleInputChange('address')}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <MemoizedInput
                  id="city"
                  value={formData.city}
                  onChange={handleInputChange('city')}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={handleSelectChange('state')}>
                  <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    {/* Add more states as needed */}
                  </SelectContent>
                </Select>
                {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <MemoizedInput
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange('zipCode')}
                  className={errors.zipCode ? 'border-red-500' : ''}
                />
                {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Tax Situation</h3>
              <p className="text-muted-foreground">Tell us about your tax needs</p>
            </div>

            <div>
              <Label>Client Type</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Card 
                  className={`cursor-pointer transition-colors ${formData.clientType === 'individual' ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => updateFormData('clientType', 'individual')}
                >
                  <CardContent className="p-4 text-center">
                    <User className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">Individual</p>
                    <p className="text-sm text-muted-foreground">Personal tax return</p>
                  </CardContent>
                </Card>
                <Card 
                  className={`cursor-pointer transition-colors ${formData.clientType === 'business' ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => updateFormData('clientType', 'business')}
                >
                  <CardContent className="p-4 text-center">
                    <Building className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-medium">Business</p>
                    <p className="text-sm text-muted-foreground">Business tax return</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <Label htmlFor="filingStatus">Filing Status *</Label>
              <Select value={formData.filingStatus} onValueChange={handleSelectChange('filingStatus')}>
                <SelectTrigger className={errors.filingStatus ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select filing status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married_filing_jointly">Married Filing Jointly</SelectItem>
                  <SelectItem value="married_filing_separately">Married Filing Separately</SelectItem>
                  <SelectItem value="head_of_household">Head of Household</SelectItem>
                  <SelectItem value="qualifying_widow">Qualifying Widow(er)</SelectItem>
                </SelectContent>
              </Select>
              {errors.filingStatus && <p className="text-red-500 text-sm mt-1">{errors.filingStatus}</p>}
            </div>

            {formData.clientType === 'business' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <MemoizedInput
                    id="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange('businessName')}
                    className={errors.businessName ? 'border-red-500' : ''}
                  />
                  {errors.businessName && <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>}
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select value={formData.businessType} onValueChange={handleSelectChange('businessType')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="llc">LLC</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="s_corporation">S Corporation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ein">EIN (Employer Identification Number)</Label>
                  <MemoizedInput
                    id="ein"
                    placeholder="XX-XXXXXXX"
                    value={formData.ein}
                    onChange={handleInputChange('ein')}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="previousYear"
                checked={formData.previousYear}
                onCheckedChange={handleCheckboxChange('previousYear')}
              />
              <Label htmlFor="previousYear">Did you file taxes last year?</Label>
            </div>

            {formData.previousYear && (
              <div>
                <Label htmlFor="previousPreparer">Previous Tax Preparer</Label>
                <MemoizedInput
                  id="previousPreparer"
                  placeholder="Name of previous preparer or 'Self-prepared'"
                  value={formData.previousPreparer}
                  onChange={handleInputChange('previousPreparer')}
                />
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Income Sources</h3>
              <p className="text-muted-foreground">Tell us about all your income sources</p>
            </div>

            <div>
              <Label className="text-base font-medium">Employment & Business Income</Label>
              <p className="text-sm text-muted-foreground mb-4">Check all that apply to you</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'w2Income', label: 'W-2 Employment Income', icon: Briefcase },
                  { key: 'selfEmployment', label: 'Self-Employment Income', icon: User },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={key}
                      checked={formData[key as keyof IntakeFormData] as boolean}
                      onCheckedChange={handleCheckboxChange(key as keyof IntakeFormData)}
                    />
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor={key} className="flex-1 cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Investment & Property Income</Label>
              <p className="text-sm text-muted-foreground mb-4">Check all that apply to you</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'investmentIncome', label: 'Investment Income (Interest, Dividends)', icon: DollarSign },
                  { key: 'rentalIncome', label: 'Rental Property Income', icon: Home },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={key}
                      checked={formData[key as keyof IntakeFormData] as boolean}
                      onCheckedChange={handleCheckboxChange(key as keyof IntakeFormData)}
                    />
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor={key} className="flex-1 cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Retirement & Government Income</Label>
              <p className="text-sm text-muted-foreground mb-4">Check all that apply to you</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'retirementIncome', label: 'Retirement Income (401k, IRA)', icon: Calendar },
                  { key: 'socialSecurityIncome', label: 'Social Security Benefits', icon: User },
                  { key: 'unemploymentIncome', label: 'Unemployment Compensation', icon: FileText },
                  { key: 'gamblingIncome', label: 'Gambling/Lottery Winnings', icon: DollarSign },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={key}
                      checked={formData[key as keyof IntakeFormData] as boolean}
                      onCheckedChange={handleCheckboxChange(key as keyof IntakeFormData)}
                    />
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor={key} className="flex-1 cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="otherIncome">Other Income Sources</Label>
              <MemoizedTextarea
                id="otherIncome"
                placeholder="Describe any other income sources (alimony, jury duty, prizes, etc.)..."
                value={formData.otherIncome}
                onChange={handleTextareaChange('otherIncome')}
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Tax Situation Details</h3>
              <p className="text-muted-foreground">Additional details about your tax situation</p>
            </div>

            <div>
              <Label htmlFor="dependents">Number of Dependents</Label>
              <Input
                id="dependents"
                type="number"
                min="0"
                value={formData.dependents}
                onChange={(e) => updateFormData('dependents', parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">Children and other qualifying dependents</p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasSpouse"
                checked={formData.hasSpouse}
                onCheckedChange={handleCheckboxChange('hasSpouse')}
              />
              <Label htmlFor="hasSpouse">I am married and want to include spouse information</Label>
            </div>

            {formData.hasSpouse && (
              <div className="space-y-4 p-4 border rounded-lg bg-accent/50">
                <h4 className="font-medium">Spouse Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="spouseFirstName">Spouse First Name</Label>
                    <MemoizedInput
                      id="spouseFirstName"
                      value={formData.spouseFirstName}
                      onChange={handleInputChange('spouseFirstName')}
                      className={errors.spouseFirstName ? 'border-red-500' : ''}
                    />
                    {errors.spouseFirstName && <p className="text-red-500 text-sm mt-1">{errors.spouseFirstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="spouseLastName">Spouse Last Name</Label>
                    <MemoizedInput
                      id="spouseLastName"
                      value={formData.spouseLastName}
                      onChange={handleInputChange('spouseLastName')}
                      className={errors.spouseLastName ? 'border-red-500' : ''}
                    />
                    {errors.spouseLastName && <p className="text-red-500 text-sm mt-1">{errors.spouseLastName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="spouseDateOfBirth">Spouse Date of Birth</Label>
                    <MemoizedInput
                      id="spouseDateOfBirth"
                      type="date"
                      value={formData.spouseDateOfBirth}
                      onChange={handleInputChange('spouseDateOfBirth')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="marriageDate">Marriage Date</Label>
                    <MemoizedInput
                      id="marriageDate"
                      type="date"
                      value={formData.marriageDate}
                      onChange={handleInputChange('marriageDate')}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="specialCircumstances">Special Tax Circumstances</Label>
              <MemoizedTextarea
                id="specialCircumstances"
                placeholder="Any special circumstances we should know about? (divorce, new business, major life changes, etc.)"
                value={formData.specialCircumstances}
                onChange={handleTextareaChange('specialCircumstances')}
              />
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <DollarSign className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Deductions & Credits</h3>
              <p className="text-muted-foreground">Help us maximize your tax savings</p>
            </div>

            <div>
              <Label className="text-base font-medium">Homeownership Deductions</Label>
              <p className="text-sm text-muted-foreground mb-4">Check all that apply to you</p>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="homeOwnership"
                    checked={formData.homeOwnership}
                    onCheckedChange={(checked) => updateFormData('homeOwnership', checked)}
                  />
                  <Label htmlFor="homeOwnership">I own my home</Label>
                </div>

                {formData.homeOwnership && (
                  <div className="ml-6 space-y-4 p-4 border rounded-lg bg-accent/50">
                    <div>
                      <Label htmlFor="mortgageInterest">Mortgage Interest Paid (Annual)</Label>
                      <Input
                        id="mortgageInterest"
                        type="number"
                        placeholder="0"
                        value={formData.mortgageInterest || ''}
                        onChange={(e) => updateFormData('mortgageInterest', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="propertyTaxes">Property Taxes Paid (Annual)</Label>
                      <Input
                        id="propertyTaxes"
                        type="number"
                        placeholder="0"
                        value={formData.propertyTaxes || ''}
                        onChange={(e) => updateFormData('propertyTaxes', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Charitable Contributions</Label>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charitableDonations"
                    checked={formData.charitableDonations}
                    onCheckedChange={(checked) => updateFormData('charitableDonations', checked)}
                  />
                  <Label htmlFor="charitableDonations">I made charitable donations</Label>
                </div>

                {formData.charitableDonations && (
                  <div className="ml-6 space-y-4 p-4 border rounded-lg bg-accent/50">
                    <div>
                      <Label htmlFor="charitableCash">Cash Donations</Label>
                      <Input
                        id="charitableCash"
                        type="number"
                        placeholder="0"
                        value={formData.charitableCash || ''}
                        onChange={(e) => updateFormData('charitableCash', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="charitableNonCash">Non-Cash Donations (Clothing, etc.)</Label>
                      <Input
                        id="charitableNonCash"
                        type="number"
                        placeholder="0"
                        value={formData.charitableNonCash || ''}
                        onChange={(e) => updateFormData('charitableNonCash', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Medical & Education Expenses</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="medicalExpenses"
                      checked={formData.medicalExpenses}
                      onCheckedChange={(checked) => updateFormData('medicalExpenses', checked)}
                    />
                    <Label htmlFor="medicalExpenses">Significant medical expenses</Label>
                  </div>

                  {formData.medicalExpenses && (
                    <div className="ml-6">
                      <Label htmlFor="medicalAmount">Medical Expenses Amount</Label>
                      <Input
                        id="medicalAmount"
                        type="number"
                        placeholder="0"
                        value={formData.medicalAmount || ''}
                        onChange={(e) => updateFormData('medicalAmount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="educationExpenses"
                      checked={formData.educationExpenses}
                      onCheckedChange={(checked) => updateFormData('educationExpenses', checked)}
                    />
                    <Label htmlFor="educationExpenses">Education expenses</Label>
                  </div>

                  {formData.educationExpenses && (
                    <div className="ml-6">
                      <Label htmlFor="educationAmount">Education Expenses Amount</Label>
                      <Input
                        id="educationAmount"
                        type="number"
                        placeholder="0"
                        value={formData.educationAmount || ''}
                        onChange={(e) => updateFormData('educationAmount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Childcare Expenses</Label>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="childcare"
                    checked={formData.childcare}
                    onCheckedChange={(checked) => updateFormData('childcare', checked)}
                  />
                  <Label htmlFor="childcare">I paid for childcare/daycare</Label>
                </div>

                {formData.childcare && (
                  <div className="ml-6">
                    <Label htmlFor="childcareAmount">Childcare Expenses Amount</Label>
                    <Input
                      id="childcareAmount"
                      type="number"
                      placeholder="0"
                      value={formData.childcareAmount || ''}
                      onChange={(e) => updateFormData('childcareAmount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Life Changes & Special Circumstances</h3>
              <p className="text-muted-foreground">Major life events that may affect your taxes</p>
            </div>

            <div>
              <Label className="text-base font-medium">Major Life Events This Year</Label>
              <p className="text-sm text-muted-foreground mb-4">Check all that apply</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'marriageThisYear', label: 'Got married' },
                  { key: 'divorceThisYear', label: 'Got divorced' },
                  { key: 'newChild', label: 'Had a baby or adopted' },
                  { key: 'jobChange', label: 'Changed jobs' },
                  { key: 'homePurchase', label: 'Bought a home' },
                  { key: 'homeSale', label: 'Sold a home' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={key}
                      checked={formData[key as keyof IntakeFormData] as boolean}
                      onCheckedChange={(checked) => updateFormData(key as keyof IntakeFormData, checked)}
                    />
                    <Label htmlFor={key} className="flex-1 cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Special Tax Situations</Label>
              <p className="text-sm text-muted-foreground mb-4">Check all that apply</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'foreignIncome', label: 'Foreign income or accounts' },
                  { key: 'cryptocurrency', label: 'Cryptocurrency transactions' },
                  { key: 'estimatedTaxPayments', label: 'Made estimated tax payments' },
                  { key: 'priorYearIssues', label: 'Prior year tax issues' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={key}
                      checked={formData[key as keyof IntakeFormData] as boolean}
                      onCheckedChange={(checked) => updateFormData(key as keyof IntakeFormData, checked)}
                    />
                    <Label htmlFor={key} className="flex-1 cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Service Selection & Preferences</h3>
              <p className="text-muted-foreground">Choose your service level and preferences</p>
            </div>

            <div>
              <Label htmlFor="serviceLevel">Service Level</Label>
              <Select value={formData.serviceLevel} onValueChange={(value) => updateFormData('serviceLevel', value)}>
                <SelectTrigger className={errors.serviceLevel ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select service level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic - Tax Return Preparation ($150)</SelectItem>
                  <SelectItem value="standard">Standard - Tax Return + Review ($250)</SelectItem>
                  <SelectItem value="premium">Premium - Full Service + Planning ($400)</SelectItem>
                  <SelectItem value="business">Business - Business Tax Services ($500+)</SelectItem>
                </SelectContent>
              </Select>
              {errors.serviceLevel && <p className="text-red-500 text-sm mt-1">{errors.serviceLevel}</p>}
            </div>

            <div>
              <Label htmlFor="communicationPreference">Preferred Communication Method</Label>
              <Select value={formData.communicationPreference} onValueChange={(value) => updateFormData('communicationPreference', value)}>
                <SelectTrigger className={errors.communicationPreference ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select communication preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="portal">Client Portal</SelectItem>
                </SelectContent>
              </Select>
              {errors.communicationPreference && <p className="text-red-500 text-sm mt-1">{errors.communicationPreference}</p>}
            </div>

            <div>
              <Label htmlFor="meetingPreference">Meeting Preference</Label>
              <Select value={formData.meetingPreference} onValueChange={(value) => updateFormData('meetingPreference', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select meeting preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="video_call">Video Call</SelectItem>
                  <SelectItem value="phone_call">Phone Call</SelectItem>
                  <SelectItem value="no_meeting">No Meeting Needed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="documentDelivery">Document Delivery Preference</Label>
              <Select value={formData.documentDelivery} onValueChange={(value) => updateFormData('documentDelivery', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document delivery preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronic">Electronic (Email/Portal)</SelectItem>
                  <SelectItem value="mail">Physical Mail</SelectItem>
                  <SelectItem value="pickup">In-Person Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgency">Service Urgency</Label>
              <Select value={formData.urgency} onValueChange={(value) => updateFormData('urgency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (2-3 weeks)</SelectItem>
                  <SelectItem value="expedited">Expedited (1 week) - Additional $50</SelectItem>
                  <SelectItem value="urgent">Urgent (3-5 days) - Additional $100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={formData.paymentMethod} onValueChange={(value) => updateFormData('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="refund_deduction">Deduct from Tax Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 9:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Review & Submit</h3>
              <p className="text-muted-foreground">Please review your information and agree to our terms</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Application Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm text-muted-foreground">{formData.firstName} {formData.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Client Type</p>
                    <p className="text-sm text-muted-foreground">{formData.clientType === 'individual' ? 'Individual' : 'Business'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Filing Status</p>
                    <p className="text-sm text-muted-foreground">{formData.filingStatus.replace('_', ' ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentToContact"
                  checked={formData.consentToContact}
                  onCheckedChange={(checked) => updateFormData('consentToContact', checked)}
                  className={errors.consentToContact ? 'border-red-500' : ''}
                />
                <div className="flex-1">
                  <Label htmlFor="consentToContact" className="cursor-pointer">
                    I consent to be contacted by this tax practice regarding my tax preparation services *
                  </Label>
                  {errors.consentToContact && <p className="text-red-500 text-sm mt-1">{errors.consentToContact}</p>}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentToElectronic"
                  checked={formData.consentToElectronic}
                  onCheckedChange={(checked) => updateFormData('consentToElectronic', checked)}
                />
                <Label htmlFor="consentToElectronic" className="cursor-pointer">
                  I consent to electronic delivery of tax documents and communications
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacyPolicy"
                  checked={formData.privacyPolicy}
                  onCheckedChange={(checked) => updateFormData('privacyPolicy', checked)}
                  className={errors.privacyPolicy ? 'border-red-500' : ''}
                />
                <div className="flex-1">
                  <Label htmlFor="privacyPolicy" className="cursor-pointer">
                    I have read and agree to the <a href="#" className="text-primary underline">Privacy Policy</a> *
                  </Label>
                  {errors.privacyPolicy && <p className="text-red-500 text-sm mt-1">{errors.privacyPolicy}</p>}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="termsOfService"
                  checked={formData.termsOfService}
                  onCheckedChange={(checked) => updateFormData('termsOfService', checked)}
                  className={errors.termsOfService ? 'border-red-500' : ''}
                />
                <div className="flex-1">
                  <Label htmlFor="termsOfService" className="cursor-pointer">
                    I agree to the <a href="#" className="text-primary underline">Terms of Service</a> *
                  </Label>
                  {errors.termsOfService && <p className="text-red-500 text-sm mt-1">{errors.termsOfService}</p>}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return <div>Step {currentStep} content</div>
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Client Intake Form</CardTitle>
            <CardDescription>
              Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
            </CardDescription>
          </div>
          <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>

      <CardContent className="space-y-6">
        {renderStep()}

        {errors.submit && (
          <div className="text-red-500 text-sm text-center">{errors.submit}</div>
        )}

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={nextStep}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={submitForm} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
