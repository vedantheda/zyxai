'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Settings } from 'lucide-react'

interface LifeChangesData {
  // Major Life Events
  gotMarried: boolean
  gotDivorced: boolean
  hadChild: boolean
  adoptedChild: boolean
  movedStates: boolean
  boughtHome: boolean
  soldHome: boolean
  startedBusiness: boolean
  retiredThisYear: boolean
  
  // Special Circumstances
  hadMedicalEmergency: boolean
  lostJob: boolean
  receivedInheritance: boolean
  madeCharitableGifts: boolean
  
  // Additional Details
  additionalDetails: string
}

interface LifeChangesStepProps {
  data: Partial<LifeChangesData>
  onUpdate: (data: Partial<LifeChangesData>) => void
  onNext: () => void
  onComplete: () => void
  isLastStep: boolean
}

export default function LifeChangesStep({
  data,
  onUpdate,
  onNext,
  onComplete,
  isLastStep
}: LifeChangesStepProps) {
  const [formData, setFormData] = useState<Partial<LifeChangesData>>(data)

  useEffect(() => {
    onUpdate(formData)
  }, [formData, onUpdate])

  const updateField = (field: keyof LifeChangesData, value: any) => {
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

  const lifeEvents = [
    { key: 'gotMarried', label: 'Got married' },
    { key: 'gotDivorced', label: 'Got divorced or separated' },
    { key: 'hadChild', label: 'Had a child' },
    { key: 'adoptedChild', label: 'Adopted a child' },
    { key: 'movedStates', label: 'Moved to a different state' },
    { key: 'boughtHome', label: 'Bought a home' },
    { key: 'soldHome', label: 'Sold a home' },
    { key: 'startedBusiness', label: 'Started a business' },
    { key: 'retiredThisYear', label: 'Retired' },
  ]

  const specialCircumstances = [
    { key: 'hadMedicalEmergency', label: 'Had significant medical expenses' },
    { key: 'lostJob', label: 'Lost job or had reduced income' },
    { key: 'receivedInheritance', label: 'Received an inheritance' },
    { key: 'madeCharitableGifts', label: 'Made large charitable donations' },
  ]

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Life Changes & Special Circumstances</span>
          </CardTitle>
          <CardDescription>
            Tell us about any major life events or special circumstances in 2024 that might affect your taxes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Major Life Events */}
          <div className="space-y-4">
            <h4 className="font-medium">Major Life Events in 2024</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lifeEvents.map(event => (
                <div key={event.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={event.key}
                    checked={Boolean(formData[event.key as keyof LifeChangesData]) || false}
                    onCheckedChange={(checked) => updateField(event.key as keyof LifeChangesData, checked)}
                  />
                  <Label htmlFor={event.key}>{event.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Special Circumstances */}
          <div className="space-y-4">
            <h4 className="font-medium">Special Circumstances</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specialCircumstances.map(circumstance => (
                <div key={circumstance.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={circumstance.key}
                    checked={Boolean(formData[circumstance.key as keyof LifeChangesData]) || false}
                    onCheckedChange={(checked) => updateField(circumstance.key as keyof LifeChangesData, checked)}
                  />
                  <Label htmlFor={circumstance.key}>{circumstance.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <h4 className="font-medium">Additional Details</h4>
            <div>
              <Label htmlFor="additionalDetails">
                Please provide any additional details about your life changes or special circumstances
              </Label>
              <Textarea
                id="additionalDetails"
                value={formData.additionalDetails || ''}
                onChange={(e) => updateField('additionalDetails', e.target.value)}
                placeholder="Describe any other important changes or circumstances that might affect your taxes..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>

          {/* Information Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h5 className="font-medium text-blue-900 mb-2">Why we ask about life changes</h5>
            <p className="text-sm text-blue-800">
              Major life events can significantly impact your tax situation. This information helps us:
            </p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1">
              <li>• Identify additional deductions and credits you may qualify for</li>
              <li>• Ensure we're using the correct filing status</li>
              <li>• Plan for any special tax situations</li>
              <li>• Provide personalized tax advice</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg">
          Continue to Service Selection
        </Button>
      </div>
    </div>
  )
}
