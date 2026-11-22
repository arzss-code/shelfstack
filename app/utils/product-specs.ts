import type { Product } from '~/types/product'
import {
  CATEGORY_ID_MAP,
  SPEC_CATEGORY_KEYWORDS,
  CATEGORY_VARIANTS_MAP,
  CATEGORY_SPECS_MAP,
  SPECIFIC_ITEM_VARIANTS,
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
  const searchText = `${product.slug || ''} ${product.name || ''}`.toLowerCase()
  if (searchText.includes('jam') || searchText.includes('watch') || searchText.includes('arloji')) {
    return SPECIFIC_ITEM_VARIANTS.watch as ProductVariants
  }
  if (
    searchText.includes('dompet') ||
    searchText.includes('wallet') ||
    searchText.includes('cardholder')
  ) {
    return SPECIFIC_ITEM_VARIANTS.wallet as ProductVariants
  }
  if (
    searchText.includes('kaus') ||
    searchText.includes('t-shirt') ||
    searchText.includes('baju')
  ) {
    return SPECIFIC_ITEM_VARIANTS.apparel as ProductVariants
  }
  if (searchText.includes('topi') || searchText.includes('cap')) {
    return SPECIFIC_ITEM_VARIANTS.cap as ProductVariants
  }
  if (searchText.includes('keyboard')) {
    return SPECIFIC_ITEM_VARIANTS.keyboard as ProductVariants
  }

  const cat = detectProductCategorySlug(product)
  return CATEGORY_VARIANTS_MAP[cat] || (CATEGORY_VARIANTS_MAP.stationery as ProductVariants)
}

/**
 * Menyediakan tabel spesifikasi teknis dinamis berdasarkan kategori produk
 */
export function getProductSpecs(product: Product): ProductSpecItem[] {
  const searchText = `${product.slug || ''} ${product.name || ''}`.toLowerCase()
  const isLifestyleNonBag =
    searchText.includes('jam') ||
    searchText.includes('watch') ||
    searchText.includes('arloji') ||
    searchText.includes('dompet') ||
    searchText.includes('wallet') ||
    searchText.includes('kaus') ||
    searchText.includes('t-shirt') ||
    searchText.includes('topi') ||
    searchText.includes('cap')

  // Jika produk non-tas lifestyle memiliki custom specs di database, tampilkan spesifikasi aslinya secara eksklusif
  if (isLifestyleNonBag && product.specs && typeof product.specs === 'object') {
    const list: ProductSpecItem[] = []
    const iconMap: Record<string, string> = {
      diameter: 'pi pi-compass',
      kaca: 'pi pi-shield',
      mesin: 'pi pi-cog',
      water_resistance: 'pi pi-tint',
      material: 'pi pi-box',
      kapasitas: 'pi pi-database',
      fitur: 'pi pi-check-circle',
      gramasi: 'pi pi-tag',
      sertifikasi: 'pi pi-verified',
      potongan: 'pi pi-user',
      penutup: 'pi pi-lock',
      lingkar: 'pi pi-circle',
    }
    const labelMap: Record<string, string> = {
      diameter: 'Diameter Case',
      kaca: 'Kaca Kristal',
      mesin: 'Mesin Jam',
      water_resistance: 'Ketahanan Air',
      material: 'Material Konstruksi',
      kapasitas: 'Kapasitas Ruang',
      fitur: 'Fitur Utama',
      gramasi: 'Gramasi Bahan',
      sertifikasi: 'Sertifikasi',
      potongan: 'Model Potongan',
      penutup: 'Sistem Pengencang',
      lingkar: 'Lingkar Kepala',
    }

    for (const [key, val] of Object.entries(product.specs)) {
      if (typeof val === 'string' || typeof val === 'number') {
        const cleanKey = key.toLowerCase()
        list.push({
          label: labelMap[cleanKey] || key,
          value: String(val),
          icon: iconMap[cleanKey] || 'pi pi-info-circle',
        })
      }
    }
    if (list.length > 0) return list
  }

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
