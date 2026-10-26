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

  // Inisialisasi dari LocalStorage dan Sinkronisasi Database
  const initWishlist = async () => {
    if (import.meta.client) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            items.value = parsed
          }
        }
      } catch (e) {
        console.error('Failed to parse wishlist from localStorage:', e)
      }

      if (checkIsLoggedIn()) {
        await syncLocalToDatabase()
      }
    }
  }

  // Simpan ke LocalStorage
  const saveWishlist = () => {
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
      } catch (e) {
        console.error('Failed to save wishlist to localStorage:', e)
      }
    }
  }

  if (import.meta.client) {
    initWishlist()

    // Pantau perubahan sesi Supabase untuk sinkronisasi otomatis
    try {
      const user = useSupabaseUser()
      watch(
        () => user.value?.id,
        async (newUserId) => {
          if (newUserId) {
            await syncLocalToDatabase()
          }
        },
        { immediate: true },
      )
    } catch {
      // Abaikan jika useSupabaseUser tidak tersedia di lingkungan non-Nuxt
    }
  }

  // Ambil data terbaru dari Supabase Database
  const fetchFromDatabase = async () => {
    if (!checkIsLoggedIn() || !import.meta.client) return

    try {
      isSyncing.value = true
      const response = await $fetch<{ success: boolean; data: any[] }>('/api/wishlist')
      if (response?.success && Array.isArray(response.data)) {
        const mappedItems: WishlistItem[] = response.data
          .filter((row) => row.product)
          .map((row) => {
            const prod = row.product
            return {
              productId: prod.id,
              name: prod.name,
              slug: prod.slug,
              price: prod.price,
              priceCents: prod.price_cents ?? prod.price * 100,
              originalPriceCents: null,
              imageUrl: prod.image_url,
              stock: prod.stock,
              categoryId: prod.category_id,
              categoryName: null,
              addedAt: row.created_at,
            }
          })

        items.value = mappedItems
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
      const response = await $fetch<{ success: boolean; data: any[] }>('/api/wishlist/sync', {
        method: 'POST',
        body: { productIds: localProductIds },
      })

      if (response?.success && Array.isArray(response.data)) {
        const mappedItems: WishlistItem[] = response.data
          .filter((row) => row.product)
          .map((row) => {
            const prod = row.product
            return {
              productId: prod.id,
              name: prod.name,
              slug: prod.slug,
              price: prod.price,
              priceCents: prod.price_cents ?? prod.price * 100,
              originalPriceCents: null,
              imageUrl: prod.image_url,
              stock: prod.stock,
              categoryId: prod.category_id,
              categoryName: null,
              addedAt: row.created_at,
            }
          })

        items.value = mappedItems
        saveWishlist()
      }
    } catch (err) {
      console.warn('Gagal menyinkronkan wishlist ke database:', err)
    } finally {
      isSyncing.value = false
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

    const priceCents = product.price_cents ?? product.price * 100
    const newItem: WishlistItem = {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      priceCents,
      originalPriceCents: null,
      imageUrl: product.image_url,
      stock: product.stock,
      categoryId: product.category_id,
      categoryName: categoryName || null,
      addedAt: new Date().toISOString(),
    }

    // Optimistic Update
    items.value.unshift(newItem)
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
    if (existingIndex === -1) {
      return false
    }

    const removedItem = items.value[existingIndex]
    if (!removedItem) {
      return false
    }

    // Optimistic Update
    items.value.splice(existingIndex, 1)
    saveWishlist()

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
    let movedCount = 0

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
      movedCount++
    }

    return movedCount
  }

  const clearWishlist = () => {
    const backup = [...items.value]
    items.value = []
    saveWishlist()

    if (checkIsLoggedIn() && import.meta.client) {
      // Hapus seluruh item aktif di database
      Promise.all(
        backup.map((item) =>
          $fetch('/api/wishlist', {
            method: 'DELETE',
            body: { productId: item.productId },
          }),
        ),
      ).catch((err) => {
        console.warn('Gagal membersihkan wishlist di database:', err)
      })
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
    syncLocalToDatabase,
  }
})
