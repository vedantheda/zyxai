'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { User, MapPin, Phone, Mail, Calendar } from 'lucide-react'
interface BasicInformationData {
  // Primary Taxpayer Details
  firstName: string
  middleName: string
  lastName: string
  preferredName: string
  suffix: string
  previousNames: string
  // Identification
  ssn: string
  dateOfBirth: string
  placeOfBirth: string
  citizenshipStatus: string
  driversLicense: string
  driversLicenseState: string
  passportNumber: string
  // Contact Information
  primaryEmail: string
  secondaryEmail: string
  homePhone: string
  cellPhone: string
  workPhone: string
  emergencyContactName: string
  emergencyContactPhone: string
  preferredContactMethod: string
  bestTimeToContact: string
  timeZone: string
  // Current Address
  streetAddress1: string
  streetAddress2: string
  city: string
  state: string
  zipCode: string
  county: string
  country: string
  yearsAtAddress: string
  monthsAtAddress: string
  ownOrRent: string
  dateMovedToAddress: string
  // Mailing Address
  mailingAddressDifferent: boolean
  mailingStreetAddress1: string
  mailingStreetAddress2: string
  mailingCity: string
  mailingState: string
  mailingZipCode: string
  mailingCountry: string
  mailingAddressReason: string
  mailingAddressTemporary: boolean
}
interface BasicInformationStepProps {
  data: Partial<BasicInformationData>
  onUpdate: (data: Partial<BasicInformationData>) => void
  onNext: () => void
  onComplete: () => void
  isLastStep: boolean
}
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
const CONTACT_METHODS = [
  'Email',
  'Phone',
  'Text',
  'Mail'
]
const CONTACT_TIMES = [
  'Morning (8AM - 12PM)',
  'Afternoon (12PM - 5PM)',
  'Evening (5PM - 8PM)',
  'Anytime'
]
export default function BasicInformationStep({
  data,
  onUpdate,
  onNext,
  onComplete,
  isLastStep
}: BasicInformationStepProps) {
  const [formData, setFormData] = useState<Partial<BasicInformationData>>(data)
  const [errors, setErrors] = useState<Record<string, string>>({})
  useEffect(() => {
    onUpdate(formData)
  }, [formData, onUpdate])
  const updateField = (field: keyof BasicInformationData, value: any) => {
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
  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    // Required fields validation
    if (!formData.firstName?.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.ssn?.trim()) newErrors.ssn = 'Social Security Number is required'
    if (!formData.dateOfBirth?.trim()) newErrors.dateOfBirth = 'Date of birth is required'
    if (!formData.primaryEmail?.trim()) newErrors.primaryEmail = 'Email address is required'
    if (!formData.streetAddress1?.trim()) newErrors.streetAddress1 = 'Street address is required'
    if (!formData.city?.trim()) newErrors.city = 'City is required'
    if (!formData.state?.trim()) newErrors.state = 'State is required'
    if (!formData.zipCode?.trim()) newErrors.zipCode = 'ZIP code is required'
    // Format validation
    if (formData.ssn && !/^\d{3}-?\d{2}-?\d{4}$/.test(formData.ssn)) {
      newErrors.ssn = 'Invalid SSN format (use XXX-XX-XXXX)'
    }
    if (formData.primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryEmail)) {
      newErrors.primaryEmail = 'Invalid email format'
    }
    if (formData.zipCode && !/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Invalid ZIP code format'
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
  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 9)}`
  }
  return (
    <div className="space-y-8">
      {/* Primary Taxpayer Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Personal Information</span>
          </CardTitle>
          <CardDescription>
            Enter your legal name exactly as it appears on your Social Security card
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName">Legal First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName || ''}
                onChange={(e) => updateField('firstName', e.target.value)}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="middleName">Middle Name/Initial</Label>
              <Input
                id="middleName"
                value={formData.middleName || ''}
                onChange={(e) => updateField('middleName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Legal Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName || ''}
                onChange={(e) => updateField('lastName', e.target.value)}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferredName">Preferred Name/Nickname</Label>
              <Input
                id="preferredName"
                value={formData.preferredName || ''}
                onChange={(e) => updateField('preferredName', e.target.value)}
                placeholder="How you'd like to be addressed"
              />
            </div>
            <div>
              <Label htmlFor="suffix">Name Suffix</Label>
              <Select value={formData.suffix || ''} onValueChange={(value) => updateField('suffix', value)}>
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
            <Label htmlFor="previousNames">Previous Names (maiden name, previous married names)</Label>
            <Input
              id="previousNames"
              value={formData.previousNames || ''}
              onChange={(e) => updateField('previousNames', e.target.value)}
              placeholder="List any previous names"
            />
          </div>
        </CardContent>
      </Card>
      {/* Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Identification</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ssn">Social Security Number *</Label>
              <Input
                id="ssn"
                value={formData.ssn || ''}
                onChange={(e) => updateField('ssn', formatSSN(e.target.value))}
                placeholder="XXX-XX-XXXX"
                maxLength={11}
                className={errors.ssn ? 'border-red-500' : ''}
              />
              {errors.ssn && <p className="text-red-500 text-sm mt-1">{errors.ssn}</p>}
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                className={errors.dateOfBirth ? 'border-red-500' : ''}
              />
              {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="placeOfBirth">Place of Birth</Label>
              <Input
                id="placeOfBirth"
                value={formData.placeOfBirth || ''}
                onChange={(e) => updateField('placeOfBirth', e.target.value)}
                placeholder="City, State, Country"
              />
            </div>
            <div>
              <Label htmlFor="citizenshipStatus">Citizenship Status</Label>
              <Select value={formData.citizenshipStatus || ''} onValueChange={(value) => updateField('citizenshipStatus', value)}>
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
              <Label htmlFor="driversLicense">Driver's License Number</Label>
              <Input
                id="driversLicense"
                value={formData.driversLicense || ''}
                onChange={(e) => updateField('driversLicense', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="driversLicenseState">License State</Label>
              <Select value={formData.driversLicenseState || ''} onValueChange={(value) => updateField('driversLicenseState', value)}>
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
              <Label htmlFor="passportNumber">Passport Number</Label>
              <Input
                id="passportNumber"
                value={formData.passportNumber || ''}
                onChange={(e) => updateField('passportNumber', e.target.value)}
                placeholder="If applicable"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryEmail">Primary Email Address *</Label>
              <Input
                id="primaryEmail"
                type="email"
                value={formData.primaryEmail || ''}
                onChange={(e) => updateField('primaryEmail', e.target.value)}
                className={errors.primaryEmail ? 'border-red-500' : ''}
              />
              {errors.primaryEmail && <p className="text-red-500 text-sm mt-1">{errors.primaryEmail}</p>}
            </div>
            <div>
              <Label htmlFor="secondaryEmail">Secondary Email Address</Label>
              <Input
                id="secondaryEmail"
                type="email"
                value={formData.secondaryEmail || ''}
                onChange={(e) => updateField('secondaryEmail', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="homePhone">Home Phone</Label>
              <Input
                id="homePhone"
                type="tel"
                value={formData.homePhone || ''}
                onChange={(e) => updateField('homePhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="cellPhone">Cell Phone</Label>
              <Input
                id="cellPhone"
                type="tel"
                value={formData.cellPhone || ''}
                onChange={(e) => updateField('cellPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="workPhone">Work Phone</Label>
              <Input
                id="workPhone"
                type="tel"
                value={formData.workPhone || ''}
                onChange={(e) => updateField('workPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName || ''}
                onChange={(e) => updateField('emergencyContactName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
              <Input
                id="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone || ''}
                onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Preferred Contact Method</Label>
              <RadioGroup
                value={formData.preferredContactMethod || ''}
                onValueChange={(value) => updateField('preferredContactMethod', value)}
                className="flex flex-wrap gap-4 mt-2"
              >
                {CONTACT_METHODS.map(method => (
                  <div key={method} className="flex items-center space-x-2">
                    <RadioGroupItem value={method} id={method} />
                    <Label htmlFor={method}>{method}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label>Best Time to Contact</Label>
              <RadioGroup
                value={formData.bestTimeToContact || ''}
                onValueChange={(value) => updateField('bestTimeToContact', value)}
                className="flex flex-wrap gap-4 mt-2"
              >
                {CONTACT_TIMES.map(time => (
                  <div key={time} className="flex items-center space-x-2">
                    <RadioGroupItem value={time} id={time} />
                    <Label htmlFor={time}>{time}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Current Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Current Address</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="streetAddress1">Street Address *</Label>
            <Input
              id="streetAddress1"
              value={formData.streetAddress1 || ''}
              onChange={(e) => updateField('streetAddress1', e.target.value)}
              className={errors.streetAddress1 ? 'border-red-500' : ''}
            />
            {errors.streetAddress1 && <p className="text-red-500 text-sm mt-1">{errors.streetAddress1}</p>}
          </div>
          <div>
            <Label htmlFor="streetAddress2">Apartment, Suite, Unit</Label>
            <Input
              id="streetAddress2"
              value={formData.streetAddress2 || ''}
              onChange={(e) => updateField('streetAddress2', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e) => updateField('city', e.target.value)}
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
            </div>
            <div>
              <Label htmlFor="state">State *</Label>
              <Select value={formData.state || ''} onValueChange={(value) => updateField('state', value)}>
                <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
            </div>
            <div>
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={formData.zipCode || ''}
                onChange={(e) => updateField('zipCode', formatZipCode(e.target.value))}
                placeholder="12345 or 12345-6789"
                maxLength={10}
                className={errors.zipCode ? 'border-red-500' : ''}
              />
              {errors.zipCode && <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>}
            </div>
            <div>
              <Label htmlFor="county">County</Label>
              <Input
                id="county"
                value={formData.county || ''}
                onChange={(e) => updateField('county', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="yearsAtAddress">Years at Address</Label>
              <Input
                id="yearsAtAddress"
                type="number"
                min="0"
                value={formData.yearsAtAddress || ''}
                onChange={(e) => updateField('yearsAtAddress', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="monthsAtAddress">Additional Months</Label>
              <Input
                id="monthsAtAddress"
                type="number"
                min="0"
                max="11"
                value={formData.monthsAtAddress || ''}
                onChange={(e) => updateField('monthsAtAddress', e.target.value)}
              />
            </div>
            <div>
              <Label>Own or Rent?</Label>
              <RadioGroup
                value={formData.ownOrRent || ''}
                onValueChange={(value) => updateField('ownOrRent', value)}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="own" id="own" />
                  <Label htmlFor="own">Own</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rent" id="rent" />
                  <Label htmlFor="rent">Rent</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div>
            <Label htmlFor="dateMovedToAddress">Date Moved to This Address</Label>
            <Input
              id="dateMovedToAddress"
              type="date"
              value={formData.dateMovedToAddress || ''}
              onChange={(e) => updateField('dateMovedToAddress', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      {/* Mailing Address */}
      <Card>
        <CardHeader>
          <CardTitle>Mailing Address</CardTitle>
          <CardDescription>Only fill this out if your mailing address is different from your current address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mailingAddressDifferent"
              checked={formData.mailingAddressDifferent || false}
              onCheckedChange={(checked) => updateField('mailingAddressDifferent', checked)}
            />
            <Label htmlFor="mailingAddressDifferent">My mailing address is different from my current address</Label>
          </div>
          {formData.mailingAddressDifferent && (
            <div className="space-y-4 pl-6 border-l-2 border-muted">
              <div>
                <Label htmlFor="mailingStreetAddress1">Mailing Street Address</Label>
                <Input
                  id="mailingStreetAddress1"
                  value={formData.mailingStreetAddress1 || ''}
                  onChange={(e) => updateField('mailingStreetAddress1', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="mailingStreetAddress2">Apartment, Suite, Unit</Label>
                <Input
                  id="mailingStreetAddress2"
                  value={formData.mailingStreetAddress2 || ''}
                  onChange={(e) => updateField('mailingStreetAddress2', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="mailingCity">City</Label>
                  <Input
                    id="mailingCity"
                    value={formData.mailingCity || ''}
                    onChange={(e) => updateField('mailingCity', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="mailingState">State</Label>
                  <Select value={formData.mailingState || ''} onValueChange={(value) => updateField('mailingState', value)}>
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
                  <Label htmlFor="mailingZipCode">ZIP Code</Label>
                  <Input
                    id="mailingZipCode"
                    value={formData.mailingZipCode || ''}
                    onChange={(e) => updateField('mailingZipCode', formatZipCode(e.target.value))}
                    placeholder="12345 or 12345-6789"
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label htmlFor="mailingCountry">Country</Label>
                  <Input
                    id="mailingCountry"
                    value={formData.mailingCountry || 'United States'}
                    onChange={(e) => updateField('mailingCountry', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="mailingAddressReason">Reason for Different Mailing Address</Label>
                <Textarea
                  id="mailingAddressReason"
                  value={formData.mailingAddressReason || ''}
                  onChange={(e) => updateField('mailingAddressReason', e.target.value)}
                  placeholder="e.g., PO Box, temporary relocation, etc."
                />
              </div>
              <div>
                <Label>Is this mailing address temporary?</Label>
                <RadioGroup
                  value={formData.mailingAddressTemporary ? 'yes' : 'no'}
                  onValueChange={(value) => updateField('mailingAddressTemporary', value === 'yes')}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="temp-yes" />
                    <Label htmlFor="temp-yes">Yes, temporary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="temp-no" />
                    <Label htmlFor="temp-no">No, permanent</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Continue Button */}
      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg">
          Continue to Spouse Information
        </Button>
      </div>
    </div>
  )
}
