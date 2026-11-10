import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createPinia, setActivePinia } from 'pinia'
import { useWishlistStore } from '../../app/features/wishlist/stores/wishlist'
import { useCartStore } from '../../app/features/cart/stores/cart'
import type { Product } from '../../app/types/product'

const { mockUser } = vi.hoisted(() => ({
  mockUser: { value: null as { id: string } | null },
}))
mockNuxtImport('useSupabaseUser', () => () => mockUser)

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
  stock: 0, // out of stock
  slug: 'studio-monitor-stand',
  image_url: 'https://example.com/stand.jpg',
  category_id: 'cat-audio',
}

describe('useWishlistStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockUser.value = null
  })

  it('menginisialisasi wishlist dalam kondisi kosong secara default', () => {
    const wishlist = useWishlistStore()
    expect(wishlist.items).toEqual([])
    expect(wishlist.totalItems).toBe(0)
    expect(wishlist.isEmpty).toBe(true)
    expect(wishlist.isInWishlist(101)).toBe(false)
  })

  it('menambahkan produk ke wishlist dan menghitung total item', () => {
    const wishlist = useWishlistStore()
    const added = wishlist.addItem(mockProductA, 'Aksesoris Meja')

    expect(added).toBe(true)
    expect(wishlist.items.length).toBe(1)
    expect(wishlist.totalItems).toBe(1)
    expect(wishlist.isEmpty).toBe(false)
    expect(wishlist.isInWishlist(101)).toBe(true)

    const saved = wishlist.items[0]
    expect(saved.productId).toBe(101)
    expect(saved.name).toBe('Ergonomic Desk Mat')
    expect(saved.price).toBe(250000)
    expect(saved.priceCents).toBe(25000000)
    expect(saved.stock).toBe(15)
    expect(saved.categoryName).toBe('Aksesoris Meja')
    expect(saved.addedAt).toBeDefined()
  })

  it('mencegah duplikasi produk dengan ID yang sama', () => {
    const wishlist = useWishlistStore()
    const firstAdd = wishlist.addItem(mockProductA)
    const secondAdd = wishlist.addItem(mockProductA)

    expect(firstAdd).toBe(true)
    expect(secondAdd).toBe(false)
    expect(wishlist.items.length).toBe(1)
  })

  it('menghapus item dari wishlist berdasarkan productId', () => {
    const wishlist = useWishlistStore()
    wishlist.addItem(mockProductA)
    wishlist.addItem(mockProductB)
    expect(wishlist.totalItems).toBe(2)

    const removed = wishlist.removeItem(101)
    expect(removed).toBe(true)
    expect(wishlist.totalItems).toBe(1)
    expect(wishlist.isInWishlist(101)).toBe(false)
    expect(wishlist.isInWishlist(102)).toBe(true)

    const removedNonExisting = wishlist.removeItem(999)
    expect(removedNonExisting).toBe(false)
  })

  it('toggle item secara dinamis (tambah jika belum ada, hapus jika sudah ada)', () => {
    const wishlist = useWishlistStore()

    // 1. Belum ada -> ditambahkan (returns true)
    const state1 = wishlist.toggleWishlist(mockProductA)
    expect(state1).toBe(true)
    expect(wishlist.isInWishlist(101)).toBe(true)

    // 2. Sudah ada -> dihapus (returns false)
    const state2 = wishlist.toggleWishlist(mockProductA)
    expect(state2).toBe(false)
    expect(wishlist.isInWishlist(101)).toBe(false)
  })

  it('memindahkan satu item dari wishlist ke keranjang belanja (moveToCart)', () => {
    const wishlist = useWishlistStore()
    const cart = useCartStore()

    wishlist.addItem(mockProductA)
    expect(wishlist.totalItems).toBe(1)
    expect(cart.totalItems).toBe(0)

    const success = wishlist.moveToCart(101)
    expect(success).toBe(true)
    expect(wishlist.totalItems).toBe(0)
    expect(cart.totalItems).toBe(1)
    expect(cart.items[0].productId).toBe(101)
  })

  it('memindahkan semua item yang memiliki stok ke keranjang (moveAllToCart)', () => {
    const wishlist = useWishlistStore()
    const cart = useCartStore()

    wishlist.addItem(mockProductA) // stock: 15
    wishlist.addItem(mockProductB) // stock: 0 (habis)
    expect(wishlist.totalItems).toBe(2)

    const movedCount = wishlist.moveAllToCart()
    expect(movedCount).toBe(1) // Hanya mockProductA yang dipindahkan
    expect(cart.totalItems).toBe(1)
    expect(wishlist.totalItems).toBe(1)
    expect(wishlist.items[0].productId).toBe(102) // mockProductB tetap tersimpan karena stok habis
  })

  it('mengosongkan seluruh item wishlist (clearWishlist)', () => {
    const wishlist = useWishlistStore()
    wishlist.addItem(mockProductA)
    wishlist.addItem(mockProductB)
    expect(wishlist.totalItems).toBe(2)

    wishlist.clearWishlist()
    expect(wishlist.totalItems).toBe(0)
    expect(wishlist.items).toEqual([])
    expect(wishlist.isEmpty).toBe(true)
  })

  it('menyimpan data secara persisten ke localStorage', () => {
    const wishlist = useWishlistStore()
    wishlist.addItem(mockProductA)

    const raw = localStorage.getItem('shelfstack-wishlist')
    expect(raw).toBeTruthy()

    const parsed = JSON.parse(raw!)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBe(1)
    expect(parsed[0].productId).toBe(101)
  })

  it('berhasil diinisialisasi saat pengguna dalam kondisi login tanpa ReferenceError', async () => {
    setActivePinia(createPinia())
    mockUser.value = { id: 'user-123' }
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue({ success: true, data: [] }))
    const store = useWishlistStore()
    expect(store).toBeDefined()
    await store.initWishlist()
    vi.unstubAllGlobals()
  })
})
