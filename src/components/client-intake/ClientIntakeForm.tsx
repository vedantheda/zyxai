'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  User,
  Users,
  Building,
  DollarSign,
  FileText,
  Shield,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Home,
  Briefcase,
  TrendingUp,
  Heart
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Comprehensive intake form schema
const clientIntakeSchema = z.object({
  // Personal Information
  personalInfo: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    middleName: z.string().optional(),
    ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'SSN must be in format XXX-XX-XXXX'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Phone number is required'),
    address: z.object({
      street: z.string().min(1, 'Street address is required'),
      city: z.string().min(1, 'City is required'),
      state: z.string().min(2, 'State is required'),
      zipCode: z.string().min(5, 'ZIP code is required'),
    }),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
    occupation: z.string().min(1, 'Occupation is required'),
    employer: z.string().optional(),
  }),

  // Spouse Information (if married)
  spouseInfo: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    ssn: z.string().optional(),
    dateOfBirth: z.string().optional(),
    occupation: z.string().optional(),
    employer: z.string().optional(),
  }).optional(),

  // Dependents
  dependents: z.array(z.object({
    firstName: z.string(),
    lastName: z.string(),
    ssn: z.string().optional(),
    dateOfBirth: z.string(),
    relationship: z.string(),
    qualifyingChild: z.boolean(),
    qualifyingRelative: z.boolean(),
  })).optional(),

  // Tax Situation
  taxSituation: z.object({
    filingStatus: z.enum(['single', 'married_joint', 'married_separate', 'head_of_household']),
    previousYearAGI: z.number().min(0).optional(),
    estimatedCurrentYearIncome: z.number().min(0).optional(),
    hasW2Income: z.boolean(),
    hasSelfEmploymentIncome: z.boolean(),
    hasBusinessIncome: z.boolean(),
    hasRentalIncome: z.boolean(),
    hasInvestmentIncome: z.boolean(),
    hasForeignIncome: z.boolean(),
    hasRetirementIncome: z.boolean(),
    hasUnemploymentIncome: z.boolean(),
    hasSocialSecurityIncome: z.boolean(),
    hasGamblingWinnings: z.boolean(),
    hasOtherIncome: z.boolean(),
    otherIncomeDescription: z.string().optional(),
  }),

  // Deductions & Credits
  deductionsCredits: z.object({
    itemizeDeductions: z.boolean(),
    hasMortgageInterest: z.boolean(),
    hasCharitableContributions: z.boolean(),
    hasStateLocalTaxes: z.boolean(),
    hasMedicalExpenses: z.boolean(),
    hasEducationExpenses: z.boolean(),
    hasChildcareExpenses: z.boolean(),
    hasBusinessExpenses: z.boolean(),
    hasHomeOfficeExpenses: z.boolean(),
    hasVehicleExpenses: z.boolean(),
    estimatedCharitableContributions: z.number().min(0).optional(),
    estimatedMortgageInterest: z.number().min(0).optional(),
  }),

  // Business Information
  businessInfo: z.object({
    hasActiveBusiness: z.boolean(),
    businessName: z.string().optional(),
    businessType: z.enum(['sole_proprietorship', 'partnership', 'llc', 's_corp', 'c_corp']).optional(),
    ein: z.string().optional(),
    businessAddress: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
    }).optional(),
    industryCode: z.string().optional(),
    hasEmployees: z.boolean(),
    payrollProvider: z.string().optional(),
    bookkeepingMethod: z.enum(['cash', 'accrual']).optional(),
    hasBusinessVehicle: z.boolean(),
    hasEquipmentPurchases: z.boolean(),
  }),

  // Investment Information
  investmentInfo: z.object({
    hasBrokerageAccounts: z.boolean(),
    brokerageNames: z.array(z.string()).optional(),
    hasCryptocurrency: z.boolean(),
    hasRealEstateInvestments: z.boolean(),
    hasRetirementAccounts: z.boolean(),
    has529Plans: z.boolean(),
    hasStockOptions: z.boolean(),
    hasForeignAccounts: z.boolean(),
  }),

  // Service Preferences
  servicePreferences: z.object({
    servicesRequested: z.array(z.string()),
    communicationPreference: z.enum(['email', 'phone', 'text', 'portal']),
    meetingPreference: z.enum(['in_person', 'virtual', 'phone']),
    documentDeliveryPreference: z.enum(['email', 'portal', 'mail']),
    urgencyLevel: z.enum(['standard', 'expedited', 'rush']),
    budgetRange: z.enum(['under_500', '500_1000', '1000_2500', '2500_5000', 'over_5000']),
  }),

  // Authorizations
  authorizations: z.object({
    irsRepresentation: z.boolean(),
    stateRepresentation: z.boolean(),
    priorYearAccess: z.boolean(),
    spouseAuthorization: z.boolean(),
    electronicFiling: z.boolean(),
    directDeposit: z.boolean(),
    thirdPartyDisclosures: z.array(z.string()).optional(),
  }),

  // Additional Information
  additionalInfo: z.object({
    specialCircumstances: z.string().optional(),
    questionsOrConcerns: z.string().optional(),
    referralSource: z.string().optional(),
    previousTaxPreparer: z.string().optional(),
    hasOutstandingTaxIssues: z.boolean(),
    taxIssueDescription: z.string().optional(),
  }),
})

