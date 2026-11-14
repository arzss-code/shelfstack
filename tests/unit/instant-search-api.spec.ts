import { describe, it, expect } from 'vitest'
import {
  sanitizeInstantSearchKeyword,
  isValidInstantSearchQuery,
  mapInstantSearchProducts,
  mapInstantSearchCategories,
  buildInstantSearchPayload,
} from '../../server/utils/instant-search'

describe('Server Utils: Instant Search Service Layer', () => {
  describe('isValidInstantSearchQuery', () => {
    it('mengembalikan false untuk input non-string, null, atau undefined', () => {
      expect(isValidInstantSearchQuery(null)).toBe(false)
      expect(isValidInstantSearchQuery(undefined)).toBe(false)
      expect(isValidInstantSearchQuery('')).toBe(false)
      expect(isValidInstantSearchQuery('   ')).toBe(false)
      expect(isValidInstantSearchQuery('a')).toBe(false)
    })

    it('mengembalikan true untuk query dengan minimal 2 karakter', () => {
      expect(isValidInstantSearchQuery('ab')).toBe(true)
      expect(isValidInstantSearchQuery('kopi')).toBe(true)
      expect(isValidInstantSearchQuery('  audio  ')).toBe(true)
    })
  })

  describe('sanitizeInstantSearchKeyword', () => {
    it('meng-escape karakter wildcard PostgreSQL % dan _', () => {
      expect(sanitizeInstantSearchKeyword('100%_diskon')).toBe('100\\%\\_diskon')
      expect(sanitizeInstantSearchKeyword('item%')).toBe('item\\%')
      expect(sanitizeInstantSearchKeyword('_test_')).toBe('\\_test\\_')
    })

    it('memotong panjang query maksimal 60 karakter', () => {
      const longQuery = 'a'.repeat(80)
      const sanitized = sanitizeInstantSearchKeyword(longQuery)
      expect(sanitized.length).toBe(60)
    })

    it('menangani string kosong dengan aman', () => {
      expect(sanitizeInstantSearchKeyword('')).toBe('')
    })
  })

  describe('mapInstantSearchProducts', () => {
    it('memetakan baris database produk dengan relasi kategori objek tunggal', () => {
      const rawRows = [
        {
          id: 'prod-01',
          name: 'Mechanical Keyboard Pro',
          slug: 'mech-keyboard-pro',
          price: 850000,
          image_url: 'https://images.unsplash.com/keyboard.jpg',
          stock: 10,
          categories: { name: 'Tech & Gadget' },
        },
      ]

      const mapped = mapInstantSearchProducts(rawRows)
      expect(mapped).toEqual([
        {
          id: 'prod-01',
          name: 'Mechanical Keyboard Pro',
          slug: 'mech-keyboard-pro',
          price: 850000,
          image_url: 'https://images.unsplash.com/keyboard.jpg',
          category: 'Tech & Gadget',
          stock: 10,
        },
      ])
    })

    it('memetakan baris database produk dengan relasi kategori array', () => {
      const rawRows = [
        {
          id: 'prod-02',
          name: 'Desk Mat Minimalist',
          slug: null,
          price: '150000',
          image_url: null,
          stock: null,
          categories: [{ name: 'Ruang Kerja' }],
        },
      ]

      const mapped = mapInstantSearchProducts(rawRows)
      expect(mapped).toEqual([
        {
          id: 'prod-02',
          name: 'Desk Mat Minimalist',
          slug: null,
          price: 150000,
          image_url: null,
          category: 'Ruang Kerja',
          stock: 0,
        },
      ])
    })

    it('menangani array kosong atau input null', () => {
      expect(mapInstantSearchProducts([])).toEqual([])
    })
  })

  describe('mapInstantSearchCategories', () => {
    it('memetakan kategori database ke InstantSearchCategory', () => {
      const rawCategories = [
        { id: 'cat-01', name: 'Tech & Gadget', slug: 'tech' },
        { id: 'cat-02', name: 'Rumah & Dapur', slug: 'home' },
      ]

      const mapped = mapInstantSearchCategories(rawCategories)
      expect(mapped).toEqual([
        { id: 'cat-01', name: 'Tech & Gadget', slug: 'tech' },
        { id: 'cat-02', name: 'Rumah & Dapur', slug: 'home' },
      ])
    })
  })

  describe('buildInstantSearchPayload', () => {
    it('menggabungkan produk dan kategori menjadi satu struktur InstantSearchResponse yang bersih', () => {
      const rawProducts = [
        {
          id: 'p1',
          name: 'Mouse Wireless',
          slug: 'mouse-wireless',
          price: 300000,
          image_url: null,
          stock: 5,
          categories: { name: 'Tech' },
        },
      ]
      const rawCategories = [{ id: 'c1', name: 'Tech', slug: 'tech' }]

      const payload = buildInstantSearchPayload('  mouse  ', rawProducts, rawCategories)
      expect(payload.query).toBe('mouse')
      expect(payload.products).toHaveLength(1)
      expect(payload.categories).toHaveLength(1)
    })
  })
})
