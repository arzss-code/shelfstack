import { defineStore } from 'pinia'
import type { Product } from '~/types/product'
import { useCartStore } from '~/features/cart/stores/cart'
import {
  type WishlistItem,
  type WishlistDbRow,
  WISHLIST_GUEST_FLAG_KEY,
  mapWishlistRow,
  createWishlistItem,
  loadWishlistStorage,
  saveWishlistStorage,
  clearWishlistStorage,
} from '../utils/wishlist-helper'

export type { WishlistItem } from '../utils/wishlist-helper'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref<WishlistItem[]>([])
  const isSyncing = ref(false)

  const checkIsLoggedIn = (): boolean => {
    try {
      const user = useSupabaseUser()
      return Boolean(user?.value)
    } catch {
      return false
    }
  }

  const saveWishlist = () => saveWishlistStorage(items.value)

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

  const syncLocalToDatabase = async () => {
    if (!checkIsLoggedIn() || !import.meta.client) return
    const localProductIds = items.value.map((i) => i.productId)
    try {
      isSyncing.value = true
      const response = await $fetch<{ status?: string; success?: boolean; data: WishlistDbRow[] }>(
        '/api/wishlist/sync',
        { method: 'POST', body: { productIds: localProductIds } },
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

  const initWishlist = async () => {
    if (!import.meta.client) return
    const stored = loadWishlistStorage()
    if (stored) items.value = stored

    if (checkIsLoggedIn()) {
      const isGuestData = localStorage.getItem(WISHLIST_GUEST_FLAG_KEY) === 'true'
      if (isGuestData && items.value.length > 0) {
        await syncLocalToDatabase()
        localStorage.removeItem(WISHLIST_GUEST_FLAG_KEY)
      } else {
        await fetchFromDatabase()
      }
    }
  }

  const totalItems = computed(() => items.value.length)
  const isEmpty = computed(() => items.value.length === 0)
  const isInWishlist = (productId: number): boolean =>
    items.value.some((item) => item.productId === productId)

  const addItem = (product: Product, categoryName?: string | null): boolean => {
    if (isInWishlist(product.id)) return false

    if (!checkIsLoggedIn() && import.meta.client) {
      try {
        localStorage.setItem(WISHLIST_GUEST_FLAG_KEY, 'true')
      } catch {
        // Abaikan kegagalan storage
      }
    }

    items.value.unshift(createWishlistItem(product, categoryName))
    saveWishlist()

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

    items.value.splice(existingIndex, 1)
    saveWishlist()

    if (!checkIsLoggedIn() && import.meta.client && items.value.length === 0) {
      try {
        localStorage.removeItem(WISHLIST_GUEST_FLAG_KEY)
      } catch {
        // Abaikan kegagalan storage
      }
    }

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
    clearWishlistStorage()
  }

  if (import.meta.client) {
    initWishlist()

    try {
      const user = useSupabaseUser()
      watch(
        () => user.value?.id,
        async (newUserId, oldUserId) => {
          if (newUserId) {
            const isGuestData = localStorage.getItem(WISHLIST_GUEST_FLAG_KEY) === 'true'
            if (isGuestData && items.value.length > 0) {
              await syncLocalToDatabase()
              localStorage.removeItem(WISHLIST_GUEST_FLAG_KEY)
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
