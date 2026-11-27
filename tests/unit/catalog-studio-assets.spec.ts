import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CANONICAL_CATEGORIES } from '~/composables/useCategories'

const ROOT = process.cwd()
const PRODUCTS_DIR = resolve(ROOT, 'public/images/products')

function readText(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf8')
}

function extractProductImagePaths(source: string): string[] {
  return [...source.matchAll(/\/images\/products\/([a-z0-9-]+\.jpg)/g)].map((m) => m[1]!)
}

describe('Catalog Studio Image URL Synchronization', () => {
  it('menyimpan tepat 50 file gambar studio di public/images/products tanpa duplikat lama', () => {
    const files = readdirSync(PRODUCTS_DIR).filter((name) => name.endsWith('.jpg'))
    expect(files).not.toContain('field-watch-black-angle.jpg')
    expect(files).toHaveLength(50)
  })

  it('tidak meninggalkan URL eksternal aida-public atau unsplash pada HomeHero & HomeFeaturedCategories', () => {
    const hero = readText('app/components/home/HomeHero.vue')
    const featured = readText('app/components/home/HomeFeaturedCategories.vue')

    expect(hero).not.toContain('aida-public')
    expect(hero).not.toContain('unsplash.com')
    expect(featured).not.toContain('aida-public')
    expect(featured).not.toContain('unsplash.com')

    for (const cat of CANONICAL_CATEGORIES) {
      expect(cat.image_url).toMatch(/^\/images\/products\/[a-z0-9-]+\.jpg$/)
    }
  })

  it('memastikan seluruh referensi gambar produk di kode, seed, dan migrasi ada di disk', () => {
    const sources = [
      'app/components/home/HomeHero.vue',
      'app/components/home/HomeFeaturedCategories.vue',
      'app/composables/useCategories.ts',
      'server/data/catalog-seed/products-tech-furniture.ts',
      'server/data/catalog-seed/products-home-lifestyle.ts',
      'server/data/catalog-seed/products-stationery.ts',
      'server/data/catalog-seed/variants-tech-furniture.ts',
      'server/data/catalog-seed/variants-home-lifestyle.ts',
      'server/data/catalog-seed/variants-stationery.ts',
      'supabase/seed.sql',
      'supabase/migrations/20261205000001_sync_curated_catalog_studio_images.sql',
    ]

    for (const rel of sources) {
      const refs = extractProductImagePaths(readText(rel))
      expect(refs.length, `${rel} harus memiliki referensi /images/products/`).toBeGreaterThan(0)
      for (const file of refs) {
        expect(existsSync(resolve(PRODUCTS_DIR, file)), `Hilang: ${file} (dari ${rel})`).toBe(true)
      }
    }
  })

  it('memastikan supabase/seed.sql menyinkronkan image_url dan gallery_urls produk aktif yang sudah ada', () => {
    const seedSql = readText('supabase/seed.sql')
    expect(seedSql).toContain('update public.products p')
    expect(seedSql).toContain(
      "('Ketel Leher Angsa Matte Black', '/images/products/kettle-gooseneck-black.jpg'",
    )
  })
})
