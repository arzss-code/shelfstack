<script setup lang="ts">
import type { AdminReviewItem } from '~~/shared/schemas/review'
import { useClientTableSort } from '~/composables/useClientTableSort'
import UiPagination from '~/components/ui/UiPagination.vue'

const props = defineProps<{
  reviews: AdminReviewItem[]
  loading: boolean
  mutatingId: string | null
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
  }
}>()

const emit = defineEmits<{
  toggleStatus: [review: AdminReviewItem]
  pageChange: [page: number]
  pageSizeChange: [size: number]
}>()

const reviewColumns = [
  { key: 'product', label: 'Produk', ariaLabel: 'produk', thClass: 'min-w-[200px]' },
  { key: 'reviewer', label: 'Pelanggan', ariaLabel: 'pelanggan', thClass: 'min-w-[150px]' },
  { key: 'rating', label: 'Rating', ariaLabel: 'rating', thClass: 'min-w-[120px]' },
  { key: 'review_text', label: 'Isi Ulasan', ariaLabel: 'isi ulasan', thClass: 'min-w-[240px]' },
  { key: 'created_at', label: 'Tanggal', ariaLabel: 'tanggal', thClass: 'min-w-[110px]' },
  { key: 'status', label: 'Status', ariaLabel: 'status moderasi', thClass: 'min-w-[120px]' },
] as const

const {
  sortKey,
  sortDirection,
  sortedItems: sortedReviews,
  onSortChange,
  getAriaSort,
} = useClientTableSort(() => props.reviews, {
  product: (r) => r.product_name,
  reviewer: (r) => r.reviewer_name,
  rating: (r) => r.rating,
  review_text: (r) => r.review_text,
  created_at: (r) => new Date(r.created_at).getTime() || 0,
  status: (r) => (r.deleted_at ? 'Disembunyikan' : 'Aktif'),
})

const formatDate = (isoStr: string): string => {
  try {
    const d = new Date(isoStr)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return isoStr
  }
}
</script>

