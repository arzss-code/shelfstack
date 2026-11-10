import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { useWishlistStore } from '../../app/features/wishlist/stores/wishlist'
import type { Product } from '../../app/types/product'

const { mockUser, mockFetch } = vi.hoisted(() => ({
  mockUser: { value: null as { id: string } | null },
  mockFetch: vi.fn(),
}))

mockNuxtImport('useSupabaseUser', () => () => mockUser)
mockNuxtImport('$fetch', () => mockFetch)
vi.stubGlobal('$fetch', mockFetch)

const mockProductA: Product = {
  id: 101,
  name: 'Ergonomic Desk Mat',
  price: 250000,
  price_cents: 25000000,
  stock: 15,
  slug: 'ergonomic-desk-mat',
  image_url: 'https://example.com/desk-mat.jpg',
  category_id: 'cat-acc',
}

const mockProductB: Product = {
  id: 102,
  name: 'Studio Monitor Stand',
  price: 750000,
  price_cents: 75000000,
  stock: 10,
  slug: 'studio-monitor-stand',
  image_url: 'https://example.com/stand.jpg',
  category_id: 'cat-audio',
}

describe('Wishlist Session Isolation & Cross-Account Contamination Prevention', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockUser.value = null
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ status: 'success', data: [] })
  })

  it('menandai item sebagai data tamu (is-guest) saat disimpan oleh pengguna yang belum login', () => {
    const store = useWishlistStore()
    expect(mockUser.value).toBeNull()

    store.addItem(mockProductA)

    expect(store.totalItems).toBe(1)
    expect(localStorage.getItem('shelfstack-wishlist-is-guest')).toBe('true')
    expect(localStorage.getItem('shelfstack-wishlist')).toContain('101')
  })

  it('melakukan sinkronisasi ke database hanya jika data lokal berasal dari tamu murni', async () => {
    const store = useWishlistStore()
    store.addItem(mockProductA)
    expect(localStorage.getItem('shelfstack-wishlist-is-guest')).toBe('true')

    mockFetch.mockResolvedValue({
      status: 'success',
      data: [{ product: mockProductA, created_at: new Date().toISOString() }],
    })

    // User A login
    mockUser.value = { id: 'user-a-123' }
    await store.initWishlist()

    // Sinkronisasi dipanggil dan flag guest dihapus
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/wishlist/sync',
      expect.objectContaining({
        method: 'POST',
        body: { productIds: [101] },
      }),
    )
    expect(localStorage.getItem('shelfstack-wishlist-is-guest')).toBeNull()
  })

  it('membersihkan data lokal saat logout (resetOnLogout) tanpa memicu mutasi DELETE di cloud', () => {
    const store = useWishlistStore()
    store.addItem(mockProductA)
    expect(store.totalItems).toBe(1)
    expect(localStorage.getItem('shelfstack-wishlist')).toBeTruthy()

    mockFetch.mockClear()

    // Pengguna logout
    store.resetOnLogout()

    expect(store.items).toEqual([])
    expect(store.totalItems).toBe(0)
    expect(localStorage.getItem('shelfstack-wishlist')).toBeNull()
    expect(localStorage.getItem('shelfstack-wishlist-is-guest')).toBeNull()
    // resetOnLogout tidak boleh memicu HTTP DELETE ke server
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('mencegah kontaminasi data saat User B login di browser yang sama setelah User A logout', async () => {
    const store = useWishlistStore()

    // 1. User A aktif dengan item 101
    mockUser.value = { id: 'user-a-123' }
    store.addItem(mockProductA)
    expect(store.totalItems).toBe(1)

    // 2. User A Logout: teardown sesi dilakukan
    store.resetOnLogout()
    mockUser.value = null
    expect(store.totalItems).toBe(0)
    expect(localStorage.getItem('shelfstack-wishlist')).toBeNull()

    // 3. User B login di browser yang sama
    mockUser.value = { id: 'user-b-456' }
    mockFetch.mockClear()
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/wishlist') {
        return Promise.resolve({
          status: 'success',
          data: [{ product: mockProductB, created_at: new Date().toISOString() }],
        })
      }
      return Promise.resolve({ status: 'success', data: [] })
    })

    await store.initWishlist()

    // User B TIDAK boleh menyinkronkan item User A
    expect(mockFetch).not.toHaveBeenCalledWith('/api/wishlist/sync', expect.anything())
    // User B HANYA mengambil data miliknya sendiri dari database
    expect(mockFetch).toHaveBeenCalledWith('/api/wishlist')
    expect(store.totalItems).toBe(1)
    expect(store.isInWishlist(102)).toBe(true)
    expect(store.isInWishlist(101)).toBe(false)
  })
})
