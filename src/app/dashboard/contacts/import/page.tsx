'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ContactService } from '@/lib/services/ContactService'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react'

export default function ContactImportPage() {
  const router = useRouter()
  const { user, loading: authLoading, authError } = useAuth()
  const organization = user?.organization
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    imported: number
    failed: number
    errors: string[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import')
      return
    }

    setImporting(true)
    setProgress(0)
    setError(null)

    try {
      // Read file content
      const text = await file.text()
      const csvData = ContactService.parseCSV(text)

      if (csvData.length === 0) {
        setError('No valid data found in CSV file')
        setImporting(false)
        return
      }

      // Map CSV data to contacts
      const contacts = csvData
        .map(row => ContactService.mapCSVToContact(row))
        .filter(contact => contact !== null)

      if (contacts.length === 0) {
        setError('No valid contacts found. Please ensure your CSV has a phone number column.')
        setImporting(false)
        return
      }

      // Simulate progress
      setProgress(25)

      if (!organization) {
        setError('Organization not found')
        setImporting(false)
        return
      }

      // For now, we'll create a default list or use the first available list
      // TODO: Allow user to select which list to import to
      const { contactLists } = await ContactService.getContactLists(organization.id)
      let listId = contactLists[0]?.id

      if (!listId) {
        // Create a default list if none exists
        const { contactList } = await ContactService.createContactList(organization.id, {
          name: 'Imported Contacts',
          description: 'Contacts imported from CSV'
        })
        listId = contactList?.id
      }

      if (!listId) {
        setError('Failed to create contact list')
        setImporting(false)
        return
      }

      setProgress(50)

      // Import contacts
      const importResult = await ContactService.importContacts(
        organization.id,
        listId,
        contacts
      )

      setProgress(100)
      setResult(importResult)
    } catch (err) {
      setError('Failed to import contacts. Please check your file format.')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = 'first_name,last_name,email,phone,company,title\nJohn,Doe,john@example.com,555-123-4567,Acme Corp,Manager\nJane,Smith,jane@example.com,555-987-6543,Tech Inc,Developer'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contact_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (result) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/contacts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contacts
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Import Complete</h1>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <CardTitle>Import Results</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.imported}</div>
                <div className="text-sm text-green-700">Contacts Imported</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                <div className="text-sm text-red-700">Failed Imports</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Import Errors:</h4>
                <div className="space-y-1">
                  {result.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {error}
                    </div>
                  ))}
                  {result.errors.length > 5 && (
                    <div className="text-sm text-gray-500">
                      And {result.errors.length - 5} more errors...
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <Button onClick={() => router.push('/dashboard/contacts')}>
                View Contacts
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Import More Contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" onClick={() => router.push('/dashboard/contacts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Import Contacts</h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Import Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Import your contacts from a CSV file. Make sure your file includes phone numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">Select CSV File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importing}
              />
            </div>

            {file && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">{file.name}</div>
                  <div className="text-sm text-blue-700">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
            )}

            {importing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing contacts...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full"
            >
              {importing ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Contacts
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>CSV Format Requirements</CardTitle>
            <CardDescription>
              Follow these guidelines for successful import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Required Columns:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>phone</strong> - Phone number (required)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Optional Columns:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• first_name - First name</li>
                <li>• last_name - Last name</li>
                <li>• email - Email address</li>
                <li>• company - Company name</li>
                <li>• title - Job title</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tips:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use standard CSV format</li>
                <li>• Include column headers in first row</li>
                <li>• Phone numbers can include formatting</li>
                <li>• Duplicate phone numbers will be skipped</li>
              </ul>
            </div>

            <Button variant="outline" onClick={downloadTemplate} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
