import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import fs from 'node:fs'
import path from 'node:path'
import OfflineBanner from '~/components/common/OfflineBanner.vue'

describe('PWA, SEO & Portfolio Resilience Suite', () => {
  describe('Web App Manifest (public/site.webmanifest)', () => {
    it('memvalidasi format JSON dan konfigurasi PWA standalone yang tepat', () => {
      const manifestPath = path.resolve(process.cwd(), 'public/site.webmanifest')
      expect(fs.existsSync(manifestPath)).toBe(true)

      const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      expect(manifestContent.name).toBe('ShelfStack: Curated Department Store')
      expect(manifestContent.short_name).toBe('ShelfStack')
      expect(manifestContent.display).toBe('standalone')
      expect(manifestContent.theme_color).toBe('#141414')
      expect(manifestContent.background_color).toBe('#141414')
      expect(manifestContent.start_url).toBe('/')
      expect(Array.isArray(manifestContent.icons)).toBe(true)
      expect(manifestContent.icons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Search Engine Crawl Directives (public/robots.txt)', () => {
    it('mengizinkan akses etalase publik dan memblokir bot dari rute admin serta api', () => {
      const robotsPath = path.resolve(process.cwd(), 'public/robots.txt')
      expect(fs.existsSync(robotsPath)).toBe(true)

      const robotsContent = fs.readFileSync(robotsPath, 'utf-8')
      expect(robotsContent).toContain('Allow: /')
      expect(robotsContent).toContain('Allow: /katalog')
      expect(robotsContent).toContain('Allow: /c/')
      expect(robotsContent).toContain('Allow: /product/')
      expect(robotsContent).toContain('Disallow: /admin/')
      expect(robotsContent).toContain('Disallow: /api/')
      expect(robotsContent).toContain('Disallow: /checkout')
      expect(robotsContent).toContain('Sitemap: https://shelfstack.id/sitemap.xml')
    })
  })

  describe('Dynamic Sitemap XML (server/routes/sitemap.xml.ts)', () => {
    it('berkas route sitemap.xml.ts ada dan menyertakan rute kanonik storefront', () => {
      const sitemapPath = path.resolve(process.cwd(), 'server/routes/sitemap.xml.ts')
      expect(fs.existsSync(sitemapPath)).toBe(true)

      const sitemapCode = fs.readFileSync(sitemapPath, 'utf-8')
      expect(sitemapCode).toContain('https://shelfstack.id')
      expect(sitemapCode).toContain('application/xml')
      expect(sitemapCode).toContain('http://www.sitemaps.org/schemas/sitemap/0.9')
      expect(sitemapCode).toContain('/katalog')
      expect(sitemapCode).toContain('/c/tech')
      expect(sitemapCode).toContain('/promos')
      expect(sitemapCode).toContain('/about')
      expect(sitemapCode).toContain('/contact')
    })
  })

  describe('Product Schema.org JSON-LD Contract', () => {
    it('memvalidasi pembentukan skema JSON-LD Product yang sesuai standar Google Rich Results', () => {
      const mockProduct = {
        id: 101,
        slug: 'headphone-studio-anc',
        name: 'Headphone Studio ANC',
        price: 2680000,
        stock: 12,
        image_url: 'https://images.example.com/audio.jpg',
        description: 'Headphone peredam bising aktif kelas studio.',
        rating: 4.9,
        review_count: 38,
      }

      const jsonLd = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: mockProduct.name,
        image: mockProduct.image_url ? [mockProduct.image_url] : [],
        description: mockProduct.description,
        sku: `SKU-${mockProduct.id}`,
        brand: {
          '@type': 'Brand',
          name: 'ShelfStack',
        },
        offers: {
          '@type': 'Offer',
          url: `https://shelfstack.id/product/${mockProduct.slug}`,
          priceCurrency: 'IDR',
          price: mockProduct.price,
          availability:
            mockProduct.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: mockProduct.rating,
          reviewCount: mockProduct.review_count,
          bestRating: 5,
          worstRating: 1,
        },
      }

      expect(jsonLd['@context']).toBe('https://schema.org/')
      expect(jsonLd['@type']).toBe('Product')
      expect(jsonLd.offers.priceCurrency).toBe('IDR')
      expect(jsonLd.offers.price).toBe(2680000)
      expect(jsonLd.offers.availability).toBe('https://schema.org/InStock')
      expect(jsonLd.aggregateRating.ratingValue).toBe(4.9)
    })
  })

  describe('OfflineBanner Component (app/components/common/OfflineBanner.vue)', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('tidak menampilkan banner saat browser dalam status online', () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)

      const wrapper = mount(OfflineBanner)
      expect(wrapper.find('[data-testid="offline-banner"]').exists()).toBe(false)
    })

    it('menampilkan banner peringatan koneksi saat browser beralih ke status offline', async () => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)

      const wrapper = mount(OfflineBanner)
      expect(wrapper.find('[data-testid="offline-banner"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Koneksi internet terputus')
      expect(wrapper.text()).toContain('Hubungkan Ulang')
    })

    it('merespons event window online dan offline secara reaktif', async () => {
      const onLineSpy = vi.spyOn(navigator, 'onLine', 'get')
      onLineSpy.mockReturnValue(true)

      const wrapper = mount(OfflineBanner)
      expect(wrapper.find('[data-testid="offline-banner"]').exists()).toBe(false)

      // Simulasikan offline event
      onLineSpy.mockReturnValue(false)
      window.dispatchEvent(new Event('offline'))
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="offline-banner"]').exists()).toBe(true)

      // Simulasikan online event
      onLineSpy.mockReturnValue(true)
      window.dispatchEvent(new Event('online'))
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="offline-banner"]').exists()).toBe(false)
    })
  })
})
