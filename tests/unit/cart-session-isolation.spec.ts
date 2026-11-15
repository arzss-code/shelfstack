import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '../../app/features/cart/stores/cart'
import { useWishlistStore } from '../../app/features/wishlist/stores/wishlist'
import type { Product } from '../../app/types/product'

const { mockUser, mockFetch } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ref: vueRef } = require('vue') as typeof import('vue')
  return {
    mockUser: vueRef<{ id: string; email?: string } | null>(null),
    mockFetch: vi.fn(),
  }
})

mockNuxtImport('useSupabaseUser', () => () => mockUser)
mockNuxtImport('$fetch', () => mockFetch)
vi.stubGlobal('$fetch', mockFetch)

const sampleProductA: Product = {
  id: 201,
  name: 'Minimalist Aluminum Stand',
  price: 450000,
  price_cents: 45000000,
  stock: 12,
  slug: 'minimalist-aluminum-stand',
  image_url: 'https://example.com/stand.jpg',
  category_id: 'cat-hardware',
}

const sampleProductB: Product = {
  id: 202,
  name: 'Wireless Mechanical Keyboard',
  price: 1250000,
  price_cents: 125000000,
  stock: 8,
  slug: 'wireless-mechanical-keyboard',
  image_url: 'https://example.com/keyboard.jpg',
  category_id: 'cat-hardware',
}

describe('Cart Session Isolation, Guest Persistence & Logout Storage Teardown', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockUser.value = null
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ status: 'success', data: [] })
  })

  it('menyimpan item di localStorage saat pengguna tamu (guest) menambahkan produk', () => {
    const cart = useCartStore()
    expect(mockUser.value).toBeNull()

    cart.addItem({
      productId: sampleProductA.id,
      name: sampleProductA.name,
      price: sampleProductA.price,
      stock: sampleProductA.stock,
      quantity: 2,
      openCartDrawer: false,
    })

    expect(cart.totalItems).toBe(2)
    const stored = localStorage.getItem('shelfstack-cart')
    expect(stored).toBeTruthy()
    expect(stored).toContain('201')
    expect(stored).toContain('Minimalist Aluminum Stand')
  })

  it('mempertahankan isi keranjang tamu saat pengguna login ke akunnya', async () => {
    const cart = useCartStore()

    // 1. Tamu menambahkan item ke keranjang belanja
    cart.addItem({
      productId: sampleProductA.id,
      name: sampleProductA.name,
      price: sampleProductA.price,
      stock: sampleProductA.stock,
      quantity: 1,
      openCartDrawer: false,
    })
    expect(cart.totalItems).toBe(1)
    expect(localStorage.getItem('shelfstack-cart')).toContain('201')

    // 2. Tamu login (user.value berubah dari null ke akun aktif)
    mockUser.value = { id: 'usr-customer-77', email: 'customer@shelfstack.local' }
    await nextTick()

    // 3. Isi keranjang belanja tetap tersimpan dan tidak terhapus
    expect(cart.totalItems).toBe(1)
    expect(cart.items[0]?.productId).toBe(201)
    expect(localStorage.getItem('shelfstack-cart')).toContain('201')
  })

  it('membersihkan storage lokal dan state memori keranjang saat logout (resetOnLogout)', async () => {
    const cart = useCartStore()

    // 1. Pengguna login dan memiliki barang di keranjang belanja
    mockUser.value = { id: 'usr-customer-77', email: 'customer@shelfstack.local' }
    await nextTick()

    cart.addItem({
      productId: sampleProductA.id,
      name: sampleProductA.name,
      price: sampleProductA.price,
      stock: sampleProductA.stock,
      quantity: 3,
      openCartDrawer: false,
    })
    expect(cart.totalItems).toBe(3)
    expect(localStorage.getItem('shelfstack-cart')).toBeTruthy()

    // 2. Pengguna melakukan logout (user.value menjadi null)
    mockUser.value = null
    await nextTick()

    // Verifikasi resetOnLogout otomatis dieksekusi oleh watcher
    expect(cart.items).toEqual([])
    expect(cart.totalItems).toBe(0)
    expect(localStorage.getItem('shelfstack-cart')).toBeNull()
    expect(localStorage.getItem('shelfstack-applied-coupon')).toBeNull()
  })

  it('memastikan pembersihan storage saat logout tidak menghapus data wishlist di database', async () => {
    const cart = useCartStore()
    const wishlist = useWishlistStore()

    // 1. Pengguna login dan menambahkan produk ke keranjang & wishlist
    mockUser.value = { id: 'usr-customer-88', email: 'user88@shelfstack.local' }
    await nextTick()

    cart.addItem({
      productId: sampleProductA.id,
      name: sampleProductA.name,
      price: sampleProductA.price,
      stock: sampleProductA.stock,
      quantity: 1,
      openCartDrawer: false,
    })
    wishlist.addItem(sampleProductB)

    expect(cart.totalItems).toBe(1)
    expect(wishlist.totalItems).toBe(1)
    expect(localStorage.getItem('shelfstack-cart')).toBeTruthy()
    expect(localStorage.getItem('shelfstack-wishlist')).toBeTruthy()

    mockFetch.mockClear()

    // 2. Pengguna logout
    cart.resetOnLogout()
    wishlist.resetOnLogout()
    mockUser.value = null
    await nextTick()

    // Storage client bersih total untuk mencegah kebocoran sesi
    expect(cart.items).toEqual([])
    expect(wishlist.items).toEqual([])
    expect(localStorage.getItem('shelfstack-cart')).toBeNull()
    expect(localStorage.getItem('shelfstack-wishlist')).toBeNull()

    // Verifikasi bahwa TIDAK ADA HTTP DELETE request yang dikirimkan ke endpoint database wishlist
    const deleteCalls = mockFetch.mock.calls.filter((call) => {
      const url = call[0]
      const opts = call[1]
      return url === '/api/wishlist' && opts?.method === 'DELETE'
    })
    expect(deleteCalls).toHaveLength(0)
  })
})
