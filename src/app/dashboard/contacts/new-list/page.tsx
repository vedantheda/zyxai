'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContactService } from '@/lib/services/ContactService'
import { useOrganization } from '@/hooks/useOrganization'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Save,
  Users,
  Plus,
  X
} from 'lucide-react'

export default function NewContactListPage() {
  const router = useRouter()
  const { organization, loading: orgLoading, error: orgError } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (!name.trim()) {
        setError('Contact list name is required')
        setSaving(false)
        return
      }

      if (!organization) {
        setError('Organization not found')
        setSaving(false)
        return
      }

      const { contactList, error } = await ContactService.createContactList(
        organization.id,
        {
          name: name.trim(),
          description: description.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined
        }
      )

      if (error) {
        setError(error)
      } else if (contactList) {
        // Redirect to contacts page
        router.push('/dashboard/contacts')
      }
    } catch (err) {
      setError('Failed to create contact list')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/contacts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Create Contact List</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-blue-600" />
              <CardTitle>New Contact List</CardTitle>
            </div>
            <CardDescription>
              Create a new contact list to organize your customers and leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">List Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Real Estate Leads, Insurance Prospects"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this contact list..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Tags help you categorize and filter your contact lists
                </p>
              </div>

              <div className="flex space-x-3">
                <Button type="submit" disabled={saving || !name.trim()}>
                  {saving ? (
                    <>
                      <Save className="mr-2 h-4 w-4 animate-pulse" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create Contact List
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/contacts')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Tips for Organizing Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <strong>By Industry:</strong> Create lists like "Real Estate Clients", "Insurance Leads", "Healthcare Prospects"
              </div>
              <div>
                <strong>By Stage:</strong> Organize by "Cold Leads", "Warm Prospects", "Active Clients", "Past Customers"
              </div>
              <div>
                <strong>By Campaign:</strong> Group contacts for specific marketing campaigns or outreach efforts
              </div>
              <div>
                <strong>By Geography:</strong> Separate contacts by location for targeted local campaigns
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
