export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cities: {
        Row: {
          auto_sync_enabled: boolean | null
          center_lat: number | null
          center_lng: number | null
          created_at: string | null
          id: string
          name: string
          population: number | null
          priority_tier: number | null
          slug: string
          state: string
          status: string | null
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string | null
          id?: string
          name: string
          population?: number | null
          priority_tier?: number | null
          slug: string
          state: string
          status?: string | null
        }
        Update: {
          auto_sync_enabled?: boolean | null
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string | null
          id?: string
          name?: string
          population?: number | null
          priority_tier?: number | null
          slug?: string
          state?: string
          status?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          admin_notes: string | null
          age_range: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          capacity: number | null
          city_id: string | null
          created_at: string | null
          date: string
          description: string | null
          end_time: string
          event_type: string | null
          external_id: string | null
          host_profile_id: string | null
          id: string
          is_featured: boolean | null
          last_synced_at: string | null
          scraped_at: string | null
          source_name: string | null
          source_url: string | null
          start_time: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          age_range?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          capacity?: number | null
          city_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          end_time: string
          event_type?: string | null
          external_id?: string | null
          host_profile_id?: string | null
          id?: string
          is_featured?: boolean | null
          last_synced_at?: string | null
          scraped_at?: string | null
          source_name?: string | null
          source_url?: string | null
          start_time: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          age_range?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          capacity?: number | null
          city_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          end_time?: string
          event_type?: string | null
          external_id?: string | null
          host_profile_id?: string | null
          id?: string
          is_featured?: boolean | null
          last_synced_at?: string | null
          scraped_at?: string | null
          source_name?: string | null
          source_url?: string | null
          start_time?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_profile_id_fkey"
            columns: ["host_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      gonow_cache: {
        Row: {
          meter: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          meter: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          meter?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gonow_cache_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          description: string
          id: string
          incident_type: string
          profile_id: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          venue_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          description: string
          id?: string
          incident_type: string
          profile_id?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          venue_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          description?: string
          id?: string
          incident_type?: string
          profile_id?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          child_age_band: string | null
          city_id: string | null
          communication: string[] | null
          created_at: string | null
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          interests: string[] | null
          last_name: string | null
          privacy: Json | null
          profile_completed: boolean | null
          role: string | null
          sensory_flags: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          child_age_band?: string | null
          city_id?: string | null
          communication?: string[] | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          interests?: string[] | null
          last_name?: string | null
          privacy?: Json | null
          profile_completed?: boolean | null
          role?: string | null
          sensory_flags?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          child_age_band?: string | null
          city_id?: string | null
          communication?: string[] | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          interests?: string[] | null
          last_name?: string | null
          privacy?: Json | null
          profile_completed?: boolean | null
          role?: string | null
          sensory_flags?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          best_time: string | null
          content: string | null
          created_at: string | null
          id: string
          predictability: number | null
          profile_id: string | null
          sensory_level: number | null
          staff_knowledge: number | null
          status: string | null
          triggers: string[] | null
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          best_time?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          predictability?: number | null
          profile_id?: string | null
          sensory_level?: number | null
          staff_knowledge?: number | null
          status?: string | null
          triggers?: string[] | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          best_time?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          predictability?: number | null
          profile_id?: string | null
          sensory_level?: number | null
          staff_knowledge?: number | null
          status?: string | null
          triggers?: string[] | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          profile_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          profile_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          profile_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvps_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_favorites: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          venue_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_favorites_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_votes: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          updated_at: string | null
          venue_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          updated_at?: string | null
          venue_id: string
          vote_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          updated_at?: string | null
          venue_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_votes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_votes_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          amenities: Json | null
          average_rating: number | null
          city_id: string | null
          created_at: string | null
          data_source: string | null
          description: string | null
          downvotes: number | null
          favorite_count: number | null
          formatted_phone_number: string | null
          google_place_id: string | null
          google_rating: number | null
          google_review_count: number | null
          hours: Json | null
          id: string
          is_open_now: boolean | null
          last_synced_at: string | null
          last_verified: string | null
          lat: number | null
          lng: number | null
          meter: string | null
          name: string
          phone: string | null
          photo_keys: string[] | null
          price_level: number | null
          review_count: number | null
          sensory_hours: Json | null
          slug: string | null
          staff_contact: string | null
          status: string | null
          triggers: Json | null
          type: string | null
          updated_at: string | null
          upvotes: number | null
          verification_status: string | null
          verified_by: string | null
          vote_score: number | null
          website: string | null
          what_to_expect: string | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          average_rating?: number | null
          city_id?: string | null
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          downvotes?: number | null
          favorite_count?: number | null
          formatted_phone_number?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          hours?: Json | null
          id?: string
          is_open_now?: boolean | null
          last_synced_at?: string | null
          last_verified?: string | null
          lat?: number | null
          lng?: number | null
          meter?: string | null
          name: string
          phone?: string | null
          photo_keys?: string[] | null
          price_level?: number | null
          review_count?: number | null
          sensory_hours?: Json | null
          slug?: string | null
          staff_contact?: string | null
          status?: string | null
          triggers?: Json | null
          type?: string | null
          updated_at?: string | null
          upvotes?: number | null
          verification_status?: string | null
          verified_by?: string | null
          vote_score?: number | null
          website?: string | null
          what_to_expect?: string | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          average_rating?: number | null
          city_id?: string | null
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          downvotes?: number | null
          favorite_count?: number | null
          formatted_phone_number?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          hours?: Json | null
          id?: string
          is_open_now?: boolean | null
          last_synced_at?: string | null
          last_verified?: string | null
          lat?: number | null
          lng?: number | null
          meter?: string | null
          name?: string
          phone?: string | null
          photo_keys?: string[] | null
          price_level?: number | null
          review_count?: number | null
          sensory_hours?: Json | null
          slug?: string | null
          staff_contact?: string | null
          status?: string | null
          triggers?: Json | null
          type?: string | null
          updated_at?: string | null
          upvotes?: number | null
          verification_status?: string | null
          verified_by?: string | null
          vote_score?: number | null
          website?: string | null
          what_to_expect?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          status: string | null
          venue_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          venue_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verifications_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
