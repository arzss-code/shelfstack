export interface Product {
  id: number
  name: string
  price: number
  price_cents?: number | null
  stock: number
  description?: string | null
  link?: string | null
  image_url: string | null
  category_id?: string | null
  deleted_at?: string | null
  created_at?: string | null
  slug?: string | null
  sku?: string | null
  weight_grams?: number
  specs?: Record<string, unknown>
  gallery_urls?: string[]
  rating?: number
  review_count?: number
  sold_count?: number
  is_featured?: boolean
}
