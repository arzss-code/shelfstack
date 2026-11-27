<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import AdminReturnMetrics from '~/components/admin/returns/AdminReturnMetrics.vue'
import AdminReturnTable from '~/components/admin/returns/AdminReturnTable.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiAlert from '~/components/ui/UiAlert.vue'
import AdminReturnDetailModal from '~/components/admin/returns/AdminReturnDetailModal.vue'
import type { ReturnRequestItem } from '~~/shared/schemas/return-request'

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
    <AdminReturnTable :returns="returnsList" :loading="isLoading" @review="openDetailModal" />

    <!-- Review Modal -->
    <AdminReturnDetailModal
      v-model="isDetailModalOpen"
      :ticket="selectedTicket"
      @reviewed="fetchReturns"
    />
  </div>
</template>
