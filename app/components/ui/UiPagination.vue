<script setup lang="ts">
import { computed } from 'vue'
import UiSelect from './UiSelect.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    totalPages: number
    totalCount?: number
    pageSize?: number
    loading?: boolean
    itemName?: string
    siblingCount?: number
    compact?: boolean
    showPageSize?: boolean
    pageSizeOptions?: number[]
  }>(),
  {
    modelValue: 1,
    totalCount: undefined,
    pageSize: 12,
    loading: false,
    itemName: 'produk',
    siblingCount: 1,
    compact: false,
    showPageSize: undefined,
    pageSizeOptions: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [page: number]
  change: [page: number]
  'update:pageSize': [size: number]
  pageSizeChange: [size: number]
}>()

const currentPage = computed(() => {
  const page = props.modelValue ?? 1
  return Math.max(1, Math.min(page, props.totalPages))
})

const isFirstPage = computed(() => currentPage.value <= 1)
const isLastPage = computed(() => currentPage.value >= props.totalPages)
const isPageSizeVisible = computed(
  () => (props.showPageSize ?? props.compact) && (props.totalCount ?? 0) > 0,
)

const resolvedPageSizeOptions = computed(() => {
  const base = props.pageSizeOptions ?? (props.pageSize === 15 ? [10, 15, 25, 50] : [12, 25, 50])
  const merged = Array.from(new Set([...base, props.pageSize])).sort((a, b) => a - b)
  return merged.map((size) => ({ value: String(size), label: String(size) }))
})

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
  const leftSibling = Math.max(current - props.siblingCount, 1)
  const rightSibling = Math.min(current + props.siblingCount, total)
  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < total - 1

  items.push({ type: 'page', page: 1, isCurrent: current === 1, key: 'page-1' })

  if (showLeftEllipsis) {
    items.push({ type: 'ellipsis', key: 'ellipsis-left' })
  } else if (leftSibling === 2) {
    items.push({ type: 'page', page: 2, isCurrent: current === 2, key: 'page-2' })
  }

  const startMid = showLeftEllipsis ? leftSibling : 2
  const endMid = showRightEllipsis ? rightSibling : total - 1
  for (let i = startMid; i <= endMid; i++) {
    if (i !== 1 && i !== total) {
      items.push({ type: 'page', page: i, isCurrent: current === i, key: `page-${i}` })
    }
  }

  if (showRightEllipsis) {
    items.push({ type: 'ellipsis', key: 'ellipsis-right' })
  } else if (rightSibling === total - 1 && total > 2) {
    items.push({
      type: 'page',
      page: total - 1,
      isCurrent: current === total - 1,
      key: `page-${total - 1}`,
    })
  }

  if (total > 1) {
    items.push({ type: 'page', page: total, isCurrent: current === total, key: `page-${total}` })
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

const onPageSizeSelect = (rawValue: string) => {
  const next = Number(rawValue)
  if (!Number.isFinite(next) || next < 1 || next === props.pageSize) return
  emit('update:pageSize', next)
  emit('pageSizeChange', next)
}
</script>

<template>
  <nav
    role="navigation"
    aria-label="Paginasi Halaman"
    :aria-busy="loading"
    :class="
      compact
        ? 'ui-pagination flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-brand-hair bg-brand-canvas-soft/60 px-4 py-2.5'
        : 'ui-pagination flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-brand-hairsoft pt-6'
    "
    data-testid="ui-pagination"
  >
    <div
      class="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-brand-muted m-0 order-2 sm:order-1 select-none"
    >
      <span>
        <template v-if="totalCount != null && totalCount > 0">
          Menampilkan <span class="font-semibold text-brand-ink">{{ itemRangeText }}</span> dari
          <span class="font-semibold text-brand-ink">{{ totalCount }}</span> {{ itemName }}
        </template>
        <template v-else>
          Halaman <span class="font-semibold text-brand-ink">{{ currentPage }}</span> dari
          <span class="font-semibold text-brand-ink">{{ totalPages }}</span>
        </template>
      </span>

      <div v-if="isPageSizeVisible" class="inline-flex items-center gap-1.5">
        <span class="text-[11px] text-brand-muted">Tampilkan</span>
        <UiSelect
          :model-value="String(pageSize)"
          :options="resolvedPageSizeOptions"
          size="xs"
          aria-label="Jumlah data per halaman"
          data-testid="pagination-page-size"
          @change="onPageSizeSelect"
        />
      </div>
    </div>

    <div
      class="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2 flex-wrap justify-center"
      data-testid="pagination-controls"
    >
      <button
        type="button"
        :class="
          compact
            ? 'inline-flex h-7 items-center gap-1 px-2.5 rounded-full text-[11px] font-semibold border border-brand-hair bg-brand-canvas text-brand-ink hover:bg-brand-canvas-soft hover:border-brand-ink/40 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0'
            : 'inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full text-xs font-semibold border border-brand-hair bg-brand-canvas text-brand-ink hover:bg-brand-canvas-soft hover:border-brand-ink/40 active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none disabled:hover:bg-brand-canvas cursor-pointer select-none focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0'
        "
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

      <div class="flex items-center gap-1 sm:gap-1.5">
        <template v-for="item in paginationItems" :key="item.key">
          <span
            v-if="item.type === 'ellipsis'"
            :class="
              compact
                ? 'w-6 h-7 flex items-center justify-center text-[11px] text-brand-muted select-none'
                : 'w-7 h-7 sm:w-9 sm:h-9 flex items-center justify-center text-xs text-brand-muted select-none'
            "
            aria-hidden="true"
            data-testid="pagination-ellipsis"
          >
            ...
          </span>

          <button
            v-else
            type="button"
            class="rounded-full font-semibold flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0"
            :class="[
              compact
                ? 'min-w-[28px] h-7 px-1 text-[11px]'
                : 'w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm',
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

      <button
        type="button"
        :class="
          compact
            ? 'inline-flex h-7 items-center gap-1 px-2.5 rounded-full text-[11px] font-semibold border border-brand-hair bg-brand-canvas text-brand-ink hover:bg-brand-canvas-soft hover:border-brand-ink/40 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0'
            : 'inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-full text-xs font-semibold border border-brand-hair bg-brand-canvas text-brand-ink hover:bg-brand-canvas-soft hover:border-brand-ink/40 active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none disabled:hover:bg-brand-canvas cursor-pointer select-none focus-visible:outline focus-visible:outline-[1.5px] focus-visible:outline-brand-ink focus-visible:outline-offset-0'
        "
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
