import { computed, ref, watch, type Ref } from 'vue'

/**
 * Memaginasi array baris di klien secara reaktif dengan pengaman batas halaman dan ukuran halaman.
 */
export function useClientPagination<T>(
  source: Ref<readonly T[]> | (() => readonly T[]),
  initialPageSize = 12,
) {
  const page = ref(1)
  const pageSize = ref(initialPageSize)

  const items = computed(() => (typeof source === 'function' ? source() : source.value))
  const totalCount = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize.value)))

  watch([totalCount, pageSize], () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value
    }
  })

  const paginatedItems = computed(() => {
    const start = (page.value - 1) * pageSize.value
    return items.value.slice(start, start + pageSize.value)
  })

  const resetPage = () => {
    page.value = 1
  }

  const setPageSize = (nextSize: number) => {
    if (!Number.isFinite(nextSize) || nextSize < 1) return
    pageSize.value = nextSize
    page.value = 1
  }

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    paginatedItems,
    resetPage,
    setPageSize,
  }
}
