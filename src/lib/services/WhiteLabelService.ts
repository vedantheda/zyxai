import { supabase } from '@/lib/supabase'
import { WhiteLabelConfig, AgencyClient } from '@/types/whitelabel'

export class WhiteLabelService {
  /**
   * Get white-label configuration for an organization
   */
  static async getWhiteLabelConfig(organizationId: string): Promise<{
    config: WhiteLabelConfig | null
    error: string | null
  }> {
    try {
      const response = await fetch(`/api/white-label?organizationId=${organizationId}`)
      const data = await response.json()

      if (!response.ok) {
        return { config: null, error: data.error || 'Failed to get configuration' }
      }

      return { config: data.config, error: null }
    } catch (error: any) {
      return { config: null, error: error.message }
    }
  }

  /**
   * Create or update white-label configuration
   */
  static async upsertWhiteLabelConfig(
    organizationId: string,
    config: Partial<WhiteLabelConfig>
  ): Promise<{
    config: WhiteLabelConfig | null
    error: string | null
  }> {
    try {
      const response = await fetch('/api/white-label', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organizationId,
          config
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return { config: null, error: data.error || 'Failed to save configuration' }
      }

      return { config: data.config, error: null }
    } catch (error: any) {
      return { config: null, error: error.message }
    }
  }

  /**
   * Get white-label config by subdomain
   */
  static async getConfigBySubdomain(subdomain: string): Promise<{
    config: WhiteLabelConfig | null
    error: string | null
  }> {
    try {
      const { data, error } = await supabase
        .from('white_label_configs')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        return { config: null, error: error.message }
      }

      return { config: data, error: null }
    } catch (error: any) {
      return { config: null, error: error.message }
    }
  }

  /**
   * Get white-label config by custom domain
   */
  static async getConfigByDomain(domain: string): Promise<{
    config: WhiteLabelConfig | null
    error: string | null
  }> {
    try {
      const { data, error } = await supabase
        .from('white_label_configs')
        .select('*')
        .eq('custom_domain', domain)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        return { config: null, error: error.message }
      }

      return { config: data, error: null }
    } catch (error: any) {
      return { config: null, error: error.message }
    }
  }

  /**
   * Create agency client relationship
   */
  static async createAgencyClient(
    agencyOrganizationId: string,
    clientData: Partial<AgencyClient>
  ): Promise<{
    client: AgencyClient | null
    error: string | null
  }> {
    try {
      const { data, error } = await supabase
        .from('agency_clients')
        .insert({
          agency_organization_id: agencyOrganizationId,
          ...clientData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        return { client: null, error: error.message }
      }

      return { client: data, error: null }
    } catch (error: any) {
      return { client: null, error: error.message }
    }
  }

  /**
   * Get agency clients
   */
  static async getAgencyClients(agencyOrganizationId: string): Promise<{
    clients: AgencyClient[]
    error: string | null
  }> {
    try {
      const { data, error } = await supabase
        .from('agency_clients')
        .select('*')
        .eq('agency_organization_id', agencyOrganizationId)
        .order('created_at', { ascending: false })

      if (error) {
        return { clients: [], error: error.message }
      }

      return { clients: data || [], error: null }
    } catch (error: any) {
      return { clients: [], error: error.message }
    }
  }

  /**
   * Generate subdomain from organization name
   */
  static generateSubdomain(organizationName: string): string {
    return organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20)
  }

  /**
   * Check if subdomain is available
   */
  static async isSubdomainAvailable(subdomain: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('white_label_configs')
        .select('id')
        .eq('subdomain', subdomain)
        .single()

      // If no data found, subdomain is available
      return !data
    } catch (error) {
      // If error, assume available (could be network issue)
      return true
    }
  }

  /**
   * Get default white-label configuration
   */
  static getDefaultConfig(organizationId: string, organizationName: string): Partial<WhiteLabelConfig> {
    return {
      organization_id: organizationId,
      brand_name: organizationName,
      subdomain: this.generateSubdomain(organizationName),
      brand_colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#06b6d4',
        background: '#ffffff',
        foreground: '#0f172a'
      },
      support_email: 'support@' + this.generateSubdomain(organizationName) + '.com',
      features_enabled: {
        voice_agents: true,
        sms_agents: false,
        email_agents: false,
        whatsapp_agents: false,
        social_media_agents: false,
        crm_integrations: true,
        analytics: true,
        white_label_branding: false
      },
      pricing_model: 'per_call',
      pricing_config: {
        per_call_price: 0.10,
        included_calls: 100
      },
      is_agency: false,
      is_active: true
    }
  }
}
