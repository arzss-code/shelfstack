import type { Product } from '~/types/product'
import {
  CATEGORY_ID_MAP,
  SPEC_CATEGORY_KEYWORDS,
  CATEGORY_VARIANTS_MAP,
  CATEGORY_SPECS_MAP,
} from './product-spec-templates'

export interface ProductSpecItem {
  label: string
  value: string
  icon?: string
}

export interface ProductVariantColor {
  name: string
  class: string
}

export interface ProductVariantOption {
  name: string
  note?: string
}

export interface ProductVariants {
  colorTitle: string
  colors: ProductVariantColor[]
  optionTitle: string
  options: ProductVariantOption[]
}

/**
 * Mendeteksi kategori slug produk berdasarkan category_id atau nama/slug produk
 */
export function detectProductCategorySlug(product: Product): string {
  if (product.category_id && CATEGORY_ID_MAP[product.category_id]) {
    return CATEGORY_ID_MAP[product.category_id] as string
  }

  const searchText = `${product.slug || ''} ${product.name || ''}`.toLowerCase()
  for (const [slug, keywords] of Object.entries(SPEC_CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => searchText.includes(kw))) {
      return slug
    }
  }

  return 'tech' // Default fallback
}

/**
 * Menyediakan opsi varian warna dan material/opsi kedua yang relevan dengan jenis produk
 */
export function getProductVariants(product: Product): ProductVariants {
  const cat = detectProductCategorySlug(product)
  return CATEGORY_VARIANTS_MAP[cat] || (CATEGORY_VARIANTS_MAP.stationery as ProductVariants)
}

/**
 * Menyediakan tabel spesifikasi teknis dinamis berdasarkan kategori produk
 */
export function getProductSpecs(product: Product): ProductSpecItem[] {
  const cat = detectProductCategorySlug(product)
  const templateSpecs =
    CATEGORY_SPECS_MAP[cat] || (CATEGORY_SPECS_MAP.stationery as ProductSpecItem[])
  const defaultSpecs: ProductSpecItem[] = templateSpecs.map((s) => ({ ...s }))

  // Jika ada custom specs di database, tambahkan/override
  if (product.specs && typeof product.specs === 'object') {
    for (const [key, val] of Object.entries(product.specs)) {
      if (typeof val === 'string' || typeof val === 'number') {
        const existingIdx = defaultSpecs.findIndex(
          (s) => s.label.toLowerCase() === key.toLowerCase(),
        )
        const existingItem = defaultSpecs[existingIdx]
        if (existingIdx >= 0 && existingItem) {
          defaultSpecs[existingIdx] = { ...existingItem, value: String(val) }
        } else {
          defaultSpecs.push({ label: key, value: String(val), icon: 'pi pi-info-circle' })
        }
      }
    }
  }

  return defaultSpecs
}
