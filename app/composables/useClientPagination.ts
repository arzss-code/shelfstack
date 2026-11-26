import { computed, ref, watch, type Ref } from 'vue'

/**
 * Memaginasi array baris di klien secara reaktif dengan pengaman batas halaman saat data tersaring.
 */
export function useClientPagination<T>(
  source: Ref<readonly T[]> | (() => readonly T[]),
  pageSize = 12,
) {
  const page = ref(1)

  const items = computed(() => (typeof source === 'function' ? source() : source.value))
  const totalCount = computed(() => items.value.length)
  const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

  watch(totalCount, () => {
    if (page.value > totalPages.value) {
      page.value = totalPages.value
    }
  })

  const paginatedItems = computed(() => {
    const start = (page.value - 1) * pageSize
    return items.value.slice(start, start + pageSize)
  })

  const resetPage = () => {
    page.value = 1
  }

  return {
    page,
    pageSize,
    totalCount,
    totalPages,
    paginatedItems,
    resetPage,
  }
}
