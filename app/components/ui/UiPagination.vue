<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Halaman aktif saat ini (1-based index) */
    modelValue?: number
    /** Total jumlah halaman */
    totalPages: number
    /** Total item keseluruhan untuk ringkasan data */
    totalCount?: number
    /** Jumlah item per halaman */
    pageSize?: number
    /** Status loading asynchronous */
    loading?: boolean
    /** Label nama entitas dalam ringkasan (default: 'produk') */
    itemName?: string
    /** Jumlah nomor halaman tetangga kiri/kanan yang tampil */
    siblingCount?: number
  }>(),
  {
    modelValue: 1,
    totalCount: undefined,
    pageSize: 12,
    loading: false,
    itemName: 'produk',
    siblingCount: 1,
  },
)

const emit = defineEmits<{
  'update:modelValue': [page: number]
  change: [page: number]
}>()

const currentPage = computed(() => {
  const page = props.modelValue ?? 1
  return Math.max(1, Math.min(page, props.totalPages))
})

const isFirstPage = computed(() => currentPage.value <= 1)
const isLastPage = computed(() => currentPage.value >= props.totalPages)

type PageItem =
  | { type: 'page'; page: number; isCurrent: boolean; key: string }
  | { type: 'ellipsis'; key: string }

const paginationItems = computed<PageItem[]>(() => {
  const total = props.totalPages
  const current = currentPage.value

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => ({
      type: 'page',
      page: i + 1,
      isCurrent: i + 1 === current,
      key: `page-${i + 1}`,
    }))
  }

  const items: PageItem[] = []
  const leftSiblingIndex = Math.max(current - props.siblingCount, 1)
  const rightSiblingIndex = Math.min(current + props.siblingCount, total)

  const showLeftEllipsis = leftSiblingIndex > 2
  const showRightEllipsis = rightSiblingIndex < total - 1

  // Always show first page
  items.push({
    type: 'page',
    page: 1,
    isCurrent: current === 1,
    key: 'page-1',
  })

  // Left ellipsis or page 2
  if (showLeftEllipsis) {
    items.push({ type: 'ellipsis', key: 'ellipsis-left' })
  } else if (leftSiblingIndex === 2) {
    items.push({
      type: 'page',
      page: 2,
      isCurrent: current === 2,
      key: 'page-2',
    })
  }

  // Middle pages
  const middleStart = showLeftEllipsis ? leftSiblingIndex : 2
  const middleEnd = showRightEllipsis ? rightSiblingIndex : total - 1

  for (let i = middleStart; i <= middleEnd; i++) {
    if (i !== 1 && i !== total) {
      items.push({
        type: 'page',
        page: i,
        isCurrent: current === i,
        key: `page-${i}`,
      })
    }
  }

  // Right ellipsis or penultimate page
  if (showRightEllipsis) {
    items.push({ type: 'ellipsis', key: 'ellipsis-right' })
  } else if (rightSiblingIndex === total - 1 && total > 2) {
    items.push({
      type: 'page',
      page: total - 1,
      isCurrent: current === total - 1,
      key: `page-${total - 1}`,
    })
  }

  // Always show last page
  if (total > 1) {
    items.push({
      type: 'page',
      page: total,
      isCurrent: current === total,
      key: `page-${total}`,
    })
  }

  return items
})

const itemRangeText = computed(() => {
  if (props.totalCount == null || props.totalCount === 0) {
    return `Halaman ${currentPage.value} dari ${props.totalPages}`
  }
  const start = (currentPage.value - 1) * props.pageSize + 1
  const end = Math.min(currentPage.value * props.pageSize, props.totalCount)
  return `${start} - ${end}`
})

const goToPage = (page: number) => {
  if (page < 1 || page > props.totalPages || page === currentPage.value || props.loading) return
  emit('update:modelValue', page)
  emit('change', page)
}
</script>

<template>
  <nav
    role="navigation"
    aria-label="Paginasi Halaman"
    :aria-busy="loading"
    class="ui-pagination flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-brand-hairsoft pt-6"
    data-testid="ui-pagination"
  >
    <!-- Ringkasan Data (Left on desktop, bottom on mobile) -->
    <div
      class="text-xs text-brand-muted m-0 order-2 sm:order-1 text-center sm:text-left select-none"
    >
      <template v-if="totalCount != null && totalCount > 0">
        Menampilkan <span class="font-semibold text-brand-ink">{{ itemRangeText }}</span> dari
        <span class="font-semibold text-brand-ink">{{ totalCount }}</span> {{ itemName }}
      </template>
      <template v-else>
        Halaman <span class="font-semibold text-brand-ink">{{ currentPage }}</span> dari
        <span class="font-semibold text-brand-ink">{{ totalPages }}</span>
      </template>
    </div>

    <!-- Kontrol Navigasi Halaman -->
    <div
      class="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2 flex-wrap justify-center"
      data-testid="pagination-controls"
    >
      <!-- Tombol Sebelumnya -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full text-xs font-semibold border border-brand-hair bg-brand-canvas text-brand-ink hover:bg-brand-canvas-soft hover:border-brand-ink/40 active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none disabled:hover:bg-brand-canvas cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:outline-none"
        :disabled="isFirstPage || loading"
        aria-label="Halaman Sebelumnya"
        data-testid="pagination-prev"
        @click="goToPage(currentPage - 1)"
      >
        <i
          :class="loading ? 'pi pi-spin pi-spinner text-[10px]' : 'pi pi-chevron-left text-[10px]'"
          aria-hidden="true"
        />
        <span class="hidden sm:inline">Sebelumnya</span>
      </button>

      <!-- Nomor-Nomor Halaman & Ellipsis -->
      <div class="flex items-center gap-1 sm:gap-1.5">
        <template v-for="item in paginationItems" :key="item.key">
          <!-- Separator Ellipsis -->
          <span
            v-if="item.type === 'ellipsis'"
            class="w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-xs text-brand-muted select-none"
            aria-hidden="true"
            data-testid="pagination-ellipsis"
          >
            ...
          </span>

          <!-- Tombol Nomor Halaman -->
          <button
            v-else
            type="button"
            class="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:outline-none"
            :class="[
              item.page === currentPage
                ? 'bg-brand-ink text-brand-onink shadow-whisper'
                : 'bg-transparent text-brand-muted hover:text-brand-ink hover:bg-brand-canvas-soft border border-transparent hover:border-brand-hair',
              loading ? 'pointer-events-none opacity-60' : '',
            ]"
            :aria-label="`Buka halaman ${item.page}`"
            :aria-current="item.page === currentPage ? 'page' : undefined"
            :data-testid="`pagination-page-${item.page}`"
            @click="goToPage(item.page)"
          >
            {{ item.page }}
          </button>
        </template>
      </div>

      <!-- Tombol Selanjutnya -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full text-xs font-semibold border border-brand-hair bg-brand-canvas text-brand-ink hover:bg-brand-canvas-soft hover:border-brand-ink/40 active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none disabled:hover:bg-brand-canvas cursor-pointer select-none focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:outline-none"
        :disabled="isLastPage || loading"
        aria-label="Halaman Selanjutnya"
        data-testid="pagination-next"
        @click="goToPage(currentPage + 1)"
      >
        <span class="hidden sm:inline">Selanjutnya</span>
        <i
          :class="loading ? 'pi pi-spin pi-spinner text-[10px]' : 'pi pi-chevron-right text-[10px]'"
          aria-hidden="true"
        />
      </button>
    </div>
  </nav>
</template>
