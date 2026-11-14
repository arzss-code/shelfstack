import type {
  InstantSearchProduct,
  InstantSearchCategory,
  InstantSearchResponse,
} from '~~/shared/types/search'

export function sanitizeInstantSearchKeyword(raw: string): string {
  if (!raw) return ''
  return raw.trim().slice(0, 60).replace(/[%_]/g, '\\$&')
}

export function isValidInstantSearchQuery(q: string | null | undefined): boolean {
  if (typeof q !== 'string') return false
  return q.trim().length >= 2
}

export function mapInstantSearchProducts(
  rawRows: Array<{
    id: number | string
    name: string
    slug?: string | null
    price?: number | string | null
    image_url?: string | null
    stock?: number | null
    categories?:
      | { id?: string | null; name?: string | null; slug?: string | null }
      | Array<{ id?: string | null; name?: string | null; slug?: string | null }>
      | null
  }>,
): InstantSearchProduct[] {
  return (rawRows || []).map((item) => {
    let categoryName = ''
    if (item.categories) {
      if (Array.isArray(item.categories)) {
        categoryName = item.categories[0]?.name || ''
      } else if (item.categories.name) {
        categoryName = item.categories.name
      }
    }

    return {
      id: item.id,
      name: String(item.name || ''),
      slug: item.slug ? String(item.slug) : null,
      price: Number(item.price) || 0,
      image_url: item.image_url ? String(item.image_url) : null,
      category: categoryName,
      stock: typeof item.stock === 'number' ? item.stock : 0,
    }
  })
}

export function mapInstantSearchCategories(
  rawRows: Array<{ id?: string; name?: string | null; slug?: string | null }>,
): InstantSearchCategory[] {
  return (rawRows || []).map((cat) => ({
    id: cat.id ? String(cat.id) : undefined,
    name: String(cat.name || ''),
    slug: String(cat.slug || ''),
  }))
}

export function buildInstantSearchPayload(
  query: string,
  rawProducts: Array<{
    id: number | string
    name: string
    slug?: string | null
    price?: number | string | null
    image_url?: string | null
    stock?: number | null
    categories?:
      | { id?: string | null; name?: string | null; slug?: string | null }
      | Array<{ id?: string | null; name?: string | null; slug?: string | null }>
      | null
  }>,
  rawCategories: Array<{ id?: string; name?: string | null; slug?: string | null }>,
): InstantSearchResponse {
  return {
    query: query.trim(),
    products: mapInstantSearchProducts(rawProducts),
    categories: mapInstantSearchCategories(rawCategories),
  }
}
