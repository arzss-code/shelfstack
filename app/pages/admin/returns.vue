<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import AdminReturnMetrics from '~/components/admin/returns/AdminReturnMetrics.vue'
import { useClientTableSort } from '~/composables/useClientTableSort'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import AdminReturnDetailModal from '~/components/admin/returns/AdminReturnDetailModal.vue'
import type { ReturnRequestItem, ReturnRequestStatus } from '~~/shared/schemas/return-request'
import {
  RETURN_REASON_LABELS,
  RETURN_SOLUTION_LABELS,
  RETURN_STATUS_MAP,
} from '~~/server/utils/return-request'
import { formatRupiah } from '~/utils/format'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeoMeta({
  title: 'Kelola Komplain & Retur - Admin ShelfStack',
})

const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const returnsList = ref<ReturnRequestItem[]>([])
const metrics = ref({
  total: 0,
  requested: 0,
  approved: 0,
  item_received: 0,
  completed: 0,
  rejected: 0,
})

const activeStatusFilter = ref<string>('all')
const searchQuery = ref('')
const selectedTicket = ref<ReturnRequestItem | null>(null)
const isDetailModalOpen = ref(false)

const statusFilterTabs = [
  { value: 'all', label: 'Semua' },
  { value: 'requested', label: 'Menunggu Review' },
  { value: 'approved', label: 'Disetujui' },
  { value: 'item_received', label: 'Di Gudang' },
  { value: 'completed', label: 'Selesai' },
  { value: 'rejected', label: 'Ditolak' },
]

const returnColumns = [
  { key: 'order', label: 'Pesanan & Pemohon', ariaLabel: 'pesanan dan pemohon' },
  { key: 'reason', label: 'Alasan Kendala', ariaLabel: 'alasan kendala' },
  { key: 'solution', label: 'Opsi Solusi', ariaLabel: 'opsi solusi' },
  { key: 'status', label: 'Status Tiket', ariaLabel: 'status tiket' },
  { key: 'created_at', label: 'Tanggal Pengajuan', ariaLabel: 'tanggal pengajuan' },
] as const

const {
  sortKey,
  sortDirection,
  sortedItems: sortedReturns,
  onSortChange,
  getAriaSort,
} = useClientTableSort(returnsList, {
  order: (item) => `${item.order_number} ${item.customer_name}`,
  reason: (item) => RETURN_REASON_LABELS[item.reason_type] || item.reason_type,
  solution: (item) => (item.solution_type === 'refund' ? 'Refund' : 'Tukar Unit'),
  status: (item) => RETURN_STATUS_MAP[item.status]?.label || item.status,
  created_at: (item) => new Date(item.created_at).getTime() || 0,
})

const fetchReturns = async () => {
  isLoading.value = true
  errorMessage.value = null

  try {
    const params = new URLSearchParams()
    if (activeStatusFilter.value !== 'all') params.append('status', activeStatusFilter.value)
    if (searchQuery.value.trim()) params.append('search', searchQuery.value.trim())

    const response = await $fetch<{
      status: string
      data: {
        metrics: typeof metrics.value
        returns: ReturnRequestItem[]
      }
    }>(`/api/admin/returns?${params.toString()}`)

    if (response && response.data) {
      returnsList.value = response.data.returns
      metrics.value = response.data.metrics
    }
  } catch (err: unknown) {
    const fetchErr = err as { data?: { message?: string }; message?: string }
    errorMessage.value = fetchErr?.data?.message || fetchErr?.message || 'Gagal memuat data retur.'
  } finally {
    isLoading.value = false
  }
}

const openDetailModal = (ticket: ReturnRequestItem) => {
  selectedTicket.value = ticket
  isDetailModalOpen.value = true
}

const formatDate = (dateStr: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

watch(activeStatusFilter, () => {
  fetchReturns()
})

let searchDebounce: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    fetchReturns()
  }, 350)
})

onMounted(() => {
  fetchReturns()
})
</script>

