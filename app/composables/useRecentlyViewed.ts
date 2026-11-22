import { ref, onMounted, getCurrentInstance } from 'vue'

export interface RecentlyViewedItem {
  id: string | number
  name: string
  slug?: string | null
  price: number
  imageUrl?: string | null
  category?: string | null
  stock: number
  rating?: number | null
  soldCount?: number | null
  viewedAt?: number
}

const STORAGE_KEY = 'shelfstack_recently_viewed'
const MAX_RECENTLY_VIEWED = 8

export function useRecentlyViewed() {
  const recentlyViewed = ref<RecentlyViewedItem[]>([])

  const loadRecentlyViewed = () => {
    if (!import.meta.client) return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          recentlyViewed.value = parsed.filter(
            (item): item is RecentlyViewedItem =>
              Boolean(item) &&
              (typeof item.id === 'string' || typeof item.id === 'number') &&
              typeof item.name === 'string' &&
              typeof item.price === 'number',
          )
        }
      }
    } catch {
      recentlyViewed.value = []
    }
  }

  const saveToStorage = (items: RecentlyViewedItem[]) => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Graceful fallback jika localStorage penuh
    }
  }

  const addItem = (item: RecentlyViewedItem) => {
    if (!item || (!item.id && item.id !== 0)) return

    const stringId = String(item.id)
    const filtered = recentlyViewed.value.filter((existing) => String(existing.id) !== stringId)
    const newItem: RecentlyViewedItem = {
      ...item,
      viewedAt: Date.now(),
    }
    const updated = [newItem, ...filtered].slice(0, MAX_RECENTLY_VIEWED)
    recentlyViewed.value = updated
    saveToStorage(updated)
  }

  const removeItem = (id: string | number) => {
    const stringId = String(id)
    const updated = recentlyViewed.value.filter((item) => String(item.id) !== stringId)
    recentlyViewed.value = updated
    saveToStorage(updated)
  }

  const clearRecentlyViewed = () => {
    recentlyViewed.value = []
    if (import.meta.client) {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // Fallback
      }
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      loadRecentlyViewed()
    })
  } else {
    loadRecentlyViewed()
  }

  return {
    recentlyViewed,
    loadRecentlyViewed,
    addItem,
    removeItem,
    clearRecentlyViewed,
  }
}