type ClientIntakeFormData = z.infer<typeof clientIntakeSchema>

const FORM_STEPS = [
  { id: 'personal', title: 'Personal Information', icon: User },
  { id: 'family', title: 'Family & Dependents', icon: Users },
  { id: 'tax', title: 'Tax Situation', icon: DollarSign },
  { id: 'deductions', title: 'Deductions & Credits', icon: FileText },
  { id: 'business', title: 'Business Information', icon: Building },
  { id: 'investments', title: 'Investments', icon: TrendingUp },
  { id: 'preferences', title: 'Service Preferences', icon: Heart },
  { id: 'authorization', title: 'Authorizations', icon: Shield },
  { id: 'additional', title: 'Additional Information', icon: FileText },
  { id: 'review', title: 'Review & Submit', icon: CheckCircle },
]

export function ClientIntakeForm() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const { toast } = useToast()

  const form = useForm<ClientIntakeFormData>({
    resolver: zodResolver(clientIntakeSchema),
    defaultValues: {
      personalInfo: {
        maritalStatus: 'single',
        address: {},
      },
      taxSituation: {
        filingStatus: 'single',
        hasW2Income: false,
        hasSelfEmploymentIncome: false,
        hasBusinessIncome: false,
        hasRentalIncome: false,
        hasInvestmentIncome: false,
        hasForeignIncome: false,
        hasRetirementIncome: false,
        hasUnemploymentIncome: false,
        hasSocialSecurityIncome: false,
        hasGamblingWinnings: false,
        hasOtherIncome: false,
      },
      deductionsCredits: {
        itemizeDeductions: false,
        hasMortgageInterest: false,
        hasCharitableContributions: false,
        hasStateLocalTaxes: false,
        hasMedicalExpenses: false,
        hasEducationExpenses: false,
        hasChildcareExpenses: false,
        hasBusinessExpenses: false,
        hasHomeOfficeExpenses: false,
        hasVehicleExpenses: false,
      },
      businessInfo: {
        hasActiveBusiness: false,
        hasEmployees: false,
        hasBusinessVehicle: false,
        hasEquipmentPurchases: false,
      },
      investmentInfo: {
        hasBrokerageAccounts: false,
        hasCryptocurrency: false,
        hasRealEstateInvestments: false,
        hasRetirementAccounts: false,
        has529Plans: false,
        hasStockOptions: false,
        hasForeignAccounts: false,
      },
      servicePreferences: {
        servicesRequested: [],
        communicationPreference: 'email',
        meetingPreference: 'virtual',
        documentDeliveryPreference: 'email',
        urgencyLevel: 'standard',
        budgetRange: 'under_500',
      },
      authorizations: {
        irsRepresentation: false,
        stateRepresentation: false,
        priorYearAccess: false,
        spouseAuthorization: false,
        electronicFiling: true,
        directDeposit: true,
      },
      additionalInfo: {
        hasOutstandingTaxIssues: false,
      },
    },
  })

  const watchedValues = form.watch()

  const onSubmit = async (data: ClientIntakeFormData) => {
    try {
      // Here you would submit to your backend
      console.log('Submitting intake form:', data)
      
      toast({
        title: 'Intake Form Submitted',
        description: 'Your information has been successfully submitted. We will contact you soon.',
      })
      
      // Reset form or redirect
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'There was an error submitting your form. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const nextStep = () => {
    if (currentStep < FORM_STEPS.length - 1) {
      setCompletedSteps([...completedSteps, currentStep])
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex)
  }

  const calculateProgress = () => {
    return ((currentStep + 1) / FORM_STEPS.length) * 100
  }

  const isStepCompleted = (stepIndex: number) => {
    return completedSteps.includes(stepIndex)
  }

  const currentStepData = FORM_STEPS[currentStep]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Client Intake Form</h1>
        <p className="text-muted-foreground">
          Please provide your information to help us prepare your tax return accurately
        </p>
        <div className="space-y-2">
          <Progress value={calculateProgress()} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {FORM_STEPS.length}: {currentStepData.title}
          </p>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {FORM_STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep
          const isCompleted = isStepCompleted(index)
          
          return (
            <Button
              key={step.id}
              variant={isActive ? 'default' : isCompleted ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => goToStep(index)}
              className="flex items-center space-x-2"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{step.title}</span>
              {isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
            </Button>
          )
        })}
      </div>

      {/* Form Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <currentStepData.icon className="w-5 h-5" />
                <span>{currentStepData.title}</span>
              </CardTitle>
              <CardDescription>
                Please fill out all required fields to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step Content will be rendered here */}
              {currentStep === 0 && (
                <PersonalInformationStep form={form} />
              )}
              {currentStep === 1 && (
                <FamilyDependentsStep form={form} watchedValues={watchedValues} />
              )}
              {currentStep === 2 && (
                <TaxSituationStep form={form} />
              )}
              {currentStep === 3 && (
                <DeductionsCreditsStep form={form} />
              )}
              {currentStep === 4 && (
                <BusinessInformationStep form={form} />
              )}
              {currentStep === 5 && (
                <InvestmentInformationStep form={form} />
              )}
              {currentStep === 6 && (
                <ServicePreferencesStep form={form} />
              )}
              {currentStep === 7 && (
                <AuthorizationsStep form={form} />
              )}
              {currentStep === 8 && (
                <AdditionalInformationStep form={form} />
              )}
              {currentStep === 9 && (
                <ReviewSubmitStep form={form} watchedValues={watchedValues} />
              )}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < FORM_STEPS.length - 1 ? (
              <Button type="button" onClick={nextStep}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit">
                Submit Form
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}

