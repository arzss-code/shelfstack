import type { Product } from '~/types/product'

export interface WishlistItem {
  productId: number
  name: string
  slug?: string | null
  price: number
  priceCents: number
  originalPriceCents?: number | null
  imageUrl: string | null
  stock: number
  categoryId?: string | null
  categoryName?: string | null
  addedAt: string
}

export interface WishlistDbRow {
  product: {
    id: number
    name: string
    slug?: string | null
    price: number
    price_cents?: number | null
    image_url: string | null
    stock: number
    category_id?: string | null
  }
  created_at: string
}

export const WISHLIST_STORAGE_KEY = 'shelfstack-wishlist'
export const WISHLIST_GUEST_FLAG_KEY = 'shelfstack-wishlist-is-guest'

export const mapWishlistRow = (row: WishlistDbRow): WishlistItem => ({
  productId: row.product.id,
  name: row.product.name,
  slug: row.product.slug,
  price: row.product.price,
  priceCents: row.product.price_cents ?? row.product.price * 100,
  originalPriceCents: null,
  imageUrl: row.product.image_url,
  stock: row.product.stock,
  categoryId: row.product.category_id,
  categoryName: null,
  addedAt: row.created_at,
})

export const createWishlistItem = (
  product: Product,
  categoryName?: string | null,
): WishlistItem => ({
  productId: product.id,
  name: product.name,
  slug: product.slug,
  price: product.price,
  priceCents: product.price_cents ?? product.price * 100,
  originalPriceCents: null,
  imageUrl: product.image_url,
  stock: product.stock,
  categoryId: product.category_id,
  categoryName: categoryName || null,
  addedAt: new Date().toISOString(),
})

export const loadWishlistStorage = (): WishlistItem[] | null => {
  if (!import.meta.client) return null
  try {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // Storage error ignored
  }
  return null
}

export const saveWishlistStorage = (items: WishlistItem[]): void => {
  if (!import.meta.client) return
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Storage error ignored
  }
}

export const clearWishlistStorage = (): void => {
  if (!import.meta.client) return
  try {
    localStorage.removeItem(WISHLIST_STORAGE_KEY)
    localStorage.removeItem(WISHLIST_GUEST_FLAG_KEY)
  } catch {
    // Storage error ignored
  }
}
