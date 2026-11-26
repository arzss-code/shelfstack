<script setup lang="ts">
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiPagination from '~/components/ui/UiPagination.vue'
import UiSortHeader from '~/components/ui/UiSortHeader.vue'
import { useClientPagination } from '~/composables/useClientPagination'
import { useClientTableSort } from '~/composables/useClientTableSort'
import { RETURN_REASON_LABELS, RETURN_STATUS_MAP } from '~~/server/utils/return-request'
import type { ReturnRequestItem } from '~~/shared/schemas/return-request'

const props = defineProps<{
  returns: ReturnRequestItem[]
  loading: boolean
}>()

const emit = defineEmits<{
  review: [ticket: ReturnRequestItem]
}>()

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
} = useClientTableSort(() => props.returns, {
  order: (item) => `${item.order_number} ${item.customer_name}`,
  reason: (item) => RETURN_REASON_LABELS[item.reason_type] || item.reason_type,
  solution: (item) => (item.solution_type === 'refund' ? 'Refund' : 'Tukar Unit'),
  status: (item) => RETURN_STATUS_MAP[item.status]?.label || item.status,
  created_at: (item) => new Date(item.created_at).getTime() || 0,
})

const {
  page,
  pageSize,
  totalCount,
  totalPages,
  paginatedItems: paginatedReturns,
} = useClientPagination(sortedReturns, 12)

const formatDate = (dateStr: string) => {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}
</script>

<template>
  <div class="overflow-hidden rounded-card border border-brand-hair bg-brand-canvas shadow-whisper">
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
          <tr v-if="loading">
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
            v-for="item in paginatedReturns"
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
              <UiButton size="xs" variant="outline" @click="emit('review', item)">
                Tinjau
              </UiButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <UiPagination
      v-if="!loading && returns.length > 0"
      v-model="page"
      v-model:page-size="pageSize"
      :total-pages="totalPages"
      :total-count="totalCount"
      :loading="loading"
      item-name="komplain"
      compact
    />
  </div>
</template>
