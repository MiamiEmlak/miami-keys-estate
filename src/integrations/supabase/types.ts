export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      lead_activity: {
        Row: {
          activity_type: string
          created_at: string
          id: string
          lead_id: string | null
          listing_key: string | null
          metadata: Json
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          id?: string
          lead_id?: string | null
          listing_key?: string | null
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          listing_key?: string | null
          metadata?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activity_listing_key_fkey"
            columns: ["listing_key"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["listing_key"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          lead_type: string | null
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          lead_type?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          lead_type?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          association_fee: number | null
          association_fee_frequency: string | null
          bathrooms_total: number | null
          bedrooms_total: number | null
          city: string | null
          close_date: string | null
          close_price: number | null
          created_at: string
          description: string | null
          latitude: number | null
          list_agent_id: string | null
          list_office_id: string | null
          list_price: number | null
          listing_contract_date: string | null
          listing_id: string | null
          listing_key: string
          living_area: number | null
          longitude: number | null
          lot_size: number | null
          modification_timestamp: string | null
          original_list_price: number | null
          postal_code: string | null
          previous_list_price: number | null
          property_sub_type: string | null
          property_type: string | null
          raw_mls: Json | null
          standard_status: string | null
          state: string | null
          street_address: string | null
          tax_annual_amount: number | null
          updated_at: string
          year_built: number | null
        }
        Insert: {
          association_fee?: number | null
          association_fee_frequency?: string | null
          bathrooms_total?: number | null
          bedrooms_total?: number | null
          city?: string | null
          close_date?: string | null
          close_price?: number | null
          created_at?: string
          description?: string | null
          latitude?: number | null
          list_agent_id?: string | null
          list_office_id?: string | null
          list_price?: number | null
          listing_contract_date?: string | null
          listing_id?: string | null
          listing_key: string
          living_area?: number | null
          longitude?: number | null
          lot_size?: number | null
          modification_timestamp?: string | null
          original_list_price?: number | null
          postal_code?: string | null
          previous_list_price?: number | null
          property_sub_type?: string | null
          property_type?: string | null
          raw_mls?: Json | null
          standard_status?: string | null
          state?: string | null
          street_address?: string | null
          tax_annual_amount?: number | null
          updated_at?: string
          year_built?: number | null
        }
        Update: {
          association_fee?: number | null
          association_fee_frequency?: string | null
          bathrooms_total?: number | null
          bedrooms_total?: number | null
          city?: string | null
          close_date?: string | null
          close_price?: number | null
          created_at?: string
          description?: string | null
          latitude?: number | null
          list_agent_id?: string | null
          list_office_id?: string | null
          list_price?: number | null
          listing_contract_date?: string | null
          listing_id?: string | null
          listing_key?: string
          living_area?: number | null
          longitude?: number | null
          lot_size?: number | null
          modification_timestamp?: string | null
          original_list_price?: number | null
          postal_code?: string | null
          previous_list_price?: number | null
          property_sub_type?: string | null
          property_type?: string | null
          raw_mls?: Json | null
          standard_status?: string | null
          state?: string | null
          street_address?: string | null
          tax_annual_amount?: number | null
          updated_at?: string
          year_built?: number | null
        }
        Relationships: []
      }
      property_media: {
        Row: {
          created_at: string
          listing_key: string
          media_category: string | null
          media_key: string
          media_type: string | null
          media_url: string
          modification_timestamp: string | null
          order_number: number | null
          short_description: string | null
        }
        Insert: {
          created_at?: string
          listing_key: string
          media_category?: string | null
          media_key: string
          media_type?: string | null
          media_url: string
          modification_timestamp?: string | null
          order_number?: number | null
          short_description?: string | null
        }
        Update: {
          created_at?: string
          listing_key?: string
          media_category?: string | null
          media_key?: string
          media_type?: string | null
          media_url?: string
          modification_timestamp?: string | null
          order_number?: number | null
          short_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_media_listing_key_fkey"
            columns: ["listing_key"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["listing_key"]
          },
        ]
      }
      property_watches: {
        Row: {
          active: boolean
          created_at: string
          id: string
          listing_key: string | null
          user_id: string
          watch_type: string
          watch_value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          listing_key?: string | null
          user_id: string
          watch_type: string
          watch_value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          listing_key?: string | null
          user_id?: string
          watch_type?: string
          watch_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_watches_listing_key_fkey"
            columns: ["listing_key"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["listing_key"]
          },
        ]
      }
      saved_properties: {
        Row: {
          created_at: string
          id: string
          listing_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_properties_listing_key_fkey"
            columns: ["listing_key"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["listing_key"]
          },
        ]
      }
      saved_searches: {
        Row: {
          active: boolean
          alert_frequency: string
          created_at: string
          criteria: Json
          id: string
          search_name: string
          user_id: string
        }
        Insert: {
          active?: boolean
          alert_frequency?: string
          created_at?: string
          criteria?: Json
          id?: string
          search_name: string
          user_id: string
        }
        Update: {
          active?: boolean
          alert_frequency?: string
          created_at?: string
          criteria?: Json
          id?: string
          search_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "agent" | "user"
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
    Enums: {
      app_role: ["admin", "agent", "user"],
    },
  },
} as const
