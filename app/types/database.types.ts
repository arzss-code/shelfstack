export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: Database['public']['Enums']['activity_action']
          browser: string | null
          created_at: string | null
          description: string
          entity_id: number
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          platform: string | null
        }
        Insert: {
          action: Database['public']['Enums']['activity_action']
          browser?: string | null
          created_at?: string | null
          description: string
          entity_id: number
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          platform?: string | null
        }
        Update: {
          action?: Database['public']['Enums']['activity_action']
          browser?: string | null
          created_at?: string | null
          description?: string
          entity_id?: number
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          platform?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          gallery_urls: string[]
          id: number
          image_url: string | null
          is_featured: boolean
          link: string | null
          name: string
          price: number
          price_cents: number | null
          rating: number
          review_count: number
          sku: string | null
          slug: string | null
          sold_count: number
          specs: Json
          stock: number
          weight_grams: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          gallery_urls?: string[]
          id?: number
          image_url?: string | null
          is_featured?: boolean
          link?: string | null
          name: string
          price: number
          price_cents?: number | null
          rating?: number
          review_count?: number
          sku?: string | null
          slug?: string | null
          sold_count?: number
          specs?: Json
          stock?: number
          weight_grams?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          gallery_urls?: string[]
          id?: number
          image_url?: string | null
          is_featured?: boolean
          link?: string | null
          name?: string
          price?: number
          price_cents?: number | null
          rating?: number
          review_count?: number
          sku?: string | null
          slug?: string | null
          sold_count?: number
          specs?: Json
          stock?: number
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          description: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_discount_cents: number | null
          min_purchase_cents: number
          name: string
          starts_at: string | null
          updated_at: string
          usage_count: number
          usage_limit: number | null
          user_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_cents?: number | null
          min_purchase_cents?: number
          name: string
          starts_at?: string | null
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          user_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_discount_cents?: number | null
          min_purchase_cents?: number
          name?: string
          starts_at?: string | null
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          user_limit?: number | null
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          coupon_id: string
          created_at: string
          discount_cents: number
          id: string
          order_id: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          discount_cents: number
          id?: string
          order_id: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          discount_cents?: number
          id?: string
          order_id?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: Json
          coupon_code: string | null
          coupon_id: string | null
          discount_cents: number
          subtotal_cents: number
          cancellation_reason: string | null
          cancelled_at: string | null
          courier_code: string | null
          courier_name: string | null
          created_at: string | null
          delivered_at: string | null
          id: string
          midtrans_id: string | null
          paid_at: string | null
          payment_type: string | null
          refunded_at: string | null
          shipped_at: string | null
          shipping_cost_cents: number
          shipping_service: string
          snap_token: string | null
          status: Database['public']['Enums']['order_status']
          total_cents: number
          tracking_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: Json
          coupon_code?: string | null
          coupon_id?: string | null
          discount_cents?: number
          subtotal_cents?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          courier_code?: string | null
          courier_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          midtrans_id?: string | null
          paid_at?: string | null
          payment_type?: string | null
          refunded_at?: string | null
          shipped_at?: string | null
          shipping_cost_cents?: number
          shipping_service?: string
          snap_token?: string | null
          status?: Database['public']['Enums']['order_status']
          total_cents?: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          address?: Json
          coupon_code?: string | null
          coupon_id?: string | null
          discount_cents?: number
          subtotal_cents?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          courier_code?: string | null
          courier_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          midtrans_id?: string | null
          paid_at?: string | null
          payment_type?: string | null
          refunded_at?: string | null
          shipped_at?: string | null
          shipping_cost_cents?: number
          shipping_service?: string
          snap_token?: string | null
          status?: Database['public']['Enums']['order_status']
          total_cents?: number
          tracking_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shipping_checkpoints: {
        Row: {
          created_at: string
          description: string
          id: string
          location: string
          order_id: string
          status:
            | 'manifested'
            | 'picked_up'
            | 'in_transit'
            | 'out_for_delivery'
            | 'delivered'
            | 'returned'
          title: string
          tracking_number: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          location: string
          order_id: string
          status:
            | 'manifested'
            | 'picked_up'
            | 'in_transit'
            | 'out_for_delivery'
            | 'delivered'
            | 'returned'
          title: string
          tracking_number: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          location?: string
          order_id?: string
          status?:
            | 'manifested'
            | 'picked_up'
            | 'in_transit'
            | 'out_for_delivery'
            | 'delivered'
            | 'returned'
          title?: string
          tracking_number?: string
        }
        Relationships: [
          {
            foreignKeyName: 'shipping_checkpoints_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          price_cents: number
          product_id: number
          qty: number
        }
        Insert: {
          id?: string
          order_id: string
          price_cents: number
          product_id: number
          qty: number
        }
        Update: {
          id?: string
          order_id?: string
          price_cents?: number
          product_id?: number
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      stock_movements: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          id: string
          notes: string | null
          order_id: string | null
          product_id: number
          reason: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          notes?: string | null
          order_id?: string | null
          product_id: number
          reason: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          notes?: string | null
          order_id?: string | null
          product_id?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: 'stock_movements_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_movements_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      refunds: {
        Row: {
          amount_cents: number
          bank_confirmed_at: string | null
          created_at: string
          currency: string
          failure_reason: string | null
          gateway: string
          gateway_refund_id: string | null
          gateway_transaction_id: string | null
          id: string
          idempotency_key: string
          order_id: string
          processed_at: string | null
          reason: string
          status: 'pending' | 'succeeded' | 'failed'
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          bank_confirmed_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          gateway?: string
          gateway_refund_id?: string | null
          gateway_transaction_id?: string | null
          id?: string
          idempotency_key: string
          order_id: string
          processed_at?: string | null
          reason: string
          status?: 'pending' | 'succeeded' | 'failed'
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          bank_confirmed_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          gateway?: string
          gateway_refund_id?: string | null
          gateway_transaction_id?: string | null
          id?: string
          idempotency_key?: string
          order_id?: string
          processed_at?: string | null
          reason?: string
          status?: 'pending' | 'succeeded' | 'failed'
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          created_at: string
          event_key: string
          event_type: 'payment' | 'refund'
          gateway: string
          id: string
          order_id: string | null
          payload_summary: Json
          processed_at: string
          status: 'processed' | 'ignored' | 'failed'
        }
        Insert: {
          created_at?: string
          event_key: string
          event_type: 'payment' | 'refund'
          gateway?: string
          id?: string
          order_id?: string | null
          payload_summary?: Json
          processed_at?: string
          status: 'processed' | 'ignored' | 'failed'
        }
        Update: {
          created_at?: string
          event_key?: string
          event_type?: 'payment' | 'refund'
          gateway?: string
          id?: string
          order_id?: string | null
          payload_summary?: Json
          processed_at?: string
          status: 'processed' | 'ignored' | 'failed'
        }
        Relationships: []
      }
      order_idempotency_keys: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string
          order_id: string
          request_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key: string
          order_id: string
          request_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string
          order_id?: string
          request_hash?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_idempotency_keys_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
      user_addresses: {
        Row: {
          city: string
          created_at: string | null
          deleted_at: string | null
          id: string
          is_default: boolean | null
          name: string
          note: string | null
          phone: string
          postal: string
          street: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          note?: string | null
          phone: string
          postal: string
          street: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          note?: string | null
          phone?: string
          postal?: string
          street?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_coupons: {
        Row: {
          claimed_at: string
          coupon_id: string
          created_at: string
          id: string
          order_id: string | null
          status: 'claimed' | 'used' | 'expired'
          updated_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string
          coupon_id: string
          created_at?: string
          id?: string
          order_id?: string | null
          status?: 'claimed' | 'used' | 'expired'
          updated_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string
          coupon_id?: string
          created_at?: string
          id?: string
          order_id?: string | null
          status?: 'claimed' | 'used' | 'expired'
          updated_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_coupons_coupon_id_fkey'
            columns: ['coupon_id']
            isOneToOne: false
            referencedRelation: 'coupons'
            referencedColumns: ['id']
          },
        ]
      }
      user_coins: {
        Row: {
          balance_coins: number
          created_at: string
          has_claimed_welcome: boolean
          lifetime_earned_coins: number
          lifetime_spent_coins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_coins?: number
          created_at?: string
          has_claimed_welcome?: boolean
          lifetime_earned_coins?: number
          lifetime_spent_coins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_coins?: number
          created_at?: string
          has_claimed_welcome?: boolean
          lifetime_earned_coins?: number
          lifetime_spent_coins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coin_transactions: {
        Row: {
          amount_coins: number
          balance_after: number
          coupon_id: string | null
          created_at: string
          description: string
          id: string
          order_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount_coins: number
          balance_after: number
          coupon_id?: string | null
          created_at?: string
          description: string
          id?: string
          order_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount_coins?: number
          balance_after?: number
          coupon_id?: string | null
          created_at?: string
          description?: string
          id?: string
          order_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string | null
          id: string
          product_id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'wishlists_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          reference_id: string | null
          reference_url: string | null
          title: string
          type:
            | 'order_created'
            | 'payment_success'
            | 'order_shipped'
            | 'order_cancelled'
            | 'order_completed'
            | 'system'
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          reference_id?: string | null
          reference_url?: string | null
          title: string
          type:
            | 'order_created'
            | 'payment_success'
            | 'order_shipped'
            | 'order_cancelled'
            | 'order_completed'
            | 'system'
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          reference_id?: string | null
          reference_url?: string | null
          title?: string
          type?:
            | 'order_created'
            | 'payment_success'
            | 'order_shipped'
            | 'order_cancelled'
            | 'order_completed'
            | 'system'
          user_id?: string
        }
        Relationships: []
      }
      product_reviews: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          order_id: string
          order_item_id: string | null
          product_id: number
          rating: number
          review_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          order_id: string
          order_item_id?: string | null
          product_id: number
          rating: number
          review_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          order_id?: string
          order_item_id?: string | null
          product_id?: number
          rating?: number
          review_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_reviews_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_reviews_order_item_id_fkey'
            columns: ['order_item_id']
            isOneToOne: false
            referencedRelation: 'order_items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_reviews_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_welcome_coins: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      exchange_coins_for_voucher: {
        Args: {
          p_coupon_id: string
        }
        Returns: Json
      }
      claim_coupon_to_wallet: {
        Args: {
          p_coupon_id?: string | null
          p_code?: string | null
        }
        Returns: Json
      }
      handle_payment_webhook: {
        Args: {
          p_order_id: string
          p_target_status: string
          p_payment_type?: string | null
          p_midtrans_id?: string | null
        }
        Returns: string
      }
      handle_refund_webhook: {
        Args: {
          p_order_id: string
          p_refund_key?: string | null
          p_gateway_refund_id?: string | null
          p_is_success?: boolean
          p_failure_reason?: string | null
          p_event_key?: string | null
          p_payload_summary?: Json
          p_stage?: string
          p_bank_confirmed_at?: string | null
          p_refund_amount_cents?: number | null
        }
        Returns: Json
      }
      cancel_order: {
        Args: {
          p_order_id: string
          p_reason?: string
        }
        Returns: boolean
      }
      create_order: {
        Args: {
          p_items: Json
          p_address: Json
          p_idempotency_key?: string | null
          p_request_hash?: string | null
          p_coupon_code?: string | null
          p_shipping_service?: string | null
          p_courier_code?: string | null
        }
        Returns: string
      }
      transition_order_status: {
        Args: {
          p_order_id: string
          p_target_status: string
          p_reason?: string
        }
        Returns: Json
      }
      create_refund_attempt: {
        Args: {
          p_order_id: string
          p_idempotency_key: string
          p_reason?: string
        }
        Returns: Json
      }
      finalize_refund: {
        Args: {
          p_refund_id: string
          p_success: boolean
          p_gateway_refund_id?: string | null
          p_failure_reason?: string | null
          p_bank_confirmed_at?: string | null
        }
        Returns: Json
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      activity_action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'
      order_status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_action: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE'],
      order_status: ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded'],
    },
  },
} as const
