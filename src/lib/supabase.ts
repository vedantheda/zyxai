import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔐 Supabase Config:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length,
  keyLength: supabaseAnonKey?.length
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          organization_name: string | null
          avatar_url: string | null
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          organization_name?: string | null
          avatar_url?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          organization_name?: string | null
          avatar_url?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string | null
          type: 'individual' | 'business'
          status: 'documents_pending' | 'in_review' | 'onboarding' | 'completed' | 'filed' | 'active' | 'pending' | 'complete' | 'inactive'
          priority: 'high' | 'medium' | 'low'
          progress: number
          documents_count: number
          last_activity: string
          created_at: string
          updated_at: string
          practice_id: string | null
          assigned_to: string | null
          tax_year: number | null
          estimated_refund: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone?: string | null
          type: 'individual' | 'business'
          status?: 'documents_pending' | 'in_review' | 'onboarding' | 'completed' | 'filed' | 'active' | 'pending' | 'complete' | 'inactive'
          priority?: 'high' | 'medium' | 'low'
          progress?: number
          documents_count?: number
          last_activity?: string
          created_at?: string
          updated_at?: string
          practice_id?: string | null
          assigned_to?: string | null
          tax_year?: number | null
          estimated_refund?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string | null
          type?: 'individual' | 'business'
          status?: 'documents_pending' | 'in_review' | 'onboarding' | 'completed' | 'filed' | 'active' | 'pending' | 'complete' | 'inactive'
          priority?: 'high' | 'medium' | 'low'
          progress?: number
          documents_count?: number
          last_activity?: string
          created_at?: string
          updated_at?: string
          practice_id?: string | null
          assigned_to?: string | null
          tax_year?: number | null
          estimated_refund?: string | null
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
          ai_analysis_result: any | null
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
          ai_analysis_result?: any | null
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
          ai_analysis_result?: any | null
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
          status: 'not_started' | 'in_progress' | 'scheduled' | 'pending' | 'completed'
          priority: 'high' | 'medium' | 'low'
          category: string
          assignee: string | null
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
          status?: 'not_started' | 'in_progress' | 'scheduled' | 'pending' | 'completed'
          priority?: 'high' | 'medium' | 'low'
          category: string
          assignee?: string | null
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
          status?: 'not_started' | 'in_progress' | 'scheduled' | 'pending' | 'completed'
          priority?: 'high' | 'medium' | 'low'
          category?: string
          assignee?: string | null
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      onboarding_sessions: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          current_step: number
          completed_steps: number[]
          form_data: any
          status: 'in_progress' | 'completed' | 'abandoned'
          started_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          current_step?: number
          completed_steps?: number[]
          form_data?: any
          status?: 'in_progress' | 'completed' | 'abandoned'
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          current_step?: number
          completed_steps?: number[]
          form_data?: any
          status?: 'in_progress' | 'completed' | 'abandoned'
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      client_intake_data: {
        Row: {
          id: string
          client_id: string
          user_id: string
          legal_first_name: string | null
          legal_last_name: string | null
          middle_name: string | null
          preferred_name: string | null
          name_suffix: string | null
          previous_names: string[] | null
          ssn: string | null
          date_of_birth: string | null
          place_of_birth: string | null
          citizenship_status: string | null
          drivers_license_number: string | null
          drivers_license_state: string | null
          passport_number: string | null
          primary_email: string | null
          secondary_email: string | null
          home_phone: string | null
          cell_phone: string | null
          work_phone: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          preferred_contact_method: string | null
          best_contact_time: string | null
          time_zone: string | null
          current_address: any | null
          mailing_address: any | null
          spouse_info: any | null
          dependents: any[] | null
          employment_info: any | null
          self_employment_info: any | null
          income_sources: any | null
          deductions_credits: any | null
          life_changes: any | null
          service_level: string | null
          service_preferences: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          user_id: string
          legal_first_name?: string | null
          legal_last_name?: string | null
          middle_name?: string | null
          preferred_name?: string | null
          name_suffix?: string | null
          previous_names?: string[] | null
          ssn?: string | null
          date_of_birth?: string | null
          place_of_birth?: string | null
          citizenship_status?: string | null
          drivers_license_number?: string | null
          drivers_license_state?: string | null
          passport_number?: string | null
          primary_email?: string | null
          secondary_email?: string | null
          home_phone?: string | null
          cell_phone?: string | null
          work_phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          preferred_contact_method?: string | null
          best_contact_time?: string | null
          time_zone?: string | null
          current_address?: any | null
          mailing_address?: any | null
          spouse_info?: any | null
          dependents?: any[] | null
          employment_info?: any | null
          self_employment_info?: any | null
          income_sources?: any | null
          deductions_credits?: any | null
          life_changes?: any | null
          service_level?: string | null
          service_preferences?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          user_id?: string
          legal_first_name?: string | null
          legal_last_name?: string | null
          middle_name?: string | null
          preferred_name?: string | null
          name_suffix?: string | null
          previous_names?: string[] | null
          ssn?: string | null
          date_of_birth?: string | null
          place_of_birth?: string | null
          citizenship_status?: string | null
          drivers_license_number?: string | null
          drivers_license_state?: string | null
          passport_number?: string | null
          primary_email?: string | null
          secondary_email?: string | null
          home_phone?: string | null
          cell_phone?: string | null
          work_phone?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          preferred_contact_method?: string | null
          best_contact_time?: string | null
          time_zone?: string | null
          current_address?: any | null
          mailing_address?: any | null
          spouse_info?: any | null
          dependents?: any[] | null
          employment_info?: any | null
          self_employment_info?: any | null
          income_sources?: any | null
          deductions_credits?: any | null
          life_changes?: any | null
          service_level?: string | null
          service_preferences?: any | null
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
  }
}
