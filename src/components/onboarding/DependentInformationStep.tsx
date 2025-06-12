'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Plus, Trash2 } from 'lucide-react'

interface Dependent {
  id: string
  firstName: string
  lastName: string
  ssn: string
  dateOfBirth: string
  relationship: string
  monthsLivedWithYou: string
  qualifyingChild: boolean
  qualifyingRelative: boolean
}

interface DependentInformationData {
  dependents: Dependent[]
  hasDependents: boolean
}

interface DependentInformationStepProps {
  data: Partial<DependentInformationData>
  onUpdate: (data: Partial<DependentInformationData>) => void
  onNext: () => void
  onComplete: () => void
  isLastStep: boolean
}

export default function DependentInformationStep({
  data,
  onUpdate,
  onNext,
  onComplete,
  isLastStep
}: DependentInformationStepProps) {
  const [formData, setFormData] = useState<Partial<DependentInformationData>>({
    dependents: [],
    hasDependents: false,
    ...data
  })

  useEffect(() => {
    onUpdate(formData)
  }, [formData, onUpdate])

  const addDependent = () => {
    const newDependent: Dependent = {
      id: Date.now().toString(),
      firstName: '',
      lastName: '',
      ssn: '',
      dateOfBirth: '',
      relationship: '',
      monthsLivedWithYou: '',
      qualifyingChild: false,
      qualifyingRelative: false
    }

    setFormData(prev => ({
      ...prev,
      dependents: [...(prev.dependents || []), newDependent],
      hasDependents: true
    }))
  }

  const removeDependent = (id: string) => {
    setFormData(prev => {
      const newDependents = (prev.dependents || []).filter(dep => dep.id !== id)
      return {
        ...prev,
        dependents: newDependents,
        hasDependents: newDependents.length > 0
      }
    })
  }

  const updateDependent = (id: string, field: keyof Dependent, value: any) => {
    setFormData(prev => ({
      ...prev,
      dependents: (prev.dependents || []).map(dep =>
        dep.id === id ? { ...dep, [field]: value } : dep
      )
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
            <Users className="w-5 h-5" />
            <span>Dependents</span>
          </CardTitle>
          <CardDescription>
            Add information about your dependents (children, relatives you support)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Do you have any dependents to claim on your tax return?
              </p>
              <Button onClick={addDependent} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Dependent
              </Button>
            </div>

            {formData.dependents && formData.dependents.length > 0 ? (
              <div className="space-y-4">
                {formData.dependents.map((dependent, index) => (
                  <Card key={dependent.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Dependent #{index + 1}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDependent(dependent.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>First Name</Label>
                          <Input
                            value={dependent.firstName}
                            onChange={(e) => updateDependent(dependent.id, 'firstName', e.target.value)}
                            placeholder="Dependent's first name"
                          />
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input
                            value={dependent.lastName}
                            onChange={(e) => updateDependent(dependent.id, 'lastName', e.target.value)}
                            placeholder="Dependent's last name"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Social Security Number</Label>
                          <Input
                            value={dependent.ssn}
                            onChange={(e) => updateDependent(dependent.id, 'ssn', e.target.value)}
                            placeholder="XXX-XX-XXXX"
                          />
                        </div>
                        <div>
                          <Label>Date of Birth</Label>
                          <Input
                            type="date"
                            value={dependent.dateOfBirth}
                            onChange={(e) => updateDependent(dependent.id, 'dateOfBirth', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Relationship</Label>
                          <Input
                            value={dependent.relationship}
                            onChange={(e) => updateDependent(dependent.id, 'relationship', e.target.value)}
                            placeholder="Son, Daughter, etc."
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Months Lived With You (2024)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="12"
                          value={dependent.monthsLivedWithYou}
                          onChange={(e) => updateDependent(dependent.id, 'monthsLivedWithYou', e.target.value)}
                          placeholder="Number of months"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No dependents added yet.</p>
                <p className="text-sm">Click "Add Dependent" to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleNext} size="lg">
          Continue to Employment
        </Button>
      </div>
    </div>
  )
}
