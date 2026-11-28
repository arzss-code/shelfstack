import { ref, computed, watch, onMounted } from 'vue'
import type {
  AdminCustomerSummary,
  AdminCrmMetrics,
  AdminCustomersResponse,
} from '~~/shared/types/admin-crm'
import { useAdminDebouncedSearch } from '~/composables/useAdminDebouncedSearch'

export function useAdminUsers() {
  const customers = ref<AdminCustomerSummary[]>([])
  const metrics = ref<AdminCrmMetrics>({
    totalCustomers: 0,
    totalRevenueCents: 0,
    formattedTotalRevenue: 'Rp 0',
    averageLtvCents: 0,
    formattedAverageLtv: 'Rp 0',
    activeOrderingCustomers: 0,
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  const searchQuery = ref('')
  const selectedSort = ref<'ltv_desc' | 'orders_desc' | 'latest' | 'name_asc'>('ltv_desc')
  const currentPage = ref(1)
  const totalPages = ref(1)
  const totalCustomersCount = ref(0)
  const itemsPerPage = ref(15)

  const sortOptions = [
    { value: 'ltv_desc', label: 'LTV Tertinggi' },
    { value: 'orders_desc', label: 'Pesanan Terbanyak' },
    { value: 'latest', label: 'Terbaru Bergabung' },
    { value: 'name_asc', label: 'Nama (A-Z)' },
  ]

  const hasActiveFilters = computed(() => Boolean(searchQuery.value.trim()))

  const fetchFromFirstPage = () => {
    if (currentPage.value !== 1) {
      currentPage.value = 1
      return
    }
    void fetchCustomers()
  }

  const { runAbortable, triggerNow, clearQuery } = useAdminDebouncedSearch(
    searchQuery,
    fetchFromFirstPage,
  )

  const fetchCustomers = async () => {
    error.value = null
    await runAbortable(
      loading,
      async ({ signal, isCurrent }) => {
        const queryParams: Record<string, string | number> = {
          page: currentPage.value,
          limit: itemsPerPage.value,
          sort: selectedSort.value,
        }
        if (searchQuery.value.trim()) {
          queryParams.search = searchQuery.value.trim()
        }

        const res = await $fetch<AdminCustomersResponse>('/api/admin/users', {
          query: queryParams,
          signal,
        })

        if (!isCurrent()) return
        customers.value = res.customers || []
        metrics.value = res.metrics
        totalPages.value = res.pagination.totalPages
        totalCustomersCount.value = res.pagination.total
      },
      (err) => {
        const e = err as { data?: { message?: string }; message?: string }
        error.value = e.data?.message || e.message || 'Gagal memuat data pelanggan admin CRM.'
      },
    )
  }

  const resetFilters = () => {
    clearQuery()
    fetchFromFirstPage()
  }

  watch(selectedSort, () => {
    fetchFromFirstPage()
  })

  watch(currentPage, () => {
    void fetchCustomers()
  })

  const setPageSize = (nextSize: number) => {
    const safe = Math.min(100, Math.max(1, nextSize))
    if (safe === itemsPerPage.value) return
    itemsPerPage.value = safe
    if (currentPage.value === 1) {
      fetchCustomers()
    } else {
      currentPage.value = 1
    }
  }

  onMounted(() => {
    fetchCustomers()
  })

  const hasCustomers = computed(() => customers.value.length > 0)

  return {
    customers,
    metrics,
    loading,
    error,
    searchQuery,
    selectedSort,
    currentPage,
    totalPages,
    totalCustomersCount,
    pageSize: itemsPerPage,
    setPageSize,
    sortOptions,
    hasCustomers,
    hasActiveFilters,
    fetchCustomers,
    resetFilters,
    triggerSearchNow: triggerNow,
  }
}
