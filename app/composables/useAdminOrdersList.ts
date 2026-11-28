import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AdminOrderRow } from '~/features/orders/components/AdminOrderTable.vue'
import type { Database } from '~/types/database.types'
import type { OrderStatus } from '~/types/order'
import { useUiToast } from '~/composables/useUiToast'
import { useAdminDebouncedSearch } from '~/composables/useAdminDebouncedSearch'

export function useAdminOrdersList() {
  const route = useRoute()
  const router = useRouter()
  const toast = useUiToast()
  const supabase = useSupabaseClient<Database>()

  const activeStatus = ref<string>((route.query.status as string) || '')
  const searchQuery = ref('')
  const fromDate = ref('')
  const toDate = ref('')
  const page = ref(1)
  const pageSize = ref(15)
  const sortKey = ref<string | null>(null)
  const sortDirection = ref<'desc' | 'asc' | null>(null)

  const sortParam = computed(() => {
    if (!sortKey.value || !sortDirection.value || sortKey.value === 'items') return ''
    const col = sortKey.value === 'id' ? 'created_at' : sortKey.value
    return `${col}_${sortDirection.value}`
  })

  const loading = ref(true)
  const orders = ref<AdminOrderRow[]>([])
  const totalOrders = ref(0)
  const errorMessage = ref('')
  const exporting = ref(false)
  const exportingFormat = ref<'csv' | 'xlsx' | null>(null)
  let orderChannel: RealtimeChannel | null = null

  const statusTabs = [
    { label: 'Semua', value: '' },
    { label: 'Menunggu', value: 'pending' },
    { label: 'Lunas', value: 'paid' },
    { label: 'Dikirim', value: 'shipped' },
    { label: 'Selesai', value: 'completed' },
    { label: 'Dibatalkan', value: 'cancelled' },
  ]

  const hasActiveFilters = computed(() =>
    Boolean(searchQuery.value.trim() || fromDate.value || toDate.value || activeStatus.value),
  )

  const { runAbortable, triggerNow, clearQuery } = useAdminDebouncedSearch(searchQuery, () => {
    page.value = 1
    void fetchOrders()
  })

  const fetchOrders = async () => {
    errorMessage.value = ''
    const from = (page.value - 1) * pageSize.value
    const to = from + pageSize.value - 1
    await runAbortable(
      loading,
      async ({ signal, isCurrent }) => {
        const params: Record<string, string | number> = { from, to }
        if (activeStatus.value) params.status = activeStatus.value
        if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
        if (fromDate.value) params.date_from = fromDate.value
        if (toDate.value) params.date_to = toDate.value
        if (sortParam.value) params.sort = sortParam.value

        const res = await $fetch<{
          status: string
          data: { orders: AdminOrderRow[]; total: number }
        }>('/api/admin/orders', { params, signal })
        if (!isCurrent()) return
        orders.value = res.data.orders
        totalOrders.value = res.data.total
      },
      (err) => {
        const fetchErr = err as { data?: { message?: string } }
        errorMessage.value = fetchErr.data?.message || 'Gagal memuat daftar pesanan admin.'
      },
    )
  }

  const onStatusChange = (val: string) => {
    activeStatus.value = val
    page.value = 1
    router.push({ query: val ? { status: val } : {} })
    void fetchOrders()
  }

  const onSearch = () => {
    triggerNow()
  }

  const resetDateFilters = () => {
    fromDate.value = ''
    toDate.value = ''
    page.value = 1
    void fetchOrders()
  }

  const resetFilters = () => {
    clearQuery()
    fromDate.value = ''
    toDate.value = ''
    activeStatus.value = ''
    page.value = 1
    router.push({ query: {} })
    void fetchOrders()
  }

  const onSortChange = (payload: { key: string | null; direction: 'desc' | 'asc' | null }) => {
    sortKey.value = payload.direction ? payload.key : null
    sortDirection.value = payload.direction
    if (sortKey.value === 'items') {
      const factor = sortDirection.value === 'desc' ? -1 : 1
      orders.value = [...orders.value].sort(
        (a, b) => ((a.order_items?.length || 0) - (b.order_items?.length || 0)) * factor,
      )
      return
    }
    page.value = 1
    fetchOrders()
  }

  const handleExport = async (format: 'csv' | 'xlsx' = 'csv') => {
    exporting.value = true
    exportingFormat.value = format
    try {
      const params: Record<string, string> = { format }
      if (activeStatus.value) params.status = activeStatus.value
      if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
      if (fromDate.value) params.from = fromDate.value
      if (toDate.value) params.to = toDate.value
      if (sortParam.value) params.sort = sortParam.value

      const dateStamp = new Date().toISOString().slice(0, 10)
      const mimeType =
        format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv;charset=utf-8;'
      const buf = await $fetch<ArrayBuffer>('/api/admin/orders/export', {
        params,
        responseType: 'arrayBuffer',
      })
      const blob = new Blob([buf], { type: mimeType })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `laporan-pesanan-${dateStamp}.${format}`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.show({
        title: 'Ekspor Berhasil',
        message:
          format === 'xlsx'
            ? 'Laporan Excel (.xlsx) pesanan berhasil diunduh.'
            : 'Laporan CSV pesanan berhasil diunduh.',
        tone: 'success',
      })
    } catch {
      toast.show({
        title: 'Gagal Ekspor',
        message:
          format === 'xlsx'
            ? 'Gagal mengunduh laporan Excel pesanan.'
            : 'Gagal mengunduh laporan CSV pesanan.',
        tone: 'error',
      })
    } finally {
      exporting.value = false
      exportingFormat.value = null
    }
  }

  const handleExportCsv = () => handleExport('csv')

  const totalPages = computed(() => Math.ceil(totalOrders.value / pageSize.value) || 1)

  const prevPage = () => {
    if (page.value > 1) {
      page.value--
      fetchOrders()
    }
  }

  const nextPage = () => {
    if (page.value < totalPages.value) {
      page.value++
      fetchOrders()
    }
  }

  const setPage = (next: number) => {
    if (next < 1 || next > totalPages.value || next === page.value) return
    page.value = next
    fetchOrders()
  }

  const setPageSize = (nextSize: number) => {
    if (!Number.isFinite(nextSize) || nextSize < 1 || nextSize === pageSize.value) return
    pageSize.value = nextSize
    page.value = 1
    fetchOrders()
  }

  const setupRealtime = () => {
    if (!import.meta.client) return

    orderChannel = supabase
      .channel('admin-orders-stream')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newRecord = payload.new as Record<string, unknown>
          const shortId = String(newRecord.id || '').slice(0, 8)
          toast.show({
            title: 'Pesanan Baru Diterima',
            message: `Pesanan #${shortId} baru saja masuk. Memperbarui daftar...`,
            tone: 'info',
          })
          fetchOrders()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>
          const targetId = String(updated.id || '')
          const targetIndex = orders.value.findIndex((o) => o.id === targetId)

          if (targetIndex !== -1) {
            const currentOrder = orders.value[targetIndex]
            if (currentOrder) {
              orders.value[targetIndex] = {
                ...currentOrder,
                status: (updated.status as OrderStatus) || currentOrder.status,
                total_cents:
                  typeof updated.total_cents === 'number'
                    ? updated.total_cents
                    : currentOrder.total_cents,
              }
            }
            toast.show({
              title: 'Status Diperbarui',
              message: `Pesanan #${targetId.slice(0, 8)} status kini: ${updated.status}.`,
              tone: 'secondary',
            })
          }
        },
      )
      .subscribe()
  }

  onMounted(() => {
    fetchOrders()
    setupRealtime()
  })

  onUnmounted(async () => {
    if (orderChannel) {
      await supabase.removeChannel(orderChannel)
      orderChannel = null
    }
  })

  return {
    activeStatus,
    searchQuery,
    fromDate,
    toDate,
    page,
    pageSize,
    sortKey,
    sortDirection,
    loading,
    orders,
    totalOrders,
    errorMessage,
    exporting,
    exportingFormat,
    statusTabs,
    totalPages,
    hasActiveFilters,
    fetchOrders,
    onStatusChange,
    onSearch,
    resetDateFilters,
    resetFilters,
    onSortChange,
    handleExport,
    handleExportCsv,
    prevPage,
    nextPage,
    setPage,
    setPageSize,
  }
}
