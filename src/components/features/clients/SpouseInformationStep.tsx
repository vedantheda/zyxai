'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Users, Heart, Briefcase } from 'lucide-react'
interface SpouseInformationData {
  // Filing Status
  filingStatus: string
  // Spouse Personal Details
  spouseFirstName: string
  spouseMiddleName: string
  spouseLastName: string
  spousePreferredName: string
  spouseSuffix: string
  spousePreviousNames: string
  // Spouse Identification
  spouseSSN: string
  spouseDateOfBirth: string
  spousePlaceOfBirth: string
  spouseCitizenshipStatus: string
  spouseDriversLicense: string
  spouseDriversLicenseState: string
  spousePassportNumber: string
  // Marriage Information
  dateOfMarriage: string
  locationOfMarriage: string
  previousMarriages: boolean
  previousMarriageDetails: string
  // Spouse Employment
  spouseEmployerName: string
  spouseEmployerAddress: string
  spouseJobTitle: string
  spouseDepartment: string
  spouseSupervisorName: string
  spouseWorkPhone: string
  spouseWorkEmail: string
  spouseEmploymentStartDate: string
  spouseEmploymentStatus: string
  spouseAnnualSalary: string
  spousePayFrequency: string
}
interface SpouseInformationStepProps {
  data: Partial<SpouseInformationData>
  onUpdate: (data: Partial<SpouseInformationData>) => void
  onNext: () => void
  onComplete: () => void
  isLastStep: boolean
}
const FILING_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married-filing-jointly', label: 'Married Filing Jointly' },
  { value: 'married-filing-separately', label: 'Married Filing Separately' },
  { value: 'head-of-household', label: 'Head of Household' },
  { value: 'qualifying-widow', label: 'Qualifying Widow(er)' }
]
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]
const CITIZENSHIP_OPTIONS = [
  'US Citizen',
  'Resident Alien',
  'Non-Resident Alien'
]
const EMPLOYMENT_STATUS_OPTIONS = [
  'Full-time',
  'Part-time',
  'Seasonal',
  'Contract',
  'Self-employed',
  'Unemployed',
  'Retired',
  'Student'
]
const PAY_FREQUENCY_OPTIONS = [
  'Weekly',
  'Bi-weekly',
  'Semi-monthly',
  'Monthly',
  'Quarterly',
  'Annually'
]
export default function SpouseInformationStep({
  data,
  onUpdate,
  onNext,
  onComplete,
  isLastStep
}: SpouseInformationStepProps) {
  const [formData, setFormData] = useState<Partial<SpouseInformationData>>(data)
  const [errors, setErrors] = useState<Record<string, string>>({})
  useEffect(() => {
    onUpdate(formData)
  }, [formData, onUpdate])
  const updateField = (field: keyof SpouseInformationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }
  const isMarried = formData.filingStatus === 'married-filing-jointly' || formData.filingStatus === 'married-filing-separately'
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    // Filing status is required
    if (!formData.filingStatus) {
      newErrors.filingStatus = 'Filing status is required'
    }
    // If married, spouse information is required
    if (isMarried) {
      if (!formData.spouseFirstName?.trim()) newErrors.spouseFirstName = 'Spouse first name is required'
      if (!formData.spouseLastName?.trim()) newErrors.spouseLastName = 'Spouse last name is required'
      if (!formData.spouseSSN?.trim()) newErrors.spouseSSN = 'Spouse SSN is required'
      if (!formData.spouseDateOfBirth?.trim()) newErrors.spouseDateOfBirth = 'Spouse date of birth is required'
      if (!formData.dateOfMarriage?.trim()) newErrors.dateOfMarriage = 'Date of marriage is required'
      // Format validation for spouse SSN
      if (formData.spouseSSN && !/^\d{3}-?\d{2}-?\d{4}$/.test(formData.spouseSSN)) {
        newErrors.spouseSSN = 'Invalid SSN format (use XXX-XX-XXXX)'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const handleNext = () => {
    if (validateForm()) {
      if (isLastStep) {
        onComplete()
      } else {
        onNext()
      }
    }
  }
  const formatSSN = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 9)}`
  }
  return (
    <div className="space-y-8">
      {/* Filing Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Filing Status</span>
          </CardTitle>
          <CardDescription>
            Select your filing status for the 2024 tax year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Filing Status *</Label>
            <RadioGroup
              value={formData.filingStatus || ''}
              onValueChange={(value) => updateField('filingStatus', value)}
              className="mt-3 space-y-3"
            >
              {FILING_STATUS_OPTIONS.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.filingStatus && <p className="text-red-500 text-sm mt-2">{errors.filingStatus}</p>}
          </div>
        </CardContent>
      </Card>
      {/* Spouse Information - Only show if married */}
      {isMarried && (
        <>
          {/* Spouse Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Spouse Personal Information</span>
              </CardTitle>
              <CardDescription>
                Enter your spouse's legal name exactly as it appears on their Social Security card
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="spouseFirstName">Spouse First Name *</Label>
                  <Input
                    id="spouseFirstName"
                    value={formData.spouseFirstName || ''}
                    onChange={(e) => updateField('spouseFirstName', e.target.value)}
                    className={errors.spouseFirstName ? 'border-red-500' : ''}
                  />
                  {errors.spouseFirstName && <p className="text-red-500 text-sm mt-1">{errors.spouseFirstName}</p>}
                </div>
                <div>
                  <Label htmlFor="spouseMiddleName">Middle Name/Initial</Label>
                  <Input
                    id="spouseMiddleName"
                    value={formData.spouseMiddleName || ''}
                    onChange={(e) => updateField('spouseMiddleName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="spouseLastName">Spouse Last Name *</Label>
                  <Input
                    id="spouseLastName"
                    value={formData.spouseLastName || ''}
                    onChange={(e) => updateField('spouseLastName', e.target.value)}
                    className={errors.spouseLastName ? 'border-red-500' : ''}
                  />
                  {errors.spouseLastName && <p className="text-red-500 text-sm mt-1">{errors.spouseLastName}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spousePreferredName">Preferred Name/Nickname</Label>
                  <Input
                    id="spousePreferredName"
                    value={formData.spousePreferredName || ''}
                    onChange={(e) => updateField('spousePreferredName', e.target.value)}
                    placeholder="How they'd like to be addressed"
                  />
                </div>
                <div>
                  <Label htmlFor="spouseSuffix">Name Suffix</Label>
                  <Select value={formData.spouseSuffix || ''} onValueChange={(value) => updateField('spouseSuffix', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select suffix" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jr.">Jr.</SelectItem>
                      <SelectItem value="Sr.">Sr.</SelectItem>
                      <SelectItem value="II">II</SelectItem>
                      <SelectItem value="III">III</SelectItem>
                      <SelectItem value="IV">IV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="spousePreviousNames">Spouse Previous Names</Label>
                <Input
                  id="spousePreviousNames"
                  value={formData.spousePreviousNames || ''}
                  onChange={(e) => updateField('spousePreviousNames', e.target.value)}
                  placeholder="List any previous names"
                />
              </div>
            </CardContent>
          </Card>
          {/* Spouse Identification */}
          <Card>
            <CardHeader>
              <CardTitle>Spouse Identification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouseSSN">Spouse Social Security Number *</Label>
                  <Input
                    id="spouseSSN"
                    value={formData.spouseSSN || ''}
                    onChange={(e) => updateField('spouseSSN', formatSSN(e.target.value))}
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                    className={errors.spouseSSN ? 'border-red-500' : ''}
                  />
                  {errors.spouseSSN && <p className="text-red-500 text-sm mt-1">{errors.spouseSSN}</p>}
                </div>
                <div>
                  <Label htmlFor="spouseDateOfBirth">Spouse Date of Birth *</Label>
                  <Input
                    id="spouseDateOfBirth"
                    type="date"
                    value={formData.spouseDateOfBirth || ''}
                    onChange={(e) => updateField('spouseDateOfBirth', e.target.value)}
                    className={errors.spouseDateOfBirth ? 'border-red-500' : ''}
                  />
                  {errors.spouseDateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.spouseDateOfBirth}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spousePlaceOfBirth">Spouse Place of Birth</Label>
                  <Input
                    id="spousePlaceOfBirth"
                    value={formData.spousePlaceOfBirth || ''}
                    onChange={(e) => updateField('spousePlaceOfBirth', e.target.value)}
                    placeholder="City, State, Country"
                  />
                </div>
                <div>
                  <Label htmlFor="spouseCitizenshipStatus">Spouse Citizenship Status</Label>
                  <Select value={formData.spouseCitizenshipStatus || ''} onValueChange={(value) => updateField('spouseCitizenshipStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select citizenship status" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIZENSHIP_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="spouseDriversLicense">Spouse Driver's License</Label>
                  <Input
                    id="spouseDriversLicense"
                    value={formData.spouseDriversLicense || ''}
                    onChange={(e) => updateField('spouseDriversLicense', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="spouseDriversLicenseState">License State</Label>
                  <Select value={formData.spouseDriversLicenseState || ''} onValueChange={(value) => updateField('spouseDriversLicenseState', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="spousePassportNumber">Spouse Passport Number</Label>
                  <Input
                    id="spousePassportNumber"
                    value={formData.spousePassportNumber || ''}
                    onChange={(e) => updateField('spousePassportNumber', e.target.value)}
                    placeholder="If applicable"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Marriage Information */}
          <Card>
            <CardHeader>
              <CardTitle>Marriage Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfMarriage">Date of Marriage *</Label>
                  <Input
                    id="dateOfMarriage"
                    type="date"
                    value={formData.dateOfMarriage || ''}
                    onChange={(e) => updateField('dateOfMarriage', e.target.value)}
                    className={errors.dateOfMarriage ? 'border-red-500' : ''}
                  />
                  {errors.dateOfMarriage && <p className="text-red-500 text-sm mt-1">{errors.dateOfMarriage}</p>}
                </div>
                <div>
                  <Label htmlFor="locationOfMarriage">Location of Marriage</Label>
                  <Input
                    id="locationOfMarriage"
                    value={formData.locationOfMarriage || ''}
                    onChange={(e) => updateField('locationOfMarriage', e.target.value)}
                    placeholder="City, State"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="previousMarriages"
                    checked={formData.previousMarriages || false}
                    onCheckedChange={(checked) => updateField('previousMarriages', checked)}
                  />
                  <Label htmlFor="previousMarriages">Either spouse had previous marriages</Label>
                </div>
                {formData.previousMarriages && (
                  <div>
                    <Label htmlFor="previousMarriageDetails">Previous Marriage Details</Label>
                    <Input
                      id="previousMarriageDetails"
                      value={formData.previousMarriageDetails || ''}
                      onChange={(e) => updateField('previousMarriageDetails', e.target.value)}
                      placeholder="Provide details about previous marriages"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Spouse Employment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Spouse Employment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouseEmployerName">Employer Name</Label>
                  <Input
                    id="spouseEmployerName"
                    value={formData.spouseEmployerName || ''}
                    onChange={(e) => updateField('spouseEmployerName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="spouseJobTitle">Job Title/Position</Label>
                  <Input
                    id="spouseJobTitle"
                    value={formData.spouseJobTitle || ''}
                    onChange={(e) => updateField('spouseJobTitle', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="spouseEmployerAddress">Employer Address</Label>
                <Input
                  id="spouseEmployerAddress"
                  value={formData.spouseEmployerAddress || ''}
                  onChange={(e) => updateField('spouseEmployerAddress', e.target.value)}
                  placeholder="Full employer address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouseDepartment">Department</Label>
                  <Input
                    id="spouseDepartment"
                    value={formData.spouseDepartment || ''}
                    onChange={(e) => updateField('spouseDepartment', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="spouseSupervisorName">Supervisor Name</Label>
                  <Input
                    id="spouseSupervisorName"
                    value={formData.spouseSupervisorName || ''}
                    onChange={(e) => updateField('spouseSupervisorName', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouseWorkPhone">Work Phone</Label>
                  <Input
                    id="spouseWorkPhone"
                    type="tel"
                    value={formData.spouseWorkPhone || ''}
                    onChange={(e) => updateField('spouseWorkPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="spouseWorkEmail">Work Email</Label>
                  <Input
                    id="spouseWorkEmail"
                    type="email"
                    value={formData.spouseWorkEmail || ''}
                    onChange={(e) => updateField('spouseWorkEmail', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouseEmploymentStartDate">Employment Start Date</Label>
                  <Input
                    id="spouseEmploymentStartDate"
                    type="date"
                    value={formData.spouseEmploymentStartDate || ''}
                    onChange={(e) => updateField('spouseEmploymentStartDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="spouseEmploymentStatus">Employment Status</Label>
                  <Select value={formData.spouseEmploymentStatus || ''} onValueChange={(value) => updateField('spouseEmploymentStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment status" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_STATUS_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="spouseAnnualSalary">Annual Salary/Hourly Wage</Label>
                  <Input
                    id="spouseAnnualSalary"
                    value={formData.spouseAnnualSalary || ''}
                    onChange={(e) => updateField('spouseAnnualSalary', e.target.value)}
                    placeholder="$50,000 or $25/hour"
                  />
                </div>
                <div>
                  <Label htmlFor="spousePayFrequency">Pay Frequency</Label>
                  <Select value={formData.spousePayFrequency || ''} onValueChange={(value) => updateField('spousePayFrequency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pay frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAY_FREQUENCY_OPTIONS.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      {/* Continue Button */}
      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg">
          Continue to Dependents
        </Button>
      </div>
    </div>
  )
}
