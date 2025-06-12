import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

export interface ShareLink {
  id: string
  documentId: string
  token: string
  expiresAt: Date | null
  maxDownloads: number | null
  downloadCount: number
  isPasswordProtected: boolean
  allowedEmails: string[]
  permissions: SharePermission[]
  createdBy: string
  createdAt: Date
}

export interface SharePermission {
  action: 'view' | 'download' | 'comment'
  granted: boolean
}

export interface ShareOptions {
  expiresIn?: number // hours
  maxDownloads?: number
  password?: string
  allowedEmails?: string[]
  permissions?: SharePermission[]
  requireAuth?: boolean
}

export interface ClientPortalAccess {
  clientId: string
  accessToken: string
  expiresAt: Date
  allowedDocuments: string[]
  permissions: string[]
}

export class FileSharingService {
  private supabaseClient = supabase

  constructor(private userId: string) {}

  /**
   * Create a secure share link for a document
   */
  async createShareLink(
    documentId: string,
    options: ShareOptions = {}
  ): Promise<{ success: boolean; shareLink?: string; error?: string }> {
    try {
      // Verify user owns the document
      const { data: document, error: docError } = await this.supabaseClient
        .from('documents')
        .select('id, name, client_id')
        .eq('id', documentId)
        .eq('user_id', this.userId)
        .single()

      if (docError || !document) {
        throw new Error('Document not found or access denied')
      }

      // Generate secure token
      const token = this.generateSecureToken()

      // Calculate expiration
      const expiresAt = options.expiresIn
        ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000)
        : null

      // Create share record
      const shareData = {
        document_id: documentId,
        token,
        expires_at: expiresAt?.toISOString(),
        max_downloads: options.maxDownloads,
        download_count: 0,
        is_password_protected: !!options.password,
        password_hash: options.password ? await this.hashPassword(options.password) : null,
        allowed_emails: options.allowedEmails || [],
        permissions: options.permissions || [
          { action: 'view', granted: true },
          { action: 'download', granted: true }
        ],
        require_auth: options.requireAuth || false,
        created_by: this.userId
      }

      const { data: shareRecord, error: shareError } = await this.supabaseClient
        .from('document_shares')
        .insert(shareData)
        .select()
        .single()

      if (shareError) {
        throw new Error(`Failed to create share link: ${shareError.message}`)
      }

      // Generate public share URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const shareLink = `${baseUrl}/share/${token}`

      return {
        success: true,
        shareLink
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create share link'
      }
    }
  }

  /**
   * Create client portal access for secure document sharing
   */
  async createClientPortalAccess(
    clientId: string,
    documentIds: string[],
    expiresInDays: number = 30
  ): Promise<{ success: boolean; portalUrl?: string; error?: string }> {
    try {
      // Verify all documents belong to user and client
      const { data: documents, error: docsError } = await this.supabaseClient
        .from('documents')
        .select('id')
        .eq('user_id', this.userId)
        .eq('client_id', clientId)
        .in('id', documentIds)

      if (docsError || !documents || documents.length !== documentIds.length) {
        throw new Error('Some documents not found or access denied')
      }

      // Generate access token
      const accessToken = this.generateSecureToken()
      const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

      // Create portal access record
      const portalData = {
        client_id: clientId,
        access_token: accessToken,
        expires_at: expiresAt.toISOString(),
        allowed_documents: documentIds,
        permissions: ['view', 'download', 'upload'],
        created_by: this.userId
      }

      const { error: portalError } = await this.supabaseClient
        .from('client_portal_access')
        .insert(portalData)

      if (portalError) {
        throw new Error(`Failed to create portal access: ${portalError.message}`)
      }

      // Generate portal URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const portalUrl = `${baseUrl}/client-portal/${accessToken}`

      return {
        success: true,
        portalUrl
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create portal access'
      }
    }
  }

  /**
   * Validate and get share link details
   */
  async validateShareLink(
    token: string,
    password?: string
  ): Promise<{ valid: boolean; document?: any; error?: string }> {
    try {
      const { data: share, error: shareError } = await this.supabaseClient
        .from('document_shares')
        .select(`
          *,
          documents (
            id,
            name,
            type,
            size,
            file_url,
            clients (name)
          )
        `)
        .eq('token', token)
        .single()

      if (shareError || !share) {
        return { valid: false, error: 'Share link not found' }
      }

      // Check expiration
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return { valid: false, error: 'Share link has expired' }
      }

      // Check download limit
      if (share.max_downloads && share.download_count >= share.max_downloads) {
        return { valid: false, error: 'Download limit exceeded' }
      }

      // Check password if required
      if (share.is_password_protected) {
        if (!password) {
          return { valid: false, error: 'Password required' }
        }

        const isValidPassword = await this.verifyPassword(password, share.password_hash)
        if (!isValidPassword) {
          return { valid: false, error: 'Invalid password' }
        }
      }

      return {
        valid: true,
        document: share.documents
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }
    }
  }

  /**
   * Track download and update counters
   */
  async trackDownload(token: string): Promise<void> {
    // First get the current download count
    const { data: shareData } = await this.supabaseClient
      .from('document_shares')
      .select('download_count')
      .eq('token', token)
      .single()

    // Update download count and last accessed time
    await this.supabaseClient
      .from('document_shares')
      .update({
        download_count: (shareData?.download_count || 0) + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('token', token)
  }

  /**
   * Get all active share links for user's documents
   */
  async getUserShareLinks(): Promise<ShareLink[]> {
    const { data, error } = await this.supabaseClient
      .from('document_shares')
      .select(`
        *,
        documents (
          name,
          clients (name)
        )
      `)
      .eq('created_by', this.userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching share links:', error)
      return []
    }

    return data || []
  }

  /**
   * Revoke a share link
   */
  async revokeShareLink(shareId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabaseClient
        .from('document_shares')
        .delete()
        .eq('id', shareId)
        .eq('created_by', this.userId)

      if (error) {
        throw new Error(`Failed to revoke share link: ${error.message}`)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke share link'
      }
    }
  }

  /**
   * Generate secure random token
   */
  private generateSecureToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Hash password for secure storage
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password)
    return passwordHash === hash
  }
}

