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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          category_id: string | null
          event_type: string
          id: string
          kiosk_id: string | null
          metadata: Json
          occurred_at: string
          session_id: string | null
          store_id: string | null
        }
        Insert: {
          category_id?: string | null
          event_type: string
          id?: string
          kiosk_id?: string | null
          metadata?: Json
          occurred_at?: string
          session_id?: string | null
          store_id?: string | null
        }
        Update: {
          category_id?: string | null
          event_type?: string
          id?: string
          kiosk_id?: string | null
          metadata?: Json
          occurred_at?: string
          session_id?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_kiosk_id_fkey"
            columns: ["kiosk_id"]
            isOneToOne: false
            referencedRelation: "kiosks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "navigation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          name_cn: string
          name_en: string
          name_th: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          is_active?: boolean
          name_cn: string
          name_en: string
          name_th: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name_cn?: string
          name_en?: string
          name_th?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      floors: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          level: number
          map_height: number
          map_image_url: string | null
          map_width: number
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          level: number
          map_height?: number
          map_image_url?: string | null
          map_width?: number
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          map_height?: number
          map_image_url?: string | null
          map_width?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      kiosks: {
        Row: {
          code: string
          created_at: string
          floor_id: string
          id: string
          last_seen_at: string | null
          name: string
          node_id: string
          status: Database["public"]["Enums"]["kiosk_status"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          floor_id: string
          id?: string
          last_seen_at?: string | null
          name: string
          node_id: string
          status?: Database["public"]["Enums"]["kiosk_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          floor_id?: string
          id?: string
          last_seen_at?: string | null
          name?: string
          node_id?: string
          status?: Database["public"]["Enums"]["kiosk_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kiosks_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kiosks_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "navigation_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_edges: {
        Row: {
          created_at: string
          distance: number
          from_node_id: string
          id: string
          is_accessible: boolean
          is_bidirectional: boolean
          kind: Database["public"]["Enums"]["edge_kind"]
          to_node_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          distance: number
          from_node_id: string
          id?: string
          is_accessible?: boolean
          is_bidirectional?: boolean
          kind?: Database["public"]["Enums"]["edge_kind"]
          to_node_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          distance?: number
          from_node_id?: string
          id?: string
          is_accessible?: boolean
          is_bidirectional?: boolean
          kind?: Database["public"]["Enums"]["edge_kind"]
          to_node_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "navigation_edges_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "navigation_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_edges_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "navigation_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_nodes: {
        Row: {
          connector_group: string | null
          created_at: string
          floor_id: string
          id: string
          is_accessible: boolean
          kind: Database["public"]["Enums"]["node_kind"]
          label: string
          updated_at: string
          x: number
          y: number
        }
        Insert: {
          connector_group?: string | null
          created_at?: string
          floor_id: string
          id?: string
          is_accessible?: boolean
          kind?: Database["public"]["Enums"]["node_kind"]
          label?: string
          updated_at?: string
          x: number
          y: number
        }
        Update: {
          connector_group?: string | null
          created_at?: string
          floor_id?: string
          id?: string
          is_accessible?: boolean
          kind?: Database["public"]["Enums"]["node_kind"]
          label?: string
          updated_at?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "navigation_nodes_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
      navigation_sessions: {
        Row: {
          accessible: boolean
          created_at: string
          destination_store_id: string
          expires_at: string
          id: string
          instructions: Json
          kiosk_id: string | null
          public_token: string
          route_node_ids: string[]
          total_distance: number
        }
        Insert: {
          accessible?: boolean
          created_at?: string
          destination_store_id: string
          expires_at: string
          id?: string
          instructions?: Json
          kiosk_id?: string | null
          public_token: string
          route_node_ids: string[]
          total_distance: number
        }
        Update: {
          accessible?: boolean
          created_at?: string
          destination_store_id?: string
          expires_at?: string
          id?: string
          instructions?: Json
          kiosk_id?: string | null
          public_token?: string
          route_node_ids?: string[]
          total_distance?: number
        }
        Relationships: [
          {
            foreignKeyName: "navigation_sessions_destination_store_id_fkey"
            columns: ["destination_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "navigation_sessions_kiosk_id_fkey"
            columns: ["kiosk_id"]
            isOneToOne: false
            referencedRelation: "kiosks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          locale?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string
          description: string
          ends_at: string
          id: string
          image_url: string | null
          is_active: boolean
          starts_at: string
          store_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          ends_at: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          starts_at: string
          store_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          starts_at?: string
          store_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          category_id: string
          contact: Json
          created_at: string
          description: string
          destination_node_id: string | null
          floor_id: string
          id: string
          image_urls: string[]
          is_active: boolean
          logo_url: string | null
          name: string
          opening_hours: Json
          slug: string
          updated_at: string
          x: number
          y: number
        }
        Insert: {
          category_id: string
          contact?: Json
          created_at?: string
          description?: string
          destination_node_id?: string | null
          floor_id: string
          id?: string
          image_urls?: string[]
          is_active?: boolean
          logo_url?: string | null
          name: string
          opening_hours?: Json
          slug: string
          updated_at?: string
          x: number
          y: number
        }
        Update: {
          category_id?: string
          contact?: Json
          created_at?: string
          description?: string
          destination_node_id?: string | null
          floor_id?: string
          id?: string
          image_urls?: string[]
          is_active?: boolean
          logo_url?: string | null
          name?: string
          opening_hours?: Json
          slug?: string
          updated_at?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "stores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_destination_node_fk"
            columns: ["destination_node_id"]
            isOneToOne: false
            referencedRelation: "navigation_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_editor: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "content_manager"
      edge_kind: "walkway" | "elevator" | "escalator" | "stairs"
      kiosk_status: "active" | "maintenance" | "offline"
      node_kind:
        | "walkway"
        | "store"
        | "kiosk"
        | "elevator"
        | "escalator"
        | "stairs"
        | "entrance"
        | "facility"
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
      app_role: ["super_admin", "admin", "content_manager"],
      edge_kind: ["walkway", "elevator", "escalator", "stairs"],
      kiosk_status: ["active", "maintenance", "offline"],
      node_kind: [
        "walkway",
        "store",
        "kiosk",
        "elevator",
        "escalator",
        "stairs",
        "entrance",
        "facility",
      ],
    },
  },
} as const