<template>
  <div class="space-y-5 text-brand-ink">
    <AdminPageHeader
      title="Komplain & Retur"
      subtitle="Pengajuan pengembalian barang, tukar unit, dan pengembalian dana."
    >
      <template #actions>
        <UiButton
          size="sm"
          variant="outline"
          icon="pi-refresh"
          :loading="isLoading"
          @click="fetchReturns"
        >
          Muat Ulang
        </UiButton>
      </template>
    </AdminPageHeader>

    <!-- Error Alert -->
    <UiAlert v-if="errorMessage" tone="danger">
      {{ errorMessage }}
    </UiAlert>

    <!-- Stat Cards KPI -->
    <AdminReturnMetrics :metrics="metrics" />

    <!-- Filter Bar & Search -->
    <div
      class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-card border border-brand-hair bg-brand-canvas p-3 shadow-whisper"
    >
      <UiTabs
        v-model="activeStatusFilter"
        :items="statusFilterTabs"
        aria-label="Filter status retur"
      />

      <!-- Search Input -->
      <div class="w-full sm:w-64">
        <label for="admin-returns-search" class="sr-only">Cari order atau pemohon</label>
        <UiInput
          id="admin-returns-search"
          v-model="searchQuery"
          size="sm"
          type="search"
          left-icon="pi-search"
          placeholder="Cari order / nama pemohon..."
          clearable
        />
      </div>
    </div>

    <!-- Data Table -->
    <div
      class="overflow-hidden rounded-card border border-brand-hair bg-brand-canvas shadow-whisper"
    >
      <div
        tabindex="0"
        role="region"
        aria-label="Tabel pengajuan komplain dan retur"
        class="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink"
      >
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              class="border-b border-brand-hair bg-brand-canvas-soft text-[11px] font-semibold text-brand-muted uppercase tracking-wider"
            >
              <th
                v-for="col in returnColumns"
                :key="col.key"
                scope="col"
                class="py-2.5 px-3.5 whitespace-nowrap"
                :aria-sort="getAriaSort(col.key)"
              >
                <UiSortHeader
                  :sort-key="col.key"
                  :label="col.label"
                  :active-key="sortKey"
                  :direction="sortDirection"
                  @sort="onSortChange"
                >
                  {{ col.label }}
                </UiSortHeader>
              </th>
              <th scope="col" class="py-2.5 px-3.5 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft">
            <tr v-if="isLoading">
              <td colspan="6" class="py-12 text-center text-brand-muted">
                <i class="pi pi-spinner pi-spin text-lg" aria-hidden="true" />
                <p class="mt-2 text-xs">Memuat daftar pengajuan retur...</p>
              </td>
            </tr>

            <tr v-else-if="sortedReturns.length === 0">
              <td colspan="6" class="py-12 text-center text-brand-muted">
                <i class="pi pi-inbox text-2xl" aria-hidden="true" />
                <p class="mt-2 font-medium text-xs">Tidak ada pengajuan retur yang cocok.</p>
              </td>
            </tr>

            <tr
              v-for="item in sortedReturns"
              v-else
              :key="item.id"
              class="hover:bg-brand-canvas-soft/60 transition-colors"
            >
              <td class="py-2.5 px-3.5">
                <span class="block font-bold text-brand-ink">{{ item.order_number }}</span>
                <span class="block text-[11px] text-brand-muted">{{ item.customer_name }}</span>
              </td>
              <td class="py-2.5 px-3.5">
                <span class="font-medium text-brand-ink">
                  {{ RETURN_REASON_LABELS[item.reason_type] }}
                </span>
              </td>
              <td class="py-2.5 px-3.5">
                <span
                  class="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold"
                  :class="
                    item.solution_type === 'refund'
                      ? 'border-brand-accent-edge bg-brand-accent-tint text-brand-accent-text'
                      : 'border-brand-success-edge bg-brand-success-tint text-brand-success-text'
                  "
                >
                  <i
                    :class="item.solution_type === 'refund' ? 'pi-wallet' : 'pi-replay'"
                    class="pi text-[10px]"
                    aria-hidden="true"
                  />
                  <span>{{ item.solution_type === 'refund' ? 'Refund' : 'Tukar Unit' }}</span>
                </span>
              </td>
              <td class="py-2.5 px-3.5">
                <UiBadge
                  :label="RETURN_STATUS_MAP[item.status].label"
                  :variant="RETURN_STATUS_MAP[item.status].tone"
                />
              </td>
              <td class="py-2.5 px-3.5 text-brand-muted whitespace-nowrap">
                {{ formatDate(item.created_at) }}
              </td>
              <td class="py-2.5 px-3.5 text-right">
                <UiButton size="xs" variant="outline" @click="openDetailModal(item)">
                  Tinjau
                </UiButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Review Modal -->
    <AdminReturnDetailModal
      v-model="isDetailModalOpen"
      :ticket="selectedTicket"
      @reviewed="fetchReturns"
    />
  </div>
</template>