// Create database tables for sharing functionality
export const createSharingTables = async () => {
  const queries = [
    `
    CREATE TABLE IF NOT EXISTS public.document_shares (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE,
      max_downloads INTEGER,
      download_count INTEGER DEFAULT 0,
      is_password_protected BOOLEAN DEFAULT false,
      password_hash TEXT,
      allowed_emails TEXT[] DEFAULT '{}',
      permissions JSONB DEFAULT '[]',
      require_auth BOOLEAN DEFAULT false,
      created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      last_accessed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS public.client_portal_access (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
      access_token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      allowed_documents UUID[] DEFAULT '{}',
      permissions TEXT[] DEFAULT '{}',
      created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      last_accessed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `,
    `
    CREATE INDEX IF NOT EXISTS idx_document_shares_token ON public.document_shares(token);
    CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON public.document_shares(document_id);
    CREATE INDEX IF NOT EXISTS idx_client_portal_access_token ON public.client_portal_access(access_token);
    CREATE INDEX IF NOT EXISTS idx_client_portal_access_client_id ON public.client_portal_access(client_id);
    `,
    `
    ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.client_portal_access ENABLE ROW LEVEL SECURITY;
    `,
    `
    CREATE POLICY "Users can manage their document shares" ON public.document_shares
      FOR ALL USING (created_by = auth.uid());

    CREATE POLICY "Users can manage their client portal access" ON public.client_portal_access
      FOR ALL USING (created_by = auth.uid());
    `
  ]

  for (const query of queries) {
    try {
      await supabase.rpc('exec_sql', { sql: query })
    } catch (error) {
      console.error('Error creating sharing tables:', error)
    }
  }
}
