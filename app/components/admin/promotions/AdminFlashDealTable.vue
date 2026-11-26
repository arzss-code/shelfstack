<script setup lang="ts">
import UiBadge from '~/components/ui/UiBadge.vue'
import UiIconButton from '~/components/ui/UiIconButton.vue'
import UiPagination from '~/components/ui/UiPagination.vue'
import UiSortHeader from '~/components/ui/UiSortHeader.vue'
import type { FlashDealAdminRow } from '~/components/admin/promotions/AdminFlashDealModal.vue'
import { useClientPagination } from '~/composables/useClientPagination'
import { useClientTableSort } from '~/composables/useClientTableSort'
import { formatRupiah } from '~/utils/format'

const props = defineProps<{
  deals: FlashDealAdminRow[]
  loading?: boolean
}>()

const emit = defineEmits<{
  edit: [deal: FlashDealAdminRow]
  archive: [deal: FlashDealAdminRow]
}>()

function getDealStatusBadge(deal: FlashDealAdminRow): {
  label: string
  variant: 'success' | 'info' | 'warning' | 'default'
} {
  if (!deal.is_active) return { label: 'Nonaktif', variant: 'default' }
  const now = Date.now()
  const start = new Date(deal.starts_at).getTime()
  const end = new Date(deal.ends_at).getTime()
  if (now < start) return { label: 'Terjadwal', variant: 'info' }
  if (now > end || deal.claimed >= deal.quota) return { label: 'Berakhir', variant: 'warning' }
  return { label: 'Berlangsung', variant: 'success' }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const promoColumns = [
  { key: 'product', label: 'Produk', ariaLabel: 'produk', align: 'left' as const },
  { key: 'discount', label: 'Diskon', ariaLabel: 'persentase diskon', align: 'center' as const },
  { key: 'promo_price', label: 'Harga Promo', ariaLabel: 'harga promo', align: 'right' as const },
  { key: 'claimed', label: 'Kuota Klaim', ariaLabel: 'kuota klaim', align: 'center' as const },
  { key: 'starts_at', label: 'Jadwal Promo', ariaLabel: 'jadwal promo', align: 'left' as const },
  { key: 'status', label: 'Status', ariaLabel: 'status promo', align: 'left' as const },
]

const {
  sortKey,
  sortDirection,
  sortedItems: sortedDeals,
  onSortChange,
  getAriaSort,
} = useClientTableSort(() => props.deals, {
  product: (d) => d.products?.name || `Produk #${d.product_id}`,
  discount: (d) => d.discount_percentage,
  promo_price: (d) => d.promo_price_cents,
  claimed: (d) => d.claimed,
  starts_at: (d) => new Date(d.starts_at).getTime() || 0,
  status: (d) => getDealStatusBadge(d).label,
})

const {
  page,
  pageSize,
  totalCount,
  totalPages,
  paginatedItems: paginatedDeals,
} = useClientPagination(sortedDeals, 12)
</script>

<template>
  <div class="overflow-hidden rounded-card border border-brand-hair bg-brand-canvas shadow-whisper">
    <div
      tabindex="0"
      role="region"
      aria-label="Tabel daftar kampanye flash sale"
      class="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink"
    >
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr
            class="border-b border-brand-hair bg-brand-canvas-soft text-[11px] font-semibold uppercase tracking-wider text-brand-muted"
          >
            <th
              v-for="col in promoColumns"
              :key="col.key"
              scope="col"
              class="py-2.5 px-3.5 whitespace-nowrap"
              :class="
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
              "
              :aria-sort="getAriaSort(col.key)"
            >
              <UiSortHeader
                :sort-key="col.key"
                :label="col.label"
                :align="col.align"
                :active-key="sortKey"
                :direction="sortDirection"
                @sort="onSortChange"
              >
                {{ col.label }}
              </UiSortHeader>
            </th>
            <th scope="col" class="py-2.5 px-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-brand-hairsoft text-brand-ink">
          <tr
            v-for="deal in paginatedDeals"
            :key="deal.id"
            class="hover:bg-brand-canvas-soft/50 transition-colors"
          >
            <td class="py-2.5 px-3.5 font-semibold text-brand-ink max-w-[220px] truncate">
              {{ deal.products?.name || `Produk #${deal.product_id}` }}
            </td>
            <td class="py-2.5 px-3.5 text-center whitespace-nowrap">
              <UiBadge :label="`-${deal.discount_percentage}%`" variant="danger" />
            </td>
            <td
              class="py-2.5 px-3.5 text-right font-display font-bold tabular-nums whitespace-nowrap"
            >
              {{ formatRupiah(deal.promo_price_cents / 100) }}
            </td>
            <td class="py-2.5 px-3.5 text-center text-brand-muted tabular-nums whitespace-nowrap">
              {{ deal.claimed }} / {{ deal.quota }}
            </td>
            <td class="py-2.5 px-3.5 text-brand-muted tabular-nums whitespace-nowrap">
              {{ formatDateTime(deal.starts_at) }} - {{ formatDateTime(deal.ends_at) }}
            </td>
            <td class="py-2.5 px-3.5 whitespace-nowrap">
              <UiBadge
                :label="getDealStatusBadge(deal).label"
                :variant="getDealStatusBadge(deal).variant"
              />
            </td>
            <td class="py-2.5 px-3.5 text-right whitespace-nowrap">
              <div class="inline-flex items-center gap-1">
                <UiIconButton
                  icon="pi-pencil"
                  label="Ubah flash sale"
                  size="sm"
                  @click="emit('edit', deal)"
                />
                <UiIconButton
                  icon="pi-trash"
                  label="Hapus flash sale"
                  variant="danger"
                  size="sm"
                  @click="emit('archive', deal)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <UiPagination
      v-if="deals.length > 0"
      v-model="page"
      v-model:page-size="pageSize"
      :total-pages="totalPages"
      :total-count="totalCount"
      :loading="Boolean(loading)"
      item-name="kampanye"
      compact
    />
  </div>
</template>
