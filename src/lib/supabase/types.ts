export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string | null
          type: 'individual' | 'business'
          status: 'active' | 'pending' | 'complete' | 'inactive'
          priority: 'high' | 'medium' | 'low'
          progress: number
          documents_count: number
          last_activity: string
          created_at: string
          updated_at: string
          organization_name?: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone?: string | null
          type: 'individual' | 'business'
          status?: 'active' | 'pending' | 'complete' | 'inactive'
          priority?: 'high' | 'medium' | 'low'
          progress?: number
          documents_count?: number
          last_activity?: string
          created_at?: string
          updated_at?: string
          organization_name?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string | null
          type?: 'individual' | 'business'
          status?: 'active' | 'pending' | 'complete' | 'inactive'
          priority?: 'high' | 'medium' | 'low'
          progress?: number
          documents_count?: number
          last_activity?: string
          created_at?: string
          updated_at?: string
          organization_name?: string
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          organization_name: string | null
          role: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          organization_name?: string | null
          role?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          organization_name?: string | null
          role?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          client_id: string
          name: string
          type: string
          size: number
          category: string
          status: 'pending' | 'processing' | 'processed' | 'error'
          ai_analysis_status: 'pending' | 'in_progress' | 'complete' | 'error'
          ai_analysis_result: Json | null
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          name: string
          type: string
          size: number
          category: string
          status?: 'pending' | 'processing' | 'processed' | 'error'
          ai_analysis_status?: 'pending' | 'in_progress' | 'complete' | 'error'
          ai_analysis_result?: Json | null
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          name?: string
          type?: string
          size?: number
          category?: string
          status?: 'pending' | 'processing' | 'processed' | 'error'
          ai_analysis_status?: 'pending' | 'in_progress' | 'complete' | 'error'
          ai_analysis_result?: Json | null
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          title: string
          description: string | null
          status: string
          priority: string
          category: string
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          title: string
          description?: string | null
          status?: string
          priority?: string
          category?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          title?: string
          description?: string | null
          status?: string
          priority?: string
          category?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
