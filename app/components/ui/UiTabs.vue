<script setup lang="ts">
import { computed, useId } from 'vue'

export interface UiTabItem {
  value: string
  label: string
  /** Angka kecil di dalam pil, misalnya jumlah stok kritis. */
  count?: number
  /** Nada hitungan saat pil aktif: netral atau bahaya. */
  countTone?: 'neutral' | 'danger'
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    items: UiTabItem[]
    /** Label untuk announce oleh screen reader. */
    ariaLabel?: string
    /** Membentang penuh 100% lebar kontainer secara proporsional. */
    fullWidth?: boolean
    /** Prefiks ID panel terkait bila tab mengontrol tabpanel eksplisit di DOM. */
    panelIdPrefix?: string
  }>(),
  { ariaLabel: '', fullWidth: false, panelIdPrefix: '' },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const uid = useId()
const tablistId = `ui-tablist-${uid}`

const activeIndex = computed(() =>
  Math.max(
    0,
    props.items.findIndex((item) => item.value === props.modelValue),
  ),
)

const select = (value: string) => {
  if (value !== props.modelValue) emit('update:modelValue', value)
}

/** Arrow keys memindah pilihan sesuai urutan tab, Home/End ke ujung. */
const onKeydown = (event: KeyboardEvent) => {
  const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End']
  if (!keys.includes(event.key)) return
  event.preventDefault()

  const last = props.items.length - 1
  let next = activeIndex.value
  if (event.key === 'ArrowRight') next = activeIndex.value >= last ? 0 : activeIndex.value + 1
  if (event.key === 'ArrowLeft') next = activeIndex.value <= 0 ? last : activeIndex.value - 1
  if (event.key === 'Home') next = 0
  if (event.key === 'End') next = last

  const target = props.items[next]
  if (target) select(target.value)
}
</script>

<template>
  <div
    :id="tablistId"
    role="tablist"
    :aria-label="ariaLabel || undefined"
    class="rounded-full border border-brand-hair bg-brand-canvas-soft p-1 transition-all"
    :class="[
      fullWidth
        ? 'flex w-full items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth'
        : 'inline-flex max-w-full flex-wrap items-center gap-1',
    ]"
    style="scrollbar-width: none; -ms-overflow-style: none"
    @keydown="onKeydown"
  >
    <button
      v-for="(item, index) in items"
      :id="`${tablistId}-tab-${item.value}`"
      :key="item.value"
      type="button"
      role="tab"
      :aria-selected="item.value === modelValue"
      :aria-controls="panelIdPrefix ? `${panelIdPrefix}-${item.value}` : undefined"
      :tabindex="index === activeIndex ? 0 : -1"
      class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap select-none cursor-pointer border-0"
      :class="[
        fullWidth ? 'shrink-0 sm:flex-1 sm:justify-center' : '',
        item.value === modelValue
          ? 'bg-brand-ink text-brand-onink shadow-whisper'
          : 'text-brand-muted hover:bg-brand-canvas hover:text-brand-ink',
      ]"
      @click="select(item.value)"
    >
      <span>{{ item.label }}</span>
      <span
        v-if="item.count !== undefined && item.count > 0"
        class="rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums"
        :class="
          item.value === modelValue
            ? item.countTone === 'danger'
              ? 'bg-rose-500 text-white'
              : 'bg-brand-onink/20 text-brand-onink'
            : item.countTone === 'danger'
              ? 'bg-rose-100 text-rose-700'
              : 'bg-brand-hairsoft text-brand-muted'
        "
      >
        {{ item.count }}
      </span>
    </button>
  </div>
</template>
