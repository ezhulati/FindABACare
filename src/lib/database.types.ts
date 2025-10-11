/**
 * TypeScript types for Supabase database
 * Generated from schema
 */

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
      cities: {
        Row: {
          id: string
          name: string
          state: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          state: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          state?: string
          slug?: string
          created_at?: string
        }
      }
      venues: {
        Row: {
          id: string
          city_id: string | null
          name: string
          slug: string | null
          address: string | null
          lat: number | null
          lng: number | null
          type: string | null
          sensory_hours: Json | null
          amenities: Json | null
          triggers: Json | null
          what_to_expect: string | null
          staff_contact: string | null
          last_verified: string | null
          verified_by: string | null
          photo_keys: string[] | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          city_id?: string | null
          name: string
          slug?: string | null
          address?: string | null
          lat?: number | null
          lng?: number | null
          type?: string | null
          sensory_hours?: Json | null
          amenities?: Json | null
          triggers?: Json | null
          what_to_expect?: string | null
          staff_contact?: string | null
          last_verified?: string | null
          verified_by?: string | null
          photo_keys?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          city_id?: string | null
          name?: string
          slug?: string | null
          address?: string | null
          lat?: number | null
          lng?: number | null
          type?: string | null
          sensory_hours?: Json | null
          amenities?: Json | null
          triggers?: Json | null
          what_to_expect?: string | null
          staff_contact?: string | null
          last_verified?: string | null
          verified_by?: string | null
          photo_keys?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          venue_id: string | null
          title: string
          description: string | null
          date: string
          start_time: string
          end_time: string
          capacity: number
          host_profile_id: string | null
          visibility: string
          approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id?: string | null
          title: string
          description?: string | null
          date: string
          start_time: string
          end_time: string
          capacity?: number
          host_profile_id?: string | null
          visibility?: string
          approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string | null
          title?: string
          description?: string | null
          date?: string
          start_time?: string
          end_time?: string
          capacity?: number
          host_profile_id?: string | null
          visibility?: string
          approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          auth_user: string | null
          role: string
          display_name: string | null
          city_id: string | null
          child_age_band: string | null
          interests: string[] | null
          communication: string[] | null
          sensory_flags: Json | null
          privacy: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          auth_user?: string | null
          role: string
          display_name?: string | null
          city_id?: string | null
          child_age_band?: string | null
          interests?: string[] | null
          communication?: string[] | null
          sensory_flags?: Json | null
          privacy?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          auth_user?: string | null
          role?: string
          display_name?: string | null
          city_id?: string | null
          child_age_band?: string | null
          interests?: string[] | null
          communication?: string[] | null
          sensory_flags?: Json | null
          privacy?: Json | null
          created_at?: string
        }
      }
      rsvps: {
        Row: {
          id: string
          event_id: string | null
          profile_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          event_id?: string | null
          profile_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string | null
          profile_id?: string | null
          status?: string
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          venue_id: string | null
          profile_id: string | null
          predictability: number | null
          staff_helpfulness: number | null
          clarity_of_signage: number | null
          would_return: boolean | null
          tips: string | null
          verified_visit: boolean
          created_at: string
        }
        Insert: {
          id?: string
          venue_id?: string | null
          profile_id?: string | null
          predictability?: number | null
          staff_helpfulness?: number | null
          clarity_of_signage?: number | null
          would_return?: boolean | null
          tips?: string | null
          verified_visit?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          venue_id?: string | null
          profile_id?: string | null
          predictability?: number | null
          staff_helpfulness?: number | null
          clarity_of_signage?: number | null
          would_return?: boolean | null
          tips?: string | null
          verified_visit?: boolean
          created_at?: string
        }
      }
      verifications: {
        Row: {
          id: string
          venue_id: string | null
          assigned_to: string | null
          status: string
          notes: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          venue_id?: string | null
          assigned_to?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          venue_id?: string | null
          assigned_to?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          completed_at?: string | null
        }
      }
      gonow_cache: {
        Row: {
          venue_id: string
          updated_at: string
          meter: string
        }
        Insert: {
          venue_id: string
          updated_at?: string
          meter: string
        }
        Update: {
          venue_id?: string
          updated_at?: string
          meter?: string
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
