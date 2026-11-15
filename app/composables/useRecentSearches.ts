import { ref, onMounted, getCurrentInstance } from 'vue'

const STORAGE_KEY = 'shelfstack_recent_searches'
const MAX_RECENT_ITEMS = 6

export const POPULAR_SEARCH_TAGS = Object.freeze([
  'Mechanical Keyboard',
  'Monitor Stand',
  'Desk Mat',
  'USB-C Hub',
  'Ergonomic Chair',
] as const)

export function useRecentSearches() {
  const recentSearches = ref<string[]>([])

  const loadFromStorage = () => {
    if (!import.meta.client) return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          recentSearches.value = parsed.filter(
            (item): item is string => typeof item === 'string' && item.trim().length > 0,
          )
        }
      }
    } catch {
      recentSearches.value = []
    }
  }

  const saveToStorage = (items: string[]) => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Graceful fallback jika localStorage penuh atau dibatasi browser
    }
  }

  const addSearch = (term: string) => {
    const trimmed = term.trim()
    if (trimmed.length < 2) return

    const filtered = recentSearches.value.filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase(),
    )
    const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_ITEMS)
    recentSearches.value = updated
    saveToStorage(updated)
  }

  const removeSearch = (term: string) => {
    const updated = recentSearches.value.filter(
      (item) => item.toLowerCase() !== term.trim().toLowerCase(),
    )
    recentSearches.value = updated
    saveToStorage(updated)
  }

  const clearSearches = () => {
    recentSearches.value = []
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
      loadFromStorage()
    })
  } else {
    loadFromStorage()
  }

  return {
    recentSearches,
    popularTags: POPULAR_SEARCH_TAGS,
    loadFromStorage,
    addSearch,
    removeSearch,
    clearSearches,
  }
}
