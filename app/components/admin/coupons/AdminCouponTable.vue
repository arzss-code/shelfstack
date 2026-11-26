<script setup lang="ts">
import UiBadge from '~/components/ui/UiBadge.vue'
import UiIconButton from '~/components/ui/UiIconButton.vue'
import UiEmptyState from '~/components/ui/UiEmptyState.vue'
import UiPagination from '~/components/ui/UiPagination.vue'
import { useClientPagination } from '~/composables/useClientPagination'
import { useClientTableSort } from '~/composables/useClientTableSort'

export interface AdminCoupon {
  id: string
  code: string
  name: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  formatted_discount: string
  max_discount_cents: number | null
  formatted_max_discount: string
  min_purchase_cents: number
  formatted_min_purchase: string
  usage_limit: number | null
  usage_count: number
  user_limit: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  is_expired: boolean
  coin_cost: number | null
  formatted_coin_cost: string | null
  created_at: string
}

const props = defineProps<{
  coupons: AdminCoupon[]
  loading: boolean
}>()

const emit = defineEmits<{
  toggleStatus: [coupon: AdminCoupon]
  edit: [coupon: AdminCoupon]
  delete: [coupon: AdminCoupon]
  viewUsages: [coupon: AdminCoupon]
  create: []
}>()

const couponColumns = [
  { key: 'code', label: 'Kode Voucher', ariaLabel: 'kode voucher' },
  { key: 'name', label: 'Nama & Tipe', ariaLabel: 'nama voucher' },
  { key: 'discount', label: 'Nilai Diskon', ariaLabel: 'nilai diskon' },
  { key: 'min_purchase', label: 'Min. Belanja', ariaLabel: 'minimal belanja' },
  { key: 'coin_cost', label: 'Biaya Koin', ariaLabel: 'biaya koin' },
  { key: 'usage', label: 'Kuota Pakai', ariaLabel: 'kuota pemakaian' },
  { key: 'status', label: 'Status', ariaLabel: 'status voucher' },
] as const

const {
  sortKey,
  sortDirection,
  sortedItems: sortedCoupons,
  onSortChange,
  getAriaSort,
} = useClientTableSort(() => props.coupons, {
  code: (c) => c.code,
  name: (c) => c.name,
  discount: (c) => c.discount_value,
  min_purchase: (c) => c.min_purchase_cents,
  coin_cost: (c) => c.coin_cost ?? 0,
  usage: (c) => c.usage_count,
  status: (c) => (c.is_expired ? 'Kedaluwarsa' : c.is_active ? 'Aktif' : 'Nonaktif'),
})

const {
  page,
  pageSize,
  totalCount,
  totalPages,
  paginatedItems: paginatedCoupons,
} = useClientPagination(sortedCoupons, 12)
</script>

