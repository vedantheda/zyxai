'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText } from 'lucide-react'
interface DeductionsCreditsData {
  // Itemized Deductions
  wantToItemize: boolean
  mortgageInterest: string
  propertyTaxes: string
  stateLocalTaxes: string
  charitableDonations: string
  medicalExpenses: string
  // Tax Credits
  hasChildTaxCredit: boolean
  numberOfChildren: string
  hasEducationCredits: string
  hasEarnedIncomeCredit: boolean
  // Other Deductions
  hasBusinessExpenses: boolean
  businessExpensesAmount: string
  hasStudentLoanInterest: boolean
  studentLoanInterest: string
}
interface DeductionsCreditsStepProps {
  data: Partial<DeductionsCreditsData>
  onUpdate: (data: Partial<DeductionsCreditsData>) => void
  onNext: () => void
  onComplete: () => void
  isLastStep: boolean
}
export default function DeductionsCreditsStep({
  data,
  onUpdate,
  onNext,
  onComplete,
  isLastStep
}: DeductionsCreditsStepProps) {
  const [formData, setFormData] = useState<Partial<DeductionsCreditsData>>(data)
  useEffect(() => {
    onUpdate(formData)
  }, [formData, onUpdate])
  const updateField = (field: keyof DeductionsCreditsData, value: any) => {
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
            <FileText className="w-5 h-5" />
            <span>Deductions & Credits</span>
          </CardTitle>
          <CardDescription>
            Help us identify potential tax deductions and credits you may qualify for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Itemized Deductions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wantToItemize"
                checked={formData.wantToItemize || false}
                onCheckedChange={(checked) => updateField('wantToItemize', checked)}
              />
              <Label htmlFor="wantToItemize" className="font-medium">
                I want to itemize deductions (instead of taking the standard deduction)
              </Label>
            </div>
            {formData.wantToItemize && (
              <div className="pl-6 space-y-4 border-l-2 border-muted">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mortgageInterest">Mortgage Interest</Label>
                    <Input
                      id="mortgageInterest"
                      value={formData.mortgageInterest || ''}
                      onChange={(e) => updateField('mortgageInterest', e.target.value)}
                      placeholder="$8,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="propertyTaxes">Property Taxes</Label>
                    <Input
                      id="propertyTaxes"
                      value={formData.propertyTaxes || ''}
                      onChange={(e) => updateField('propertyTaxes', e.target.value)}
                      placeholder="$5,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stateLocalTaxes">State & Local Taxes</Label>
                    <Input
                      id="stateLocalTaxes"
                      value={formData.stateLocalTaxes || ''}
                      onChange={(e) => updateField('stateLocalTaxes', e.target.value)}
                      placeholder="$3,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="charitableDonations">Charitable Donations</Label>
                    <Input
                      id="charitableDonations"
                      value={formData.charitableDonations || ''}
                      onChange={(e) => updateField('charitableDonations', e.target.value)}
                      placeholder="$2,500"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="medicalExpenses">Medical Expenses</Label>
                  <Input
                    id="medicalExpenses"
                    value={formData.medicalExpenses || ''}
                    onChange={(e) => updateField('medicalExpenses', e.target.value)}
                    placeholder="$4,000"
                  />
                </div>
              </div>
            )}
          </div>
          {/* Tax Credits */}
          <div className="space-y-4">
            <h4 className="font-medium">Tax Credits</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasChildTaxCredit"
                  checked={formData.hasChildTaxCredit || false}
                  onCheckedChange={(checked) => updateField('hasChildTaxCredit', checked)}
                />
                <Label htmlFor="hasChildTaxCredit">I have qualifying children for Child Tax Credit</Label>
              </div>
              {formData.hasChildTaxCredit && (
                <div className="pl-6">
                  <Label htmlFor="numberOfChildren">Number of Qualifying Children</Label>
                  <Input
                    id="numberOfChildren"
                    type="number"
                    min="0"
                    value={formData.numberOfChildren || ''}
                    onChange={(e) => updateField('numberOfChildren', e.target.value)}
                    placeholder="2"
                    className="w-32"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="hasEducationCredits">Education Credits</Label>
                <Input
                  id="hasEducationCredits"
                  value={formData.hasEducationCredits || ''}
                  onChange={(e) => updateField('hasEducationCredits', e.target.value)}
                  placeholder="Amount paid for qualified education expenses"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasEarnedIncomeCredit"
                  checked={formData.hasEarnedIncomeCredit || false}
                  onCheckedChange={(checked) => updateField('hasEarnedIncomeCredit', checked)}
                />
                <Label htmlFor="hasEarnedIncomeCredit">I may qualify for Earned Income Tax Credit</Label>
              </div>
            </div>
          </div>
          {/* Other Deductions */}
          <div className="space-y-4">
            <h4 className="font-medium">Other Deductions</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasBusinessExpenses"
                  checked={formData.hasBusinessExpenses || false}
                  onCheckedChange={(checked) => updateField('hasBusinessExpenses', checked)}
                />
                <Label htmlFor="hasBusinessExpenses">I have unreimbursed business expenses</Label>
              </div>
              {formData.hasBusinessExpenses && (
                <div className="pl-6">
                  <Label htmlFor="businessExpensesAmount">Business Expenses Amount</Label>
                  <Input
                    id="businessExpensesAmount"
                    value={formData.businessExpensesAmount || ''}
                    onChange={(e) => updateField('businessExpensesAmount', e.target.value)}
                    placeholder="$1,500"
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasStudentLoanInterest"
                  checked={formData.hasStudentLoanInterest || false}
                  onCheckedChange={(checked) => updateField('hasStudentLoanInterest', checked)}
                />
                <Label htmlFor="hasStudentLoanInterest">I paid student loan interest</Label>
              </div>
              {formData.hasStudentLoanInterest && (
                <div className="pl-6">
                  <Label htmlFor="studentLoanInterest">Student Loan Interest Paid</Label>
                  <Input
                    id="studentLoanInterest"
                    value={formData.studentLoanInterest || ''}
                    onChange={(e) => updateField('studentLoanInterest', e.target.value)}
                    placeholder="$2,500"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg">
          Continue to Life Changes
        </Button>
      </div>
    </div>
  )
}
