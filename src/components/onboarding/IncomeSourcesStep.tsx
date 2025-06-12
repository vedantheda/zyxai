'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { DollarSign } from 'lucide-react'

interface IncomeSourcesData {
  // Investment Income
  hasInvestmentIncome: boolean
  interestIncome: string
  dividendIncome: string
  capitalGains: string
  
  // Retirement Income
  hasRetirementIncome: boolean
  socialSecurityIncome: string
  pensionIncome: string
  iraDistributions: string
  
  // Other Income
  hasOtherIncome: boolean
  rentalIncome: string
  businessIncome: string
  freelanceIncome: string
  unemploymentIncome: string
  gamblingWinnings: string
  otherIncomeDescription: string
}

interface IncomeSourcesStepProps {
  data: Partial<IncomeSourcesData>
  onUpdate: (data: Partial<IncomeSourcesData>) => void
  onNext: () => void
  onComplete: () => void
  isLastStep: boolean
}

export default function IncomeSourcesStep({
  data,
  onUpdate,
  onNext,
  onComplete,
  isLastStep
}: IncomeSourcesStepProps) {
  const [formData, setFormData] = useState<Partial<IncomeSourcesData>>(data)

  useEffect(() => {
    onUpdate(formData)
  }, [formData, onUpdate])

  const updateField = (field: keyof IncomeSourcesData, value: any) => {
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
            <DollarSign className="w-5 h-5" />
            <span>Other Income Sources</span>
          </CardTitle>
          <CardDescription>
            Tell us about any additional income you received in 2024
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Investment Income */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasInvestmentIncome"
                checked={formData.hasInvestmentIncome || false}
                onCheckedChange={(checked) => updateField('hasInvestmentIncome', checked)}
              />
              <Label htmlFor="hasInvestmentIncome" className="font-medium">Investment Income</Label>
            </div>

            {formData.hasInvestmentIncome && (
              <div className="pl-6 space-y-4 border-l-2 border-muted">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="interestIncome">Interest Income</Label>
                    <Input
                      id="interestIncome"
                      value={formData.interestIncome || ''}
                      onChange={(e) => updateField('interestIncome', e.target.value)}
                      placeholder="$500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dividendIncome">Dividend Income</Label>
                    <Input
                      id="dividendIncome"
                      value={formData.dividendIncome || ''}
                      onChange={(e) => updateField('dividendIncome', e.target.value)}
                      placeholder="$1,200"
                    />
                  </div>
                  <div>
                    <Label htmlFor="capitalGains">Capital Gains</Label>
                    <Input
                      id="capitalGains"
                      value={formData.capitalGains || ''}
                      onChange={(e) => updateField('capitalGains', e.target.value)}
                      placeholder="$2,000"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Retirement Income */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasRetirementIncome"
                checked={formData.hasRetirementIncome || false}
                onCheckedChange={(checked) => updateField('hasRetirementIncome', checked)}
              />
              <Label htmlFor="hasRetirementIncome" className="font-medium">Retirement Income</Label>
            </div>

            {formData.hasRetirementIncome && (
              <div className="pl-6 space-y-4 border-l-2 border-muted">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="socialSecurityIncome">Social Security</Label>
                    <Input
                      id="socialSecurityIncome"
                      value={formData.socialSecurityIncome || ''}
                      onChange={(e) => updateField('socialSecurityIncome', e.target.value)}
                      placeholder="$15,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pensionIncome">Pension Income</Label>
                    <Input
                      id="pensionIncome"
                      value={formData.pensionIncome || ''}
                      onChange={(e) => updateField('pensionIncome', e.target.value)}
                      placeholder="$8,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="iraDistributions">IRA Distributions</Label>
                    <Input
                      id="iraDistributions"
                      value={formData.iraDistributions || ''}
                      onChange={(e) => updateField('iraDistributions', e.target.value)}
                      placeholder="$5,000"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Other Income */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasOtherIncome"
                checked={formData.hasOtherIncome || false}
                onCheckedChange={(checked) => updateField('hasOtherIncome', checked)}
              />
              <Label htmlFor="hasOtherIncome" className="font-medium">Other Income</Label>
            </div>

            {formData.hasOtherIncome && (
              <div className="pl-6 space-y-4 border-l-2 border-muted">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rentalIncome">Rental Income</Label>
                    <Input
                      id="rentalIncome"
                      value={formData.rentalIncome || ''}
                      onChange={(e) => updateField('rentalIncome', e.target.value)}
                      placeholder="$12,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessIncome">Business Income</Label>
                    <Input
                      id="businessIncome"
                      value={formData.businessIncome || ''}
                      onChange={(e) => updateField('businessIncome', e.target.value)}
                      placeholder="$25,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="freelanceIncome">Freelance/1099 Income</Label>
                    <Input
                      id="freelanceIncome"
                      value={formData.freelanceIncome || ''}
                      onChange={(e) => updateField('freelanceIncome', e.target.value)}
                      placeholder="$8,500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unemploymentIncome">Unemployment Benefits</Label>
                    <Input
                      id="unemploymentIncome"
                      value={formData.unemploymentIncome || ''}
                      onChange={(e) => updateField('unemploymentIncome', e.target.value)}
                      placeholder="$3,000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="gamblingWinnings">Gambling Winnings</Label>
                  <Input
                    id="gamblingWinnings"
                    value={formData.gamblingWinnings || ''}
                    onChange={(e) => updateField('gamblingWinnings', e.target.value)}
                    placeholder="$500"
                  />
                </div>

                <div>
                  <Label htmlFor="otherIncomeDescription">Other Income Description</Label>
                  <Input
                    id="otherIncomeDescription"
                    value={formData.otherIncomeDescription || ''}
                    onChange={(e) => updateField('otherIncomeDescription', e.target.value)}
                    placeholder="Describe any other income sources"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg">
          Continue to Deductions
        </Button>
      </div>
    </div>
  )
}