<template>
  <div
    class="rounded-card border border-brand-hair bg-brand-canvas shadow-whisper overflow-hidden flex flex-col"
    data-testid="admin-reviews-table-wrapper"
  >
    <!-- Table Header / Overflow Container -->
    <div
      tabindex="0"
      role="region"
      aria-label="Tabel moderasi ulasan produk"
      class="overflow-x-auto min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink"
    >
      <table class="w-full text-left text-xs border-collapse">
        <thead
          class="bg-brand-canvas-soft border-b border-brand-hair text-brand-muted uppercase tracking-wider text-[11px] font-semibold"
        >
          <tr>
            <th
              v-for="col in reviewColumns"
              :key="col.key"
              scope="col"
              class="py-2.5 px-3.5"
              :class="col.thClass"
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
            <th scope="col" class="py-2.5 px-3.5 text-right min-w-[120px]">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-brand-hairsoft text-brand-ink">
          <!-- Loading State -->
          <tr v-if="loading">
            <td colspan="7" class="py-12 text-center text-brand-muted">
              <div class="flex items-center justify-center gap-2">
                <i class="pi pi-spin pi-spinner text-base text-brand-accent" />
                <span>Memuat data ulasan pelanggan...</span>
              </div>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-else-if="sortedReviews.length === 0">
            <td colspan="7" class="py-16 text-center text-brand-muted">
              <div class="max-w-sm mx-auto space-y-2">
                <div
                  class="w-10 h-10 rounded-full bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-brand-faint mx-auto"
                >
                  <i class="pi pi-comments text-lg" />
                </div>
                <p class="font-display text-sm font-bold text-brand-ink m-0">
                  Tidak Ada Ulasan Ditemukan
                </p>
                <p class="text-caption text-brand-muted m-0">
                  Tidak ada ulasan produk yang sesuai dengan kriteria filter saat ini.
                </p>
              </div>
            </td>
          </tr>

          <!-- Row List -->
          <tr
            v-for="review in sortedReviews"
            v-else
            :key="review.id"
            class="hover:bg-brand-canvas-soft/40 transition-colors"
            data-testid="admin-review-row"
          >
            <!-- Product -->
            <td class="py-3 px-4">
              <div class="flex items-center gap-2.5">
                <img
                  v-if="review.product_image_url"
                  :src="review.product_image_url"
                  :alt="review.product_name"
                  class="w-9 h-9 rounded object-cover border border-brand-hair shrink-0"
                  loading="lazy"
                />
                <div
                  v-else
                  class="w-9 h-9 rounded bg-brand-canvas-soft border border-brand-hair flex items-center justify-center text-brand-muted shrink-0"
                >
                  <i class="pi pi-box text-xs" />
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-brand-ink m-0 truncate max-w-[180px]">
                    {{ review.product_name }}
                  </p>
                  <NuxtLink
                    :to="`/product/${review.product_id}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-[11px] text-brand-accent-text hover:underline inline-flex items-center gap-0.5 mt-0.5"
                  >
                    <span>Lihat di Toko</span>
                    <i class="pi pi-external-link text-[9px]" />
                  </NuxtLink>
                </div>
              </div>
            </td>

            <!-- Reviewer -->
            <td class="py-3 px-4">
              <div>
                <p class="font-semibold text-brand-ink m-0">{{ review.reviewer_name }}</p>
                <p
                  v-if="review.reviewer_email"
                  class="text-caption text-brand-muted m-0 truncate max-w-[140px]"
                >
                  {{ review.reviewer_email }}
                </p>
              </div>
            </td>

            <!-- Rating -->
            <td class="py-3 px-4">
              <div class="flex items-center gap-1 text-brand-warning">
                <span class="font-bold text-xs tabular text-brand-ink">{{ review.rating }}</span>
                <i
                  v-for="star in 5"
                  :key="star"
                  class="text-[10px]"
                  :class="star <= review.rating ? 'pi pi-star-fill' : 'pi pi-star text-brand-hair'"
                />
              </div>
            </td>

            <!-- Review Text -->
            <td class="py-3 px-4">
              <p
                class="m-0 text-caption leading-relaxed line-clamp-2 max-w-[320px] text-brand-muted italic"
              >
                "{{ review.review_text }}"
              </p>
            </td>

            <!-- Date -->
            <td class="py-3 px-4 text-caption text-brand-muted whitespace-nowrap">
              {{ formatDate(review.created_at) }}
            </td>

            <!-- Status -->
            <td class="py-3 px-4">
              <span
                v-if="!review.deleted_at"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-micro font-bold bg-brand-success-tint text-brand-success-text border border-brand-success-edge uppercase tracking-wider"
              >
                <i class="pi pi-check text-[9px]" />
                <span>Aktif</span>
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-micro font-bold bg-brand-danger-tint text-brand-danger-text border border-brand-danger-edge uppercase tracking-wider"
              >
                <i class="pi pi-eye-slash text-[9px]" />
                <span>Disembunyikan</span>
              </span>
            </td>

            <!-- Moderation Action Button -->
            <td class="py-3 px-4 text-right">
              <button
                type="button"
                :disabled="mutatingId === review.id"
                class="px-3 py-1.5 rounded-full text-xs font-semibold transition-all border inline-flex items-center gap-1 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
                :class="[
                  review.deleted_at
                    ? 'bg-brand-success-tint text-brand-success-text border-brand-success-edge hover:bg-brand-success hover:text-white'
                    : 'bg-brand-canvas-soft text-brand-danger-text border-brand-hair hover:bg-brand-danger hover:text-white hover:border-brand-danger',
                ]"
                @click="emit('toggleStatus', review)"
              >
                <i v-if="mutatingId === review.id" class="pi pi-spin pi-spinner text-xs" />
                <i
                  v-else
                  :class="['pi text-[10px]', review.deleted_at ? 'pi-eye' : 'pi-eye-slash']"
                />
                <span>{{ review.deleted_at ? 'Pulihkan' : 'Sembunyikan' }}</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Footer -->
    <UiPagination
      v-if="reviews.length > 0"
      :model-value="pagination.page"
      :total-pages="pagination.totalPages"
      :total-count="pagination.totalCount"
      :page-size="pagination.limit"
      :loading="loading"
      item-name="ulasan"
      compact
      @change="emit('pageChange', $event)"
      @page-size-change="emit('pageSizeChange', $event)"
    />
  </div>
</template>
