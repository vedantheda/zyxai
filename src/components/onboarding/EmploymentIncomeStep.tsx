'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Briefcase } from 'lucide-react'

interface EmploymentIncomeData {
  // Primary Employment
  employerName: string
  employerAddress: string
  jobTitle: string
  employmentStartDate: string
  annualSalary: string
  
  // Tax Withholdings
  federalTaxWithheld: string
  stateTaxWithheld: string
  socialSecurityWithheld: string
  medicareWithheld: string
  
  // Benefits
  healthInsurance: boolean
  retirementContributions: string
  otherBenefits: string
  
  // Multiple Jobs
  hasMultipleJobs: boolean
  additionalEmployers: string
}

interface EmploymentIncomeStepProps {
  data: Partial<EmploymentIncomeData>
  onUpdate: (data: Partial<EmploymentIncomeData>) => void
  onNext: () => void
  onComplete: () => void
  isLastStep: boolean
}

export default function EmploymentIncomeStep({
  data,
  onUpdate,
  onNext,
  onComplete,
  isLastStep
}: EmploymentIncomeStepProps) {
  const [formData, setFormData] = useState<Partial<EmploymentIncomeData>>(data)

  useEffect(() => {
    onUpdate(formData)
  }, [formData, onUpdate])

  const updateField = (field: keyof EmploymentIncomeData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      onNext()
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Employment & Income</span>
          </CardTitle>
          <CardDescription>
            Tell us about your primary employment and income for 2024
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employerName">Employer Name</Label>
              <Input
                id="employerName"
                value={formData.employerName || ''}
                onChange={(e) => updateField('employerName', e.target.value)}
                placeholder="Your primary employer"
              />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle || ''}
                onChange={(e) => updateField('jobTitle', e.target.value)}
                placeholder="Your position/title"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="employerAddress">Employer Address</Label>
            <Textarea
              id="employerAddress"
              value={formData.employerAddress || ''}
              onChange={(e) => updateField('employerAddress', e.target.value)}
              placeholder="Full employer address"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employmentStartDate">Employment Start Date</Label>
              <Input
                id="employmentStartDate"
                type="date"
                value={formData.employmentStartDate || ''}
                onChange={(e) => updateField('employmentStartDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="annualSalary">Annual Salary/Expected Income</Label>
              <Input
                id="annualSalary"
                value={formData.annualSalary || ''}
                onChange={(e) => updateField('annualSalary', e.target.value)}
                placeholder="$50,000"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Tax Withholdings (if known)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="federalTaxWithheld">Federal Tax Withheld</Label>
                <Input
                  id="federalTaxWithheld"
                  value={formData.federalTaxWithheld || ''}
                  onChange={(e) => updateField('federalTaxWithheld', e.target.value)}
                  placeholder="$5,000"
                />
              </div>
              <div>
                <Label htmlFor="stateTaxWithheld">State Tax Withheld</Label>
                <Input
                  id="stateTaxWithheld"
                  value={formData.stateTaxWithheld || ''}
                  onChange={(e) => updateField('stateTaxWithheld', e.target.value)}
                  placeholder="$1,500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="healthInsurance"
                checked={formData.healthInsurance || false}
                onCheckedChange={(checked) => updateField('healthInsurance', checked)}
              />
              <Label htmlFor="healthInsurance">I have employer-provided health insurance</Label>
            </div>

            <div>
              <Label htmlFor="retirementContributions">Retirement Contributions (401k, etc.)</Label>
              <Input
                id="retirementContributions"
                value={formData.retirementContributions || ''}
                onChange={(e) => updateField('retirementContributions', e.target.value)}
                placeholder="$6,000"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasMultipleJobs"
                checked={formData.hasMultipleJobs || false}
                onCheckedChange={(checked) => updateField('hasMultipleJobs', checked)}
              />
              <Label htmlFor="hasMultipleJobs">I have multiple jobs or employers</Label>
            </div>

            {formData.hasMultipleJobs && (
              <div>
                <Label htmlFor="additionalEmployers">Additional Employers</Label>
                <Textarea
                  id="additionalEmployers"
                  value={formData.additionalEmployers || ''}
                  onChange={(e) => updateField('additionalEmployers', e.target.value)}
                  placeholder="List your other employers and approximate income from each"
                  rows={4}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg">
          Continue to Other Income
        </Button>
      </div>
    </div>
  )
}
