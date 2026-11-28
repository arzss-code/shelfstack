import { computed, onMounted, reactive, ref } from 'vue'
import type { ContactMessageStatus } from '~~/shared/schemas/contact'
import { useAdminDebouncedSearch } from '~/composables/useAdminDebouncedSearch'

export interface ContactInboxItem {
  id: string
  ticket_code: string
  name: string
  email: string
  category: string
  order_number: string | null
  message: string
  status: ContactMessageStatus
  admin_notes: string | null
  resolved_at: string | null
  created_at: string
}

export const CONTACT_STATUS_FILTER_OPTIONS: Array<{
  value: 'all' | ContactMessageStatus
  label: string
}> = [
  { value: 'all', label: 'Semua' },
  { value: 'open', label: 'Baru' },
  { value: 'in_progress', label: 'Diproses' },
  { value: 'resolved', label: 'Selesai' },
]

export const CONTACT_STATUS_SELECT_OPTIONS = [
  { value: 'open', label: 'Baru (Open)' },
  { value: 'in_progress', label: 'Sedang Diproses' },
  { value: 'resolved', label: 'Selesai Ditindaklanjuti' },
]

export function getContactStatusBadge(status: ContactMessageStatus): {
  label: string
  variant: 'warning' | 'info' | 'success'
} {
  if (status === 'resolved') return { label: 'Selesai', variant: 'success' }
  if (status === 'in_progress') return { label: 'Diproses', variant: 'info' }
  return { label: 'Baru', variant: 'warning' }
}

export function formatContactDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function useAdminContacts() {
  const toast = useUiToast()

  const items = ref<ContactInboxItem[]>([])
  const selectedId = ref<string | null>(null)
  const statusFilter = ref<'all' | ContactMessageStatus>('all')
  const searchQuery = ref('')
  const loading = ref(true)
  const saving = ref(false)
  const errorMsg = ref<string | null>(null)

  const editState = reactive<{
    status: ContactMessageStatus
    admin_notes: string
  }>({
    status: 'open',
    admin_notes: '',
  })

  const selectedItem = computed(() => items.value.find((i) => i.id === selectedId.value) || null)
  const hasActiveFilters = computed(() =>
    Boolean(searchQuery.value.trim() || statusFilter.value !== 'all'),
  )

  function selectContact(item: ContactInboxItem) {
    selectedId.value = item.id
    editState.status = item.status
    editState.admin_notes = item.admin_notes || ''
  }

  const { runAbortable, triggerNow, clearQuery } = useAdminDebouncedSearch(searchQuery, () => {
    void fetchContacts()
  })

  async function fetchContacts() {
    errorMsg.value = null
    await runAbortable(
      loading,
      async ({ signal, isCurrent }) => {
        const res = await $fetch<{
          data: { items: ContactInboxItem[] }
        }>('/api/admin/contacts', {
          params: {
            status: statusFilter.value,
            q: searchQuery.value.trim() || undefined,
          },
          signal,
        })
        if (!isCurrent()) return
        items.value = res.data?.items || []
        if (items.value.length > 0 && !selectedItem.value) {
          selectContact(items.value[0]!)
        }
      },
      (err) => {
        const e = err as { data?: { message?: string }; message?: string }
        errorMsg.value = e.data?.message || e.message || 'Gagal memuat inbox pesan kontak.'
      },
    )
  }

  async function saveUpdate() {
    if (!selectedItem.value) return
    saving.value = true
    try {
      const res = await $fetch<{ data: ContactInboxItem }>(
        `/api/admin/contacts/${selectedItem.value.id}`,
        {
          method: 'PATCH',
          body: {
            status: editState.status,
            admin_notes: editState.admin_notes.trim() || null,
          },
        },
      )
      const idx = items.value.findIndex((i) => i.id === selectedItem.value?.id)
      if (idx !== -1 && res.data) {
        items.value[idx] = res.data
      }
      toast.show({
        title: 'Tersimpan',
        message: 'Status pesan kontak diperbarui.',
        tone: 'success',
      })
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string }
      toast.show({
        title: 'Gagal Memperbarui',
        message: e.data?.message || e.message || 'Gagal memperbarui status pesan kontak.',
        tone: 'error',
      })
    } finally {
      saving.value = false
    }
  }

  function applyStatusFilter(value: 'all' | ContactMessageStatus) {
    statusFilter.value = value
    void fetchContacts()
  }

  function resetFilters() {
    clearQuery()
    statusFilter.value = 'all'
    void fetchContacts()
  }

  onMounted(() => {
    void fetchContacts()
  })

  return {
    items,
    statusFilter,
    searchQuery,
    loading,
    saving,
    errorMsg,
    editState,
    selectedItem,
    hasActiveFilters,
    selectContact,
    fetchContacts,
    saveUpdate,
    applyStatusFilter,
    resetFilters,
    triggerSearchNow: triggerNow,
  }
}
