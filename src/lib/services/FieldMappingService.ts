import { supabase } from '@/lib/supabase'

export interface FieldMapping {
  id: string
  organization_id: string
  crm_type: string
  entity_type: 'contact' | 'call' | 'deal'
  zyxai_field: string
  crm_field: string
  field_type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone'
  is_required: boolean
  is_custom: boolean
  default_value?: string
  transformation_rule?: string // JSON string for complex transformations
  created_at: string
  updated_at: string
}

export interface CRMField {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'select' | 'multiselect'
  required: boolean
  options?: string[] // For select/multiselect fields
  description?: string
}

export interface ZyxAIField {
  name: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone'
  description?: string
}

export class FieldMappingService {
  // ===== PREDEFINED FIELD DEFINITIONS =====

  /**
   * Get ZyxAI fields for different entity types
   */
  static getZyxAIFields(entityType: 'contact' | 'call' | 'deal'): ZyxAIField[] {
    switch (entityType) {
      case 'contact':
        return [
          { name: 'first_name', label: 'First Name', type: 'string' },
          { name: 'last_name', label: 'Last Name', type: 'string' },
          { name: 'email', label: 'Email', type: 'email' },
          { name: 'phone', label: 'Phone', type: 'phone' },
          { name: 'company', label: 'Company', type: 'string' },
          { name: 'job_title', label: 'Job Title', type: 'string' },
          { name: 'status', label: 'Status', type: 'string' },
          { name: 'lead_score', label: 'Lead Score', type: 'number' },
          { name: 'created_at', label: 'Created Date', type: 'date' },
          { name: 'updated_at', label: 'Updated Date', type: 'date' }
        ]
      
      case 'call':
        return [
          { name: 'customer_name', label: 'Customer Name', type: 'string' },
          { name: 'customer_phone', label: 'Customer Phone', type: 'phone' },
          { name: 'direction', label: 'Call Direction', type: 'string' },
          { name: 'status', label: 'Call Status', type: 'string' },
          { name: 'duration', label: 'Duration (seconds)', type: 'number' },
          { name: 'summary', label: 'Call Summary', type: 'string' },
          { name: 'transcript', label: 'Transcript', type: 'string' },
          { name: 'sentiment', label: 'Sentiment', type: 'string' },
          { name: 'outcome', label: 'Call Outcome', type: 'string' },
          { name: 'recording_url', label: 'Recording URL', type: 'string' },
          { name: 'started_at', label: 'Call Date', type: 'date' },
          { name: 'agent_name', label: 'Agent Name', type: 'string' }
        ]
      
      case 'deal':
        return [
          { name: 'name', label: 'Deal Name', type: 'string' },
          { name: 'amount', label: 'Deal Amount', type: 'number' },
          { name: 'stage', label: 'Deal Stage', type: 'string' },
          { name: 'probability', label: 'Close Probability', type: 'number' },
          { name: 'expected_close_date', label: 'Expected Close Date', type: 'date' },
          { name: 'source', label: 'Lead Source', type: 'string' },
          { name: 'created_at', label: 'Created Date', type: 'date' }
        ]
      
      default:
        return []
    }
  }