<template>
  <div class="overflow-hidden rounded-card border border-brand-hair bg-brand-canvas shadow-whisper">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-3 p-10 text-center">
      <i class="pi pi-spinner animate-spin text-2xl text-brand-muted" aria-hidden="true" />
      <p class="text-xs text-brand-muted">Memuat data voucher promosi...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="coupons.length === 0" class="p-6">
      <UiEmptyState
        icon="pi-ticket"
        title="Tidak ada voucher yang cocok"
        description="Coba ubah kata kunci filter status atau buat voucher promosi baru."
        action-label="Buat Voucher Baru"
        @action="emit('create')"
      />
    </div>

    <!-- Table View -->
    <div
      v-else
      tabindex="0"
      role="region"
      aria-label="Tabel daftar voucher promosi"
      class="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink"
    >
      <table class="w-full text-left text-xs border-collapse" role="table">
        <thead
          class="border-b border-brand-hair bg-brand-canvas-soft text-[11px] font-semibold uppercase tracking-wider text-brand-muted"
        >
          <tr>
            <th
              v-for="col in couponColumns"
              :key="col.key"
              scope="col"
              class="px-3.5 py-2.5 whitespace-nowrap"
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
            <th scope="col" class="px-3.5 py-2.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-brand-hairsoft">
          <tr
            v-for="coupon in paginatedCoupons"
            :key="coupon.id"
            class="transition-colors hover:bg-brand-canvas-soft/50"
          >
            <!-- Kode -->
            <td class="px-3.5 py-2.5">
              <span
                class="rounded-lg border border-dashed border-brand-hair bg-brand-canvas-soft px-2.5 py-1 font-mono font-bold text-brand-ink"
              >
                {{ coupon.code }}
              </span>
            </td>

            <!-- Nama & Tipe -->
            <td class="px-3.5 py-2.5">
              <div class="space-y-1">
                <p class="m-0 font-semibold text-brand-ink">
                  {{ coupon.name }}
                </p>
                <div class="flex flex-wrap items-center gap-1">
                  <UiBadge
                    :label="coupon.discount_type === 'percentage' ? 'Persen' : 'Nominal'"
                    :variant="coupon.discount_type === 'percentage' ? 'info' : 'default'"
                  />
                  <UiBadge v-if="coupon.coin_cost" label="Voucher Koin" variant="warning" />
                </div>
              </div>
            </td>

            <!-- Nilai Diskon -->
            <td class="px-3.5 py-2.5 font-bold tabular text-brand-ink">
              {{ coupon.formatted_discount }}
            </td>

            <!-- Min Belanja & Pagu -->
            <td class="px-3.5 py-2.5 text-brand-muted">
              <div class="tabular">Min: {{ coupon.formatted_min_purchase }}</div>
              <div class="text-[11px] tabular">Pagu: {{ coupon.formatted_max_discount }}</div>
            </td>

            <!-- Biaya Koin Loyalty -->
            <td class="px-3.5 py-2.5">
              <span v-if="coupon.coin_cost" class="font-medium tabular text-brand-warning-text">
                {{ coupon.formatted_coin_cost }}
              </span>
              <span v-else class="text-brand-faint">-</span>
            </td>

            <!-- Kuota Penggunaan -->
            <td class="px-3.5 py-2.5">
              <div class="max-w-[120px] space-y-1">
                <div class="flex items-center justify-between text-[11px] tabular text-brand-muted">
                  <span>{{ coupon.usage_count }}</span>
                  <span>/ {{ coupon.usage_limit != null ? coupon.usage_limit : '∞' }}</span>
                </div>
                <div
                  v-if="coupon.usage_limit"
                  class="h-1.5 w-full overflow-hidden rounded-full bg-brand-hair"
                >
                  <div
                    class="h-full bg-brand-ink transition-all"
                    :style="{
                      width: `${Math.min(100, (coupon.usage_count / coupon.usage_limit) * 100)}%`,
                    }"
                  />
                </div>
              </div>
            </td>

            <!-- Status Semantik -->
            <td class="px-3.5 py-2.5">
              <UiBadge
                :label="coupon.is_expired ? 'Kedaluwarsa' : coupon.is_active ? 'Aktif' : 'Nonaktif'"
                :variant="coupon.is_expired ? 'danger' : coupon.is_active ? 'success' : 'default'"
              />
            </td>

            <!-- Aksi -->
            <td class="px-3.5 py-2.5 text-right">
              <div class="inline-flex items-center gap-1">
                <UiIconButton
                  icon="pi-history"
                  label="Lihat riwayat pemakaian"
                  variant="neutral"
                  size="sm"
                  @click="emit('viewUsages', coupon)"
                />

                <UiIconButton
                  :icon="coupon.is_active ? 'pi-eye-slash' : 'pi-eye'"
                  :label="coupon.is_active ? 'Nonaktifkan voucher' : 'Aktifkan voucher'"
                  variant="neutral"
                  size="sm"
                  @click="emit('toggleStatus', coupon)"
                />

                <UiIconButton
                  icon="pi-pencil"
                  label="Ubah voucher"
                  variant="neutral"
                  size="sm"
                  @click="emit('edit', coupon)"
                />

                <UiIconButton
                  icon="pi-trash"
                  label="Hapus voucher"
                  variant="danger"
                  size="sm"
                  @click="emit('delete', coupon)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <UiPagination
      v-if="!loading && coupons.length > 0"
      v-model="page"
      :total-pages="totalPages"
      :total-count="totalCount"
      :page-size="pageSize"
      :loading="loading"
      item-name="voucher"
      compact
    />
  </div>
</template>
