import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AdminOrderRow } from '~/features/orders/components/AdminOrderTable.vue'
import type { Database } from '~/types/database.types'
import type { OrderStatus } from '~/types/order'
import { useUiToast } from '~/composables/useUiToast'

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
  const pageSize = 15
  const sortKey = ref<string | null>(null)
  const sortDirection = ref<'desc' | 'asc' | null>(null)

  const sortParam = computed(() => {
    if (!sortKey.value || !sortDirection.value) return ''
    const col = sortKey.value === 'id' ? 'created_at' : sortKey.value
    return `${col}_${sortDirection.value}`
  })

  const loading = ref(true)
  const orders = ref<AdminOrderRow[]>([])
  const totalOrders = ref(0)
  const errorMessage = ref('')
  const exporting = ref(false)
  let orderChannel: RealtimeChannel | null = null

  const statusTabs = [
    { label: 'Semua', value: '' },
    { label: 'Menunggu', value: 'pending' },
    { label: 'Lunas', value: 'paid' },
    { label: 'Dikirim', value: 'shipped' },
    { label: 'Selesai', value: 'completed' },
    { label: 'Dibatalkan', value: 'cancelled' },
  ]

  const fetchOrders = async () => {
    loading.value = true
    errorMessage.value = ''
    const from = (page.value - 1) * pageSize
    const to = from + pageSize - 1
    try {
      const params: Record<string, string | number> = { from, to }
      if (activeStatus.value) params.status = activeStatus.value
      if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
      if (sortParam.value) params.sort = sortParam.value

      const res = await $fetch<{
        status: string
        data: { orders: AdminOrderRow[]; total: number }
      }>('/api/admin/orders', { params })
      orders.value = res.data.orders
      totalOrders.value = res.data.total
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string } }
      errorMessage.value = fetchErr.data?.message || 'Gagal memuat daftar pesanan admin.'
    } finally {
      loading.value = false
    }
  }

  const onStatusChange = (val: string) => {
    activeStatus.value = val
    page.value = 1
    router.push({ query: val ? { status: val } : {} })
    fetchOrders()
  }

  const onSearch = () => {
    page.value = 1
    fetchOrders()
  }

  const onSortChange = (payload: { key: string | null; direction: 'desc' | 'asc' | null }) => {
    sortKey.value = payload.key
    sortDirection.value = payload.direction
    page.value = 1
    fetchOrders()
  }

  const handleExportCsv = async () => {
    exporting.value = true
    try {
      const params: Record<string, string> = {}
      if (activeStatus.value) params.status = activeStatus.value
      if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
      if (fromDate.value) params.from = fromDate.value
      if (toDate.value) params.to = toDate.value
      if (sortParam.value) params.sort = sortParam.value

      const res = await $fetch<string>('/api/admin/orders/export', { params, responseType: 'text' })
      const blob = new Blob([res], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `laporan-pesanan-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.show({
        title: 'Ekspor Berhasil',
        message: 'Laporan CSV pesanan berhasil diunduh.',
        tone: 'success',
      })
    } catch {
      toast.show({
        title: 'Gagal Ekspor',
        message: 'Gagal mengunduh laporan CSV pesanan.',
        tone: 'error',
      })
    } finally {
      exporting.value = false
    }
  }

  const totalPages = computed(() => Math.ceil(totalOrders.value / pageSize) || 1)

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
    statusTabs,
    totalPages,
    fetchOrders,
    onStatusChange,
    onSearch,
    onSortChange,
    handleExportCsv,
    prevPage,
    nextPage,
  }
}
