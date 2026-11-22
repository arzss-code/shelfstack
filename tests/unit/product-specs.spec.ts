import { describe, it, expect } from 'vitest'
import {
  getProductSpecs,
  getProductVariants,
  detectProductCategorySlug,
} from '../../app/utils/product-specs'
import type { Product } from '../../app/types/product'

describe('Product Specs & Variant Resolver', () => {
  const techProduct: Product = {
    id: 1,
    name: 'Headphone Studio ANC',
    slug: 'headphone-studio-anc',
    price: 2680000,
    stock: 25,
    image_url: 'https://example.com/headphone.jpg',
    category_id: '28082f15-1fd6-425e-9f6e-ed197c591c39', // tech
    rating: 4.95,
    review_count: 512,
  }

  const lifestyleProduct: Product = {
    id: 3,
    name: 'Tas Komuter EDC Ballistic',
    slug: 'tas-komuter-edc-ballistic',
    price: 1120000,
    stock: 12,
    image_url: 'https://example.com/tas.jpg',
    category_id: 'f11887b3-ff92-4d6f-a119-a972efd79144', // lifestyle
  }

  const homeProduct: Product = {
    id: 4,
    name: 'Ketel Leher Angsa Matte Black',
    slug: 'ketel-leher-angsa-matte-black',
    price: 780000,
    stock: 15,
    image_url: 'https://example.com/ketel.jpg',
    category_id: '4ca7076f-667c-45f4-aea6-cd76356a5ef2', // home
  }

  describe('detectProductCategorySlug', () => {
    it('detects category slug by category_id UUID', () => {
      expect(detectProductCategorySlug(techProduct)).toBe('tech')
      expect(detectProductCategorySlug(lifestyleProduct)).toBe('lifestyle')
      expect(detectProductCategorySlug(homeProduct)).toBe('home')
    })

    it('falls back to slug keywords if category_id is missing or unknown', () => {
      const fallbackProduct = {
        id: 99,
        name: 'Meja Modular Kayu Jati',
        slug: 'meja-modular-kayu-jati',
        price: 1500000,
        stock: 5,
        image_url: null,
      } as Product
      expect(detectProductCategorySlug(fallbackProduct)).toBe('furniture')
    })
  })

  describe('getProductVariants', () => {
    it('returns tech-specific colors and audio modes for tech product', () => {
      const variants = getProductVariants(techProduct)
      expect(variants.colorTitle).toBe('Pilihan Warna')
      expect(variants.colors.some((c) => c.name.includes('Obsidian'))).toBe(true)
      expect(variants.optionTitle).toBe('Mode Konektivitas')
      expect(variants.options.some((o) => o.name.includes('Wireless'))).toBe(true)
    })

    it('returns lifestyle-specific colors and capacity options for lifestyle product', () => {
      const variants = getProductVariants(lifestyleProduct)
      expect(variants.optionTitle).toBe('Ukuran & Kapasitas')
      expect(variants.options.some((o) => o.name.includes('20L'))).toBe(true)
    })

    it('returns home-specific material options for home/kitchen product', () => {
      const variants = getProductVariants(homeProduct)
      expect(variants.optionTitle).toBe('Material Utama')
      expect(variants.options.some((o) => o.name.includes('Stainless'))).toBe(true)
    })

    it('returns watch-specific variants for watch product', () => {
      const watchProduct = {
        id: 14,
        name: 'Jam Tangan Lapangan Otomatis Field Watch',
        slug: 'jam-tangan-lapangan-otomatis-field-watch',
        category_id: 'f11887b3-ff92-4d6f-a119-a972efd79144',
      } as Product
      const variants = getProductVariants(watchProduct)
      expect(variants.optionTitle).toBe('Diameter Case & Dial')
      expect(variants.options.some((o) => o.name.includes('38mm'))).toBe(true)
      expect(variants.options.some((o) => o.name.includes('40mm'))).toBe(true)
    })

    it('returns wallet-specific variants for wallet product', () => {
      const walletProduct = {
        id: 13,
        name: 'Dompet Kartu Kulit Nabati Slim',
        slug: 'dompet-kartu-kulit-nabati-slim',
        category_id: 'f11887b3-ff92-4d6f-a119-a972efd79144',
      } as Product
      const variants = getProductVariants(walletProduct)
      expect(variants.optionTitle).toBe('Kapasitas Kompartemen')
      expect(variants.options.some((o) => o.name.includes('6 Slot'))).toBe(true)
    })
  })

  describe('getProductSpecs', () => {
    it('returns technical specifications table items for tech product', () => {
      const specs = getProductSpecs(techProduct)
      expect(specs.length).toBeGreaterThanOrEqual(4)
      const labels = specs.map((s) => s.label)
      expect(labels).toContain('Driver Audio')
      expect(labels).toContain('Daya Tahan Baterai')
    })

    it('returns volume and laptop slot specifications for lifestyle bag product', () => {
      const specs = getProductSpecs(lifestyleProduct)
      const labels = specs.map((s) => s.label)
      expect(labels).toContain('Kapasitas Volume')
      expect(labels).toContain('Kompartemen Laptop')
    })

    it('returns exclusive watch specs for watch and omits bag specs', () => {
      const watchProduct = {
        id: 14,
        name: 'Jam Tangan Lapangan Otomatis Field Watch',
        slug: 'jam-tangan-lapangan-otomatis-field-watch',
        category_id: 'f11887b3-ff92-4d6f-a119-a972efd79144',
        specs: {
          diameter: '38 mm',
          kaca: 'Sapphire Crystal dengan AR Coating',
          mesin: 'Automatic Movement NH35 24-Jewels',
          water_resistance: '100 Meter / 10 ATM',
        },
      } as Product
      const specs = getProductSpecs(watchProduct)
      const labels = specs.map((s) => s.label)
      expect(labels).toContain('Diameter Case')
      expect(labels).toContain('Kaca Kristal')
      expect(labels).not.toContain('Kapasitas Volume')
      expect(labels).not.toContain('Kompartemen Laptop')
    })

    it('merges custom product.specs from database if available', () => {
      const customProduct: Product = {
        ...techProduct,
        specs: {
          'Versi Firmware': 'v2.4.1',
          'Bobot Bersih': '245 gram',
        },
      }
      const specs = getProductSpecs(customProduct)
      const labels = specs.map((s) => s.label)
      expect(labels).toContain('Versi Firmware')
      expect(labels).toContain('Bobot Bersih')
    })
  })
})
