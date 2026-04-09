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
      canned_replies: {
        Row: {
          body: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          order_id: string
          read_at: string | null
          sender_profile_id: string | null
          sender_type: Database["public"]["Enums"]["chat_sender_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          order_id: string
          read_at?: string | null
          sender_profile_id?: string | null
          sender_type?: Database["public"]["Enums"]["chat_sender_type"]
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          order_id?: string
          read_at?: string | null
          sender_profile_id?: string | null
          sender_type?: Database["public"]["Enums"]["chat_sender_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_settings: {
        Row: {
          address_mode: string
          created_at: string
          currency_code: string
          display_name: string
          enabled: boolean
          icon_url: string | null
          id: string
          network_label: string | null
          required_confirmations: number
          static_address: string | null
        }
        Insert: {
          address_mode?: string
          created_at?: string
          currency_code: string
          display_name: string
          enabled?: boolean
          icon_url?: string | null
          id?: string
          network_label?: string | null
          required_confirmations?: number
          static_address?: string | null
        }
        Update: {
          address_mode?: string
          created_at?: string
          currency_code?: string
          display_name?: string
          enabled?: boolean
          icon_url?: string | null
          id?: string
          network_label?: string | null
          required_confirmations?: number
          static_address?: string | null
        }
        Relationships: []
      }
      order_events: {
        Row: {
          created_at: string
          event_message: string
          event_type: string
          id: string
          metadata: Json | null
          order_id: string
        }
        Insert: {
          created_at?: string
          event_message: string
          event_type: string
          id?: string
          metadata?: Json | null
          order_id: string
        }
        Update: {
          created_at?: string
          event_message?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name_snapshot: string
          quantity: number
          total_price_usd: number
          unit_price_usd: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name_snapshot: string
          quantity?: number
          total_price_usd: number
          unit_price_usd: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name_snapshot?: string
          quantity?: number
          total_price_usd?: number
          unit_price_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_code: string
          admin_notes: string | null
          buyer_discord_username: string | null
          buyer_email: string | null
          buyer_roblox_username: string
          created_at: string
          estimated_wait_minutes: number | null
          expected_crypto_amount: string | null
          id: string
          payment_address: string | null
          payment_expires_at: string | null
          public_order_id: string
          queue_position: number | null
          selected_crypto: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_usd: number
          total_usd: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_code?: string
          admin_notes?: string | null
          buyer_discord_username?: string | null
          buyer_email?: string | null
          buyer_roblox_username: string
          created_at?: string
          estimated_wait_minutes?: number | null
          expected_crypto_amount?: string | null
          id?: string
          payment_address?: string | null
          payment_expires_at?: string | null
          public_order_id?: string
          queue_position?: number | null
          selected_crypto?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_usd?: number
          total_usd?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_code?: string
          admin_notes?: string | null
          buyer_discord_username?: string | null
          buyer_email?: string | null
          buyer_roblox_username?: string
          created_at?: string
          estimated_wait_minutes?: number | null
          expected_crypto_amount?: string | null
          id?: string
          payment_address?: string | null
          payment_expires_at?: string | null
          public_order_id?: string
          queue_position?: number | null
          selected_crypto?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_usd?: number
          total_usd?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          confirmations: number
          confirmed_at: string | null
          created_at: string
          currency: string
          detected_at: string | null
          expected_amount: string
          expires_at: string | null
          id: string
          network: string | null
          order_id: string
          raw_payload: Json | null
          received_amount: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tx_hash: string | null
          wallet_address: string
        }
        Insert: {
          confirmations?: number
          confirmed_at?: string | null
          created_at?: string
          currency: string
          detected_at?: string | null
          expected_amount: string
          expires_at?: string | null
          id?: string
          network?: string | null
          order_id: string
          raw_payload?: Json | null
          received_amount?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tx_hash?: string | null
          wallet_address: string
        }
        Update: {
          confirmations?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          detected_at?: string | null
          expected_amount?: string
          expires_at?: string | null
          id?: string
          network?: string | null
          order_id?: string
          raw_payload?: Json | null
          received_amount?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tx_hash?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          badge: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          estimated_delivery_minutes: number | null
          featured: boolean
          id: string
          image_url: string | null
          name: string
          price_usd: number
          reserved_quantity: number
          slug: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          estimated_delivery_minutes?: number | null
          featured?: boolean
          id?: string
          image_url?: string | null
          name: string
          price_usd: number
          reserved_quantity?: number
          slug: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          estimated_delivery_minutes?: number | null
          featured?: boolean
          id?: string
          image_url?: string | null
          name?: string
          price_usd?: number
          reserved_quantity?: number
          slug?: string
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      generate_access_code: { Args: never; Returns: string }
      generate_order_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_order: {
        Args: { p_access_code: string; p_order_id: string }
        Returns: {
          access_code: string
          admin_notes: string | null
          buyer_discord_username: string | null
          buyer_email: string | null
          buyer_roblox_username: string
          created_at: string
          estimated_wait_minutes: number | null
          expected_crypto_amount: string | null
          id: string
          payment_address: string | null
          payment_expires_at: string | null
          public_order_id: string
          queue_position: number | null
          selected_crypto: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_usd: number
          total_usd: number
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      app_role: "admin" | "buyer"
      chat_sender_type: "buyer" | "admin" | "system"
      order_status:
        | "awaiting_payment"
        | "payment_detected"
        | "confirming"
        | "paid"
        | "queued_for_delivery"
        | "in_delivery"
        | "completed"
        | "disputed"
        | "expired"
        | "cancelled"
        | "refunded"
      payment_status:
        | "pending"
        | "detected"
        | "confirming"
        | "confirmed"
        | "underpaid"
        | "overpaid"
        | "expired"
        | "failed"
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
      app_role: ["admin", "buyer"],
      chat_sender_type: ["buyer", "admin", "system"],
      order_status: [
        "awaiting_payment",
        "payment_detected",
        "confirming",
        "paid",
        "queued_for_delivery",
        "in_delivery",
        "completed",
        "disputed",
        "expired",
        "cancelled",
        "refunded",
      ],
      payment_status: [
        "pending",
        "detected",
        "confirming",
        "confirmed",
        "underpaid",
        "overpaid",
        "expired",
        "failed",
      ],
    },
  },
} as const