  /**
   * Get HubSpot fields for different entity types
   */
  static getHubSpotFields(entityType: 'contact' | 'call' | 'deal'): CRMField[] {
    switch (entityType) {
      case 'contact':
        return [
          { name: 'firstname', label: 'First Name', type: 'string', required: false },
          { name: 'lastname', label: 'Last Name', type: 'string', required: false },
          { name: 'email', label: 'Email', type: 'email', required: false },
          { name: 'phone', label: 'Phone Number', type: 'phone', required: false },
          { name: 'company', label: 'Company Name', type: 'string', required: false },
          { name: 'jobtitle', label: 'Job Title', type: 'string', required: false },
          { name: 'lifecyclestage', label: 'Lifecycle Stage', type: 'select', required: false,
            options: ['subscriber', 'lead', 'marketingqualifiedlead', 'salesqualifiedlead', 'opportunity', 'customer', 'evangelist', 'other'] },
          { name: 'hs_lead_status', label: 'Lead Status', type: 'select', required: false,
            options: ['NEW', 'OPEN', 'IN_PROGRESS', 'OPEN_DEAL', 'UNQUALIFIED', 'ATTEMPTED_TO_CONTACT', 'CONNECTED', 'BAD_TIMING'] },
          { name: 'hubspotscore', label: 'HubSpot Score', type: 'number', required: false },
          { name: 'createdate', label: 'Create Date', type: 'date', required: false },
          { name: 'lastmodifieddate', label: 'Last Modified Date', type: 'date', required: false },
          // Custom ZyxAI fields
          { name: 'zyxai_contact_id', label: 'ZyxAI Contact ID', type: 'string', required: false },
          { name: 'zyxai_last_call_date', label: 'Last Call Date', type: 'date', required: false },
          { name: 'zyxai_call_count', label: 'Total Calls', type: 'number', required: false },
          { name: 'zyxai_lead_score', label: 'ZyxAI Lead Score', type: 'number', required: false }
        ]
      
      case 'call':
        return [
          { name: 'hs_activity_type', label: 'Activity Type', type: 'string', required: true },
          { name: 'hs_timestamp', label: 'Activity Date', type: 'date', required: true },
          { name: 'hs_call_title', label: 'Call Title', type: 'string', required: false },
          { name: 'hs_call_body', label: 'Call Notes', type: 'string', required: false },
          { name: 'hs_call_duration', label: 'Call Duration', type: 'number', required: false },
          { name: 'hs_call_status', label: 'Call Outcome', type: 'select', required: false,
            options: ['COMPLETED', 'NO_ANSWER', 'BUSY', 'FAILED'] },
          { name: 'hs_call_direction', label: 'Call Direction', type: 'select', required: false,
            options: ['INBOUND', 'OUTBOUND'] },
          { name: 'hs_call_recording_url', label: 'Recording URL', type: 'string', required: false },
          // Custom ZyxAI fields
          { name: 'zyxai_call_id', label: 'ZyxAI Call ID', type: 'string', required: false },
          { name: 'zyxai_agent_name', label: 'AI Agent Name', type: 'string', required: false },
          { name: 'zyxai_transcript', label: 'Call Transcript', type: 'string', required: false },
          { name: 'zyxai_sentiment', label: 'Call Sentiment', type: 'string', required: false }
        ]
      
      case 'deal':
        return [
          { name: 'dealname', label: 'Deal Name', type: 'string', required: true },
          { name: 'amount', label: 'Deal Amount', type: 'number', required: false },
          { name: 'dealstage', label: 'Deal Stage', type: 'select', required: false,
            options: ['appointmentscheduled', 'qualifiedtobuy', 'presentationscheduled', 'decisionmakerboughtin', 'contractsent', 'closedwon', 'closedlost'] },
          { name: 'pipeline', label: 'Pipeline', type: 'string', required: false },
          { name: 'closedate', label: 'Close Date', type: 'date', required: false },
          { name: 'dealtype', label: 'Deal Type', type: 'select', required: false,
            options: ['newbusiness', 'existingbusiness', 'renewalbusiness'] },
          { name: 'createdate', label: 'Create Date', type: 'date', required: false },
          // Custom ZyxAI fields
          { name: 'zyxai_source', label: 'ZyxAI Source', type: 'string', required: false },
          { name: 'zyxai_call_outcome', label: 'Call Outcome', type: 'string', required: false }
        ]
      
      default:
        return []
    }
  }

  // ===== FIELD MAPPING CRUD =====

  /**
   * Get field mappings for organization and CRM
   */
  static async getFieldMappings(
    organizationId: string,
    crmType: string,
    entityType?: string
  ): Promise<{ mappings: FieldMapping[]; error: string | null }> {
    try {
      let query = supabase
        .from('field_mappings')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('crm_type', crmType)

      if (entityType) {
        query = query.eq('entity_type', entityType)
      }

      const { data: mappings, error } = await query.order('created_at', { ascending: true })

      if (error) {
        return { mappings: [], error: error.message }
      }

      return { mappings: mappings || [], error: null }
    } catch (error) {
      return { mappings: [], error: 'Failed to fetch field mappings' }
    }
  }

