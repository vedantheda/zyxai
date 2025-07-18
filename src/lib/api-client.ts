import { supabase } from './supabase'

/**
 * Authenticated API client that automatically includes session tokens
 */
export class AuthenticatedApiClient {
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No valid session found. Please sign in again.')
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    }
  }

  static async get(url: string): Promise<Response> {
    const headers = await this.getAuthHeaders()
    
    return fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    })
  }

  static async post(url: string, data?: any): Promise<Response> {
    const headers = await this.getAuthHeaders()
    
    return fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  static async put(url: string, data?: any): Promise<Response> {
    const headers = await this.getAuthHeaders()
    
    return fetch(url, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  static async delete(url: string): Promise<Response> {
    const headers = await this.getAuthHeaders()
    
    return fetch(url, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    })
  }
}

/**
 * Convenience function for authenticated API calls
 */
export const apiClient = AuthenticatedApiClient
