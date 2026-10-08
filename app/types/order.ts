import type { Database } from './database.types'

export type OrderStatus = Database['public']['Enums']['order_status']

export interface OrderAddress {
  name: string
  phone: string
  street: string
  city: string
  postal: string
  note?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: number
  qty: number
  price_cents: number
  product?: {
    id: number
    name: string
    image_url: string | null
  } | null
}

export interface Order {
  id: string
  user_id: string
  total_cents: number
  status: OrderStatus
  address: OrderAddress
  snap_token?: string | null
  payment_type?: string | null
  midtrans_id?: string | null
  paid_at?: string | null
  created_at: string
  updated_at?: string | null
  items?: OrderItem[]
}
