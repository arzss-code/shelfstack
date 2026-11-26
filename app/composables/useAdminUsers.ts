import { ref, computed, watch, onMounted } from 'vue'
import type {
  AdminCustomerSummary,
  AdminCrmMetrics,
  AdminCustomersResponse,
} from '~~/shared/types/admin-crm'

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
  const itemsPerPage = 15

  const sortOptions = [
    { value: 'ltv_desc', label: 'LTV Tertinggi' },
    { value: 'orders_desc', label: 'Pesanan Terbanyak' },
    { value: 'latest', label: 'Terbaru Bergabung' },
    { value: 'name_asc', label: 'Nama (A-Z)' },
  ]

  const fetchCustomers = async () => {
    loading.value = true
    error.value = null
    try {
      const queryParams: Record<string, string | number> = {
        page: currentPage.value,
        limit: itemsPerPage,
        sort: selectedSort.value,
      }
      if (searchQuery.value.trim()) {
        queryParams.search = searchQuery.value.trim()
      }

      const res = await $fetch<AdminCustomersResponse>('/api/admin/users', {
        query: queryParams,
      })

      customers.value = res.customers || []
      metrics.value = res.metrics
      totalPages.value = res.pagination.totalPages
      totalCustomersCount.value = res.pagination.total
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      error.value = e.data?.message || e.message || 'Gagal memuat data pelanggan admin CRM.'
    } finally {
      loading.value = false
    }
  }

  // Debounced search / watch
  let searchTimeout: ReturnType<typeof setTimeout> | null = null
  watch(searchQuery, () => {
    currentPage.value = 1
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      fetchCustomers()
    }, 300)
  })

  watch(selectedSort, () => {
    currentPage.value = 1
    fetchCustomers()
  })

  watch(currentPage, () => {
    fetchCustomers()
  })

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
    sortOptions,
    hasCustomers,
    fetchCustomers,
  }
}
