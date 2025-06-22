// ZyxAI Contact Service
// Handles contact and contact list management

import { supabase } from '@/lib/supabase'
import { Contact, ContactList } from '@/types/database'

export class ContactService {

  // Create contact list using API
  static async createContactList(
    organizationId: string,
    data: {
      name: string
      description?: string
      tags?: string[]
    },
    createdBy?: string
  ): Promise<{ contactList: ContactList | null; error: string | null }> {
    try {
      const response = await fetch('/api/contact-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          name: data.name,
          description: data.description,
          tags: data.tags,
          createdBy
        })
      })

      const result = await response.json()

      if (!response.ok) {
        return { contactList: null, error: result.error || 'Failed to create contact list' }
      }

      return { contactList: result.contactList, error: null }
    } catch (error: any) {
      return { contactList: null, error: error.message || 'Failed to create contact list' }
    }
  }

  // Get organization's contact lists using API
  static async getContactLists(organizationId: string): Promise<{ contactLists: ContactList[]; error: string | null }> {
    try {
      const response = await fetch(`/api/contact-lists?organizationId=${organizationId}`)
      const result = await response.json()

      if (!response.ok) {
        return { contactLists: [], error: result.error || 'Failed to fetch contact lists' }
      }

      return { contactLists: result.contactLists || [], error: null }
    } catch (error: any) {
      return { contactLists: [], error: error.message || 'Failed to fetch contact lists' }
    }
  }

  // Add contact to list
  static async addContact(
    organizationId: string,
    listId: string,
    contactData: {
      first_name?: string
      last_name?: string
      email?: string
      phone: string
      company?: string
      title?: string
      custom_fields?: any
      tags?: string[]
    }
  ): Promise<{ contact: Contact | null; error: string | null }> {
    try {
      // Validate phone number
      if (!contactData.phone || contactData.phone.trim().length < 10) {
        return { contact: null, error: 'Valid phone number is required' }
      }

      // Check for duplicate phone in organization
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('phone', contactData.phone)
        .single()

      if (existing) {
        return { contact: null, error: 'Contact with this phone number already exists' }
      }

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          organization_id: organizationId,
          list_id: listId,
          first_name: contactData.first_name,
          last_name: contactData.last_name,
          email: contactData.email,
          phone: contactData.phone,
          company: contactData.company,
          title: contactData.title,
          custom_fields: contactData.custom_fields || {},
          tags: contactData.tags || [],
          lead_score: 0,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        return { contact: null, error: error.message }
      }

      // Update contact list counts
      await this.updateContactListCounts(listId)

      return { contact, error: null }
    } catch (error) {
      return { contact: null, error: 'Failed to add contact' }
    }
  }

  // Import contacts from CSV data
  static async importContacts(
    organizationId: string,
    listId: string,
    contacts: Array<{
      first_name?: string
      last_name?: string
      email?: string
      phone: string
      company?: string
      title?: string
    }>
  ): Promise<{
    imported: number
    failed: number
    errors: string[]
  }> {
    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (const contactData of contacts) {
      const { contact, error } = await this.addContact(organizationId, listId, contactData)
      if (contact) {
        imported++
      } else {
        failed++
        if (error) errors.push(error)
      }
    }

    return { imported, failed, errors }
  }

  // Get contacts from list
  static async getContacts(
    listId: string,
    options?: {
      status?: Contact['status']
      search?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ contacts: Contact[]; total: number; error: string | null }> {
    try {
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('list_id', listId)

      if (options?.status) {
        query = query.eq('status', options.status)
      }

      if (options?.search) {
        query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,email.ilike.%${options.search}%,phone.ilike.%${options.search}%,company.ilike.%${options.search}%`)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      query = query.order('created_at', { ascending: false })

      const { data: contacts, error, count } = await query

      if (error) {
        return { contacts: [], total: 0, error: error.message }
      }

      return { contacts: contacts || [], total: count || 0, error: null }
    } catch (error) {
      return { contacts: [], total: 0, error: 'Failed to fetch contacts' }
    }
  }

  // Update contact
  static async updateContact(
    contactId: string,
    updates: Partial<Omit<Contact, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ contact: Contact | null; error: string | null }> {
    try {
      const { data: contact, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', contactId)
        .select()
        .single()

      if (error) {
        return { contact: null, error: error.message }
      }

      return { contact, error: null }
    } catch (error) {
      return { contact: null, error: 'Failed to update contact' }
    }
  }

  // Delete contact
  static async deleteContact(contactId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to delete contact' }
    }
  }

  // Update contact list counts
  static async updateContactListCounts(listId: string): Promise<void> {
    try {
      const { data: contacts } = await supabase
        .from('contacts')
        .select('status')
        .eq('list_id', listId)

      if (contacts) {
        const totalContacts = contacts.length
        const activeContacts = contacts.filter(c => c.status === 'active').length

        await supabase
          .from('contact_lists')
          .update({
            total_contacts: totalContacts,
            active_contacts: activeContacts
          })
          .eq('id', listId)
      }
    } catch (error) {
      console.error('Failed to update contact list counts:', error)
    }
  }

  // Parse CSV data
  static parseCSV(csvText: string): Array<Record<string, string>> {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const contacts: Array<Record<string, string>> = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const contact: Record<string, string> = {}

      headers.forEach((header, index) => {
        contact[header] = values[index] || ''
      })

      contacts.push(contact)
    }

    return contacts
  }

  // Map CSV fields to contact fields
  static mapCSVToContact(csvRow: Record<string, string>): {
    first_name?: string
    last_name?: string
    email?: string
    phone: string
    company?: string
    title?: string
  } | null {
    // Try to find phone number in various possible field names
    const phoneFields = ['phone', 'Phone', 'PHONE', 'phone_number', 'Phone Number', 'mobile', 'Mobile', 'cell', 'Cell']
    let phone = ''

    for (const field of phoneFields) {
      if (csvRow[field]) {
        phone = csvRow[field]
        break
      }
    }

    if (!phone) {
      return null // Phone is required
    }

    return {
      first_name: csvRow['first_name'] || csvRow['First Name'] || csvRow['firstName'] || '',
      last_name: csvRow['last_name'] || csvRow['Last Name'] || csvRow['lastName'] || '',
      email: csvRow['email'] || csvRow['Email'] || csvRow['EMAIL'] || '',
      phone: phone,
      company: csvRow['company'] || csvRow['Company'] || csvRow['COMPANY'] || '',
      title: csvRow['title'] || csvRow['Title'] || csvRow['job_title'] || csvRow['Job Title'] || ''
    }
  }

  // Validate contact data
  static validateContact(contact: Partial<Contact>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!contact.phone || contact.phone.trim().length < 10) {
      errors.push('Valid phone number is required (minimum 10 digits)')
    }

    if (contact.email && !contact.email.includes('@')) {
      errors.push('Invalid email format')
    }

    if (contact.first_name && contact.first_name.length > 100) {
      errors.push('First name must be less than 100 characters')
    }

    if (contact.last_name && contact.last_name.length > 100) {
      errors.push('Last name must be less than 100 characters')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Get contact statistics
  static async getContactStats(organizationId: string): Promise<{
    totalContacts: number
    activeContacts: number
    totalLists: number
    recentlyAdded: number
  }> {
    try {
      // Get total contacts
      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      // Get active contacts
      const { count: activeContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active')

      // Get total lists
      const { count: totalLists } = await supabase
        .from('contact_lists')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)

      // Get recently added (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: recentlyAdded } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .gte('created_at', sevenDaysAgo.toISOString())

      return {
        totalContacts: totalContacts || 0,
        activeContacts: activeContacts || 0,
        totalLists: totalLists || 0,
        recentlyAdded: recentlyAdded || 0
      }
    } catch (error) {
      return {
        totalContacts: 0,
        activeContacts: 0,
        totalLists: 0,
        recentlyAdded: 0
      }
    }
  }
}
