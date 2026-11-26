export interface SeedProductItem {
  categorySlug: 'tech' | 'furniture' | 'home' | 'lifestyle' | 'stationery'
  name: string
  price: number
  stock: number
  description: string
  image_url: string
  gallery_urls?: string[]
  weight_grams: number
  specs: Record<string, unknown>
  rating: number
  review_count: number
  sold_count: number
  is_featured: boolean
}

export interface SeedVariantItem {
  productName: string
  sku: string
  name: string
  attributes: {
    color: string
    colorClass: string
    image_url: string
    material?: string
  }
  price_cents: number
  stock: number
}

export interface DemoReviewer {
  id: string
  email: string
  fullName: string
}

export interface SeedReviewItem {
  productName: string
  reviewerIndex: number // Index 0 to 4
  rating: number
  reviewText: string
}
