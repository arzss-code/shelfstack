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
  rating?: number | null
  reviewCount?: number | null
  soldCount?: number | null
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
    rating?: number | null
    review_count?: number | null
    sold_count?: number | null
    categories?: { name?: string | null } | Array<{ name?: string | null }> | null
  }
  created_at: string
}

export const WISHLIST_STORAGE_KEY = 'shelfstack-wishlist'
export const WISHLIST_GUEST_FLAG_KEY = 'shelfstack-wishlist-is-guest'

const extractCategoryName = (
  categories?: { name?: string | null } | Array<{ name?: string | null }> | null,
): string | null => {
  if (!categories) return null
  if (Array.isArray(categories)) return categories[0]?.name ?? null
  return categories.name ?? null
}

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
  categoryName: extractCategoryName(row.product.categories),
  rating: row.product.rating ?? null,
  reviewCount: row.product.review_count ?? null,
  soldCount: row.product.sold_count ?? null,
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
  rating: product.rating ?? null,
  reviewCount: product.review_count ?? null,
  soldCount: product.sold_count ?? null,
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

export type WishlistStockFilter = 'all' | 'available' | 'out_of_stock'
export type WishlistSortOption = 'newest' | 'price_asc' | 'price_desc'

export const parseWishlistStockQuery = (value: unknown): WishlistStockFilter =>
  value === 'available' || value === 'out_of_stock' ? value : 'all'

export const parseWishlistSortQuery = (value: unknown): WishlistSortOption =>
  value === 'price_asc' || value === 'price_desc' ? value : 'newest'

export const filterAndSortWishlist = (
  items: WishlistItem[],
  keyword: string,
  stock: WishlistStockFilter,
  sort: WishlistSortOption,
): WishlistItem[] => {
  const q = keyword.trim().toLowerCase()
  const filtered = items.filter((item) => {
    if (stock === 'available' && item.stock <= 0) return false
    if (stock === 'out_of_stock' && item.stock > 0) return false
    if (q && !item.name.toLowerCase().includes(q)) return false
    return true
  })

  if (sort === 'price_asc') return [...filtered].sort((a, b) => a.price - b.price)
  if (sort === 'price_desc') return [...filtered].sort((a, b) => b.price - a.price)
  return [...filtered].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
}
