import { defineStore } from 'pinia'
import type { Product } from '~/types/product'
import { useCartStore } from '~/features/cart/stores/cart'

export interface WishlistItem {
  productId: number
  name: string
  slug?: string | null
  price: number
  priceCents: number
  originalPriceCents?: number | null
  imageUrl: string | null
  stock: number
  categoryId?: string | null
  categoryName?: string | null
  addedAt: string
}

const STORAGE_KEY = 'shelfstack-wishlist'
const GUEST_FLAG_KEY = 'shelfstack-wishlist-is-guest'

interface WishlistDbRow {
  product: {
    id: number
    name: string
    slug?: string | null
    price: number
    price_cents?: number | null
    image_url: string | null
    stock: number
    category_id?: string | null
  }
  created_at: string
}

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref<WishlistItem[]>([])
  const isSyncing = ref(false)

  // Helper aman untuk mendeteksi status login tanpa crash di lingkungan non-Nuxt/Unit Test
  const checkIsLoggedIn = (): boolean => {
    try {
      const user = useSupabaseUser()
      return Boolean(user?.value)
    } catch {
      return false
    }
  }

  // Simpan ke LocalStorage
  const saveWishlist = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
    } catch {
      // Storage error ignored
    }
  }

  // Helper pemetaan baris relasi database ke WishlistItem
  const mapWishlistRow = (row: WishlistDbRow): WishlistItem => ({
    productId: row.product.id,
    name: row.product.name,
    slug: row.product.slug,
    price: row.product.price,
    priceCents: row.product.price_cents ?? row.product.price * 100,
    originalPriceCents: null,
    imageUrl: row.product.image_url,
    stock: row.product.stock,
    categoryId: row.product.category_id,
    categoryName: null,
    addedAt: row.created_at,
  })

  // Ambil data terbaru dari Supabase Database
  const fetchFromDatabase = async () => {
    if (!checkIsLoggedIn() || !import.meta.client) return

    try {
      isSyncing.value = true
      const response = await $fetch<{ status?: string; success?: boolean; data: WishlistDbRow[] }>(
        '/api/wishlist',
      )
      if ((response?.status === 'success' || response?.success) && Array.isArray(response.data)) {
        items.value = response.data.filter((row) => row.product).map(mapWishlistRow)
        saveWishlist()
      }
    } catch (err) {
      console.warn('Gagal memuat wishlist dari database:', err)
    } finally {
      isSyncing.value = false
    }
  }

  // Sinkronkan item lokal ke Supabase saat pengguna login
  const syncLocalToDatabase = async () => {
    if (!checkIsLoggedIn() || !import.meta.client) return
    const localProductIds = items.value.map((i) => i.productId)
    try {
      isSyncing.value = true
      const response = await $fetch<{ status?: string; success?: boolean; data: WishlistDbRow[] }>(
        '/api/wishlist/sync',
        {
          method: 'POST',
          body: { productIds: localProductIds },
        },
      )
      if ((response?.status === 'success' || response?.success) && Array.isArray(response.data)) {
        items.value = response.data.filter((row) => row.product).map(mapWishlistRow)
        saveWishlist()
      }
    } catch (err) {
      console.warn('Gagal menyinkronkan wishlist ke database:', err)
    } finally {
      isSyncing.value = false
    }
  }

  // Inisialisasi dari LocalStorage dan Sinkronisasi Database
  const initWishlist = async () => {
    if (!import.meta.client) return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) items.value = parsed
      }
    } catch {
      // Parse error ignored
    }

    if (checkIsLoggedIn()) {
      const isGuestData = localStorage.getItem(GUEST_FLAG_KEY) === 'true'
      if (isGuestData && items.value.length > 0) {
        await syncLocalToDatabase()
        localStorage.removeItem(GUEST_FLAG_KEY)
      } else {
        await fetchFromDatabase()
      }
    }
  }

  // Getters
  const totalItems = computed(() => items.value.length)
  const isEmpty = computed(() => items.value.length === 0)

  const isInWishlist = (productId: number): boolean => {
    return items.value.some((item) => item.productId === productId)
  }

  // Actions
  const addItem = (product: Product, categoryName?: string | null): boolean => {
    if (isInWishlist(product.id)) {
      return false
    }

    if (!checkIsLoggedIn() && import.meta.client) {
      try {
        localStorage.setItem(GUEST_FLAG_KEY, 'true')
      } catch {
        // Abaikan kegagalan storage
      }
    }
    // Optimistic Update
    items.value.unshift({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      priceCents: product.price_cents ?? product.price * 100,
      originalPriceCents: null,
      imageUrl: product.image_url,
      stock: product.stock,
      categoryId: product.category_id,
      categoryName: categoryName || null,
      addedAt: new Date().toISOString(),
    })
    saveWishlist()

    // Sinkronkan ke cloud jika login
    if (checkIsLoggedIn() && import.meta.client) {
      $fetch('/api/wishlist', {
        method: 'POST',
        body: { productId: product.id },
      }).catch((err) => {
        console.warn('Gagal menyinkronkan wishlist ke server (tetap tersimpan lokal):', err)
      })
    }

    return true
  }

  const removeItem = (productId: number): boolean => {
    const existingIndex = items.value.findIndex((item) => item.productId === productId)
    if (existingIndex === -1 || !items.value[existingIndex]) return false

    // Optimistic Update
    items.value.splice(existingIndex, 1)
    saveWishlist()

    if (!checkIsLoggedIn() && import.meta.client && items.value.length === 0) {
      try {
        localStorage.removeItem(GUEST_FLAG_KEY)
      } catch {
        // Abaikan kegagalan storage
      }
    }

    // Sinkronkan ke cloud jika login
    if (checkIsLoggedIn() && import.meta.client) {
      $fetch('/api/wishlist', {
        method: 'DELETE',
        body: { productId },
      }).catch((err) => {
        console.warn('Gagal menghapus wishlist di server (tetap terhapus lokal):', err)
      })
    }

    return true
  }

  const toggleWishlist = (product: Product, categoryName?: string | null): boolean => {
    if (isInWishlist(product.id)) {
      removeItem(product.id)
      return false
    }
    addItem(product, categoryName)
    return true
  }

  const moveToCart = (productId: number): boolean => {
    const item = items.value.find((i) => i.productId === productId)
    if (!item) return false

    const cartStore = useCartStore()
    cartStore.addItem({
      productId: item.productId,
      name: item.name,
      price: item.price,
      priceCents: item.priceCents,
      imageUrl: item.imageUrl,
      stock: item.stock,
      slug: item.slug,
      openCartDrawer: false,
    })

    removeItem(productId)
    return true
  }

  const moveAllToCart = (): number => {
    const cartStore = useCartStore()
    const availableItems = items.value.filter((i) => i.stock > 0)
    for (const item of availableItems) {
      cartStore.addItem({
        productId: item.productId,
        name: item.name,
        price: item.price,
        priceCents: item.priceCents,
        imageUrl: item.imageUrl,
        stock: item.stock,
        slug: item.slug,
        openCartDrawer: false,
      })
      removeItem(item.productId)
    }
    return availableItems.length
  }

  const clearWishlist = () => {
    const backup = [...items.value]
    items.value = []
    saveWishlist()
    if (checkIsLoggedIn() && import.meta.client) {
      Promise.all(
        backup.map((i) =>
          $fetch('/api/wishlist', { method: 'DELETE', body: { productId: i.productId } }),
        ),
      ).catch((err) => console.warn('Gagal membersihkan wishlist di database:', err))
    }
  }

  const resetOnLogout = () => {
    items.value = []
    if (import.meta.client) {
      try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(GUEST_FLAG_KEY)
      } catch {
        // Abaikan kegagalan storage
      }
    }
  }

  // Inisialisasi otomatis dan watcher sesi setelah seluruh fungsi terdefinisi
  if (import.meta.client) {
    initWishlist()

    // Pantau perubahan sesi Supabase untuk sinkronisasi otomatis
    try {
      const user = useSupabaseUser()
      watch(
        () => user.value?.id,
        async (newUserId, oldUserId) => {
          if (newUserId) {
            const isGuestData = localStorage.getItem(GUEST_FLAG_KEY) === 'true'
            if (isGuestData && items.value.length > 0) {
              await syncLocalToDatabase()
              localStorage.removeItem(GUEST_FLAG_KEY)
            } else {
              await fetchFromDatabase()
            }
          } else if (oldUserId && !newUserId) {
            resetOnLogout()
          }
        },
      )
    } catch {
      // Abaikan jika useSupabaseUser tidak tersedia di lingkungan non-Nuxt
    }
  }

  return {
    items,
    totalItems,
    isEmpty,
    isSyncing,
    initWishlist,
    isInWishlist,
    addItem,
    removeItem,
    toggleWishlist,
    moveToCart,
    moveAllToCart,
    clearWishlist,
    fetchFromDatabase,
    resetOnLogout,
    syncLocalToDatabase,
  }
})
