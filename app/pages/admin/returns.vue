<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
  { id: 'all', label: 'Semua' },
  { id: 'requested', label: 'Menunggu Review' },
  { id: 'approved', label: 'Disetujui' },
  { id: 'item_received', label: 'Di Gudang' },
  { id: 'completed', label: 'Selesai' },
  { id: 'rejected', label: 'Ditolak' },
]

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
  <div class="space-y-6 pb-12 text-brand-ink">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-brand-ink">
          Kelola Komplain & Retur Produk
        </h1>
        <p class="mt-0.5 text-xs text-brand-muted">
          Pusat otorisasi pengembalian barang (*RMA*) dan penyelesaian garansi pelanggan.
        </p>
      </div>

      <UiButton
        size="sm"
        variant="outline"
        icon="pi-refresh"
        :loading="isLoading"
        @click="fetchReturns"
      >
        Segarkan Data
      </UiButton>
    </div>

    <!-- Error Alert -->
    <UiAlert v-if="errorMessage" tone="danger">
      {{ errorMessage }}
    </UiAlert>

    <!-- Stat Cards KPI -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
        <span class="text-[11px] font-medium text-brand-muted">Menunggu Review</span>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-2xl font-bold text-brand-warning-text">{{ metrics.requested }}</span>
          <span class="text-[11px] text-brand-muted">tiket</span>
        </div>
      </div>

      <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
        <span class="text-[11px] font-medium text-brand-muted">Disetujui (Menunggu Kiriman)</span>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-2xl font-bold text-brand-accent-text">{{ metrics.approved }}</span>
          <span class="text-[11px] text-brand-muted">paket</span>
        </div>
      </div>

      <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
        <span class="text-[11px] font-medium text-brand-muted">Barang Tiba di Gudang</span>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-2xl font-bold text-brand-ink">{{ metrics.item_received }}</span>
          <span class="text-[11px] text-brand-muted">inspeksi</span>
        </div>
      </div>

      <div class="rounded-card border border-brand-hair bg-brand-canvas p-4 shadow-whisper">
        <span class="text-[11px] font-medium text-brand-muted">Selesai Dituntaskan</span>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-2xl font-bold text-brand-success-text">{{ metrics.completed }}</span>
          <span class="text-[11px] text-brand-muted">klaim</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar & Search -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <!-- Status Tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <button
          v-for="tab in statusFilterTabs"
          :key="tab.id"
          type="button"
          class="rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[36px]"
          :class="
            activeStatusFilter === tab.id
              ? 'bg-brand-ink text-brand-onink shadow-whisper'
              : 'text-brand-muted hover:bg-brand-canvas-soft hover:text-brand-ink'
          "
          @click="activeStatusFilter = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Search Input -->
      <div class="w-full sm:w-64">
        <UiInput v-model="searchQuery" placeholder="Cari order / nama pemohon..." clearable />
      </div>
    </div>

    <!-- Data Table -->
    <div
      class="overflow-hidden rounded-card border border-brand-hair bg-brand-canvas shadow-whisper"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              class="border-b border-brand-hair bg-brand-canvas-soft text-[11px] font-bold text-brand-muted uppercase tracking-wider"
            >
              <th class="py-3 px-4">Pesanan & Pemohon</th>
              <th class="py-3 px-4">Alasan Kendala</th>
              <th class="py-3 px-4">Opsi Solusi</th>
              <th class="py-3 px-4">Status Tiket</th>
              <th class="py-3 px-4">Tanggal Pengajuan</th>
              <th class="py-3 px-4 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft">
            <tr v-if="isLoading">
              <td colspan="6" class="py-12 text-center text-brand-muted">
                <i class="pi pi-spinner pi-spin text-lg" />
                <p class="mt-2 text-xs">Memuat daftar pengajuan retur...</p>
              </td>
            </tr>

            <tr v-else-if="returnsList.length === 0">
              <td colspan="6" class="py-12 text-center text-brand-muted">
                <i class="pi pi-inbox text-2xl" />
                <p class="mt-2 font-medium text-xs">Tidak ada pengajuan retur yang cocok.</p>
              </td>
            </tr>

            <tr
              v-for="item in returnsList"
              v-else
              :key="item.id"
              class="hover:bg-brand-canvas-soft/60 transition-colors"
            >
              <td class="py-3.5 px-4">
                <span class="block font-bold text-brand-ink">{{ item.order_number }}</span>
                <span class="block text-[11px] text-brand-muted">{{ item.customer_name }}</span>
              </td>
              <td class="py-3.5 px-4">
                <span class="font-medium text-brand-ink">
                  {{ RETURN_REASON_LABELS[item.reason_type] }}
                </span>
              </td>
              <td class="py-3.5 px-4">
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
                  />
                  <span>{{ item.solution_type === 'refund' ? 'Refund' : 'Tukar Unit' }}</span>
                </span>
              </td>
              <td class="py-3.5 px-4">
                <UiBadge
                  :label="RETURN_STATUS_MAP[item.status].label"
                  :variant="RETURN_STATUS_MAP[item.status].tone"
                />
              </td>
              <td class="py-3.5 px-4 text-brand-muted whitespace-nowrap">
                {{ formatDate(item.created_at) }}
              </td>
              <td class="py-3.5 px-4 text-right">
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