  /**
   * Create or update field mapping
   */
  static async upsertFieldMapping(
    organizationId: string,
    mapping: Omit<FieldMapping, 'id' | 'organization_id' | 'created_at' | 'updated_at'>
  ): Promise<{ mapping: FieldMapping | null; error: string | null }> {
    try {
      const { data: existingMapping } = await supabase
        .from('field_mappings')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('crm_type', mapping.crm_type)
        .eq('entity_type', mapping.entity_type)
        .eq('zyxai_field', mapping.zyxai_field)
        .single()

      let result
      if (existingMapping) {
        // Update existing mapping
        result = await supabase
          .from('field_mappings')
          .update({
            ...mapping,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMapping.id)
          .select()
          .single()
      } else {
        // Create new mapping
        result = await supabase
          .from('field_mappings')
          .insert({
            organization_id: organizationId,
            ...mapping
          })
          .select()
          .single()
      }

      if (result.error) {
        return { mapping: null, error: result.error.message }
      }

      return { mapping: result.data, error: null }
    } catch (error) {
      return { mapping: null, error: 'Failed to save field mapping' }
    }
  }

  /**
   * Delete field mapping
   */
  static async deleteFieldMapping(mappingId: string): Promise<{
    success: boolean
    error: string | null
  }> {
    try {
      const { error } = await supabase
        .from('field_mappings')
        .delete()
        .eq('id', mappingId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to delete field mapping' }
    }
  }

  /**
   * Get default field mappings for a CRM type
   */
  static getDefaultMappings(
    crmType: string,
    entityType: 'contact' | 'call' | 'deal'
  ): Omit<FieldMapping, 'id' | 'organization_id' | 'created_at' | 'updated_at'>[] {
    if (crmType === 'hubspot') {
      switch (entityType) {
        case 'contact':
          return [
            { crm_type: 'hubspot', entity_type: 'contact', zyxai_field: 'first_name', crm_field: 'firstname', field_type: 'string', is_required: false, is_custom: false },
            { crm_type: 'hubspot', entity_type: 'contact', zyxai_field: 'last_name', crm_field: 'lastname', field_type: 'string', is_required: false, is_custom: false },
            { crm_type: 'hubspot', entity_type: 'contact', zyxai_field: 'email', crm_field: 'email', field_type: 'email', is_required: false, is_custom: false },
            { crm_type: 'hubspot', entity_type: 'contact', zyxai_field: 'phone', crm_field: 'phone', field_type: 'phone', is_required: false, is_custom: false },
            { crm_type: 'hubspot', entity_type: 'contact', zyxai_field: 'company', crm_field: 'company', field_type: 'string', is_required: false, is_custom: false },
            { crm_type: 'hubspot', entity_type: 'contact', zyxai_field: 'job_title', crm_field: 'jobtitle', field_type: 'string', is_required: false, is_custom: false },
            { crm_type: 'hubspot', entity_type: 'contact', zyxai_field: 'id', crm_field: 'zyxai_contact_id', field_type: 'string', is_required: false, is_custom: true }
          ]
        
        case 'call':
          return [
            { crm_type: 'hubspot', entity_type: 'call', zyxai_field: 'started_at', crm_field: 'hs_timestamp', field_type: 'date', is_required: true, is_custom: false },
            { crm_type: 'hubspot', entity_type: 'call', zyxai_field: 'customer_name', crm_field: 'hs_call_title', field_type: 'string', is_required: false, is_custom: false },
            { crm_type: 'hubspot', entity_type: 'call', zyxai_field: 'summary', crm_field: 'hs_call_body', field_type: 'string', is_required: false, is_custom: false },
            { crm_type: 'hubspot', entity_type: 'call', zyxai_field: 'duration', crm_field: 'hs_call_duration', field_type: 'number', is_required: false, is_custom: false },
            { crm_type: 'hubspot', entity_type: 'call', zyxai_field: 'direction', crm_field: 'hs_call_direction', field_type: 'string', is_required: false, is_custom: false },
            { crm_type: 'hubspot', entity_type: 'call', zyxai_field: 'recording_url', crm_field: 'hs_call_recording_url', field_type: 'string', is_required: false, is_custom: false },
            { crm_type: 'hubspot', entity_type: 'call', zyxai_field: 'id', crm_field: 'zyxai_call_id', field_type: 'string', is_required: false, is_custom: true },
            { crm_type: 'hubspot', entity_type: 'call', zyxai_field: 'agent_name', crm_field: 'zyxai_agent_name', field_type: 'string', is_required: false, is_custom: true }
          ]
        
        default:
          return []
      }
    }

    return []
  }

  /**
   * Initialize default mappings for organization
   */
  static async initializeDefaultMappings(
    organizationId: string,
    crmType: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const entityTypes: ('contact' | 'call' | 'deal')[] = ['contact', 'call']
      
      for (const entityType of entityTypes) {
        const defaultMappings = this.getDefaultMappings(crmType, entityType)
        
        for (const mapping of defaultMappings) {
          await this.upsertFieldMapping(organizationId, mapping)
        }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: 'Failed to initialize default mappings' }
    }
  }

  /**
   * Transform data using field mappings
   */
  static transformData(
    data: Record<string, any>,
    mappings: FieldMapping[],
    direction: 'to_crm' | 'from_crm'
  ): Record<string, any> {
    const transformed: Record<string, any> = {}

    for (const mapping of mappings) {
      const sourceField = direction === 'to_crm' ? mapping.zyxai_field : mapping.crm_field
      const targetField = direction === 'to_crm' ? mapping.crm_field : mapping.zyxai_field
      
      if (data[sourceField] !== undefined && data[sourceField] !== null) {
        let value = data[sourceField]

        // Apply transformations based on field type
        switch (mapping.field_type) {
          case 'date':
            if (direction === 'to_crm' && typeof value === 'string') {
              // Convert to timestamp for HubSpot
              value = new Date(value).getTime().toString()
            } else if (direction === 'from_crm' && typeof value === 'string') {
              // Convert from timestamp
              value = new Date(parseInt(value)).toISOString()
            }
            break
          
          case 'number':
            value = typeof value === 'string' ? parseFloat(value) : value
            break
          
          case 'boolean':
            value = typeof value === 'string' ? value.toLowerCase() === 'true' : Boolean(value)
            break
        }

        transformed[targetField] = value
      } else if (mapping.default_value) {
        transformed[targetField] = mapping.default_value
      }
    }

    return transformed
  }
}

export default FieldMappingService