// Step Components (we'll implement these next)
function PersonalInformationStep({ form }: { form: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="personalInfo.firstName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>First Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter your first name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="personalInfo.lastName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Last Name *</FormLabel>
            <FormControl>
              <Input placeholder="Enter your last name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Add more personal info fields */}
    </div>
  )
}

function FamilyDependentsStep({ form, watchedValues }: { form: any; watchedValues: any }) {
  return (
    <div className="space-y-6">
      <p>Family and dependents information will be implemented here</p>
    </div>
  )
}

function TaxSituationStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <p>Tax situation fields will be implemented here</p>
    </div>
  )
}

function DeductionsCreditsStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <p>Deductions and credits fields will be implemented here</p>
    </div>
  )
}

function BusinessInformationStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <p>Business information fields will be implemented here</p>
    </div>
  )
}

function InvestmentInformationStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <p>Investment information fields will be implemented here</p>
    </div>
  )
}

function ServicePreferencesStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <p>Service preferences fields will be implemented here</p>
    </div>
  )
}

function AuthorizationsStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <p>Authorization fields will be implemented here</p>
    </div>
  )
}

function AdditionalInformationStep({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      <p>Additional information fields will be implemented here</p>
    </div>
  )
}

function ReviewSubmitStep({ form, watchedValues }: { form: any; watchedValues: any }) {
  return (
    <div className="space-y-6">
      <p>Review and submit section will be implemented here</p>
    </div>
  )
}
