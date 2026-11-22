<script setup lang="ts">
interface Props {
  variant?: 'default' | 'inverse' | 'mark-only'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return {
        svg: 'w-6 h-6',
        text: 'text-sm font-bold tracking-tight',
        gap: 'gap-2',
      }
    case 'lg':
      return {
        svg: 'w-9 h-9',
        text: 'text-xl font-bold tracking-tight',
        gap: 'gap-3',
      }
    case 'md':
    default:
      return {
        svg: 'w-7 h-7 sm:w-8 sm:h-8',
        text: 'text-base sm:text-lg font-bold tracking-tight',
        gap: 'gap-2.5',
      }
  }
})
</script>

<template>
  <div class="inline-flex items-center select-none" :class="sizeClasses.gap">
    <!-- ShelfStack Insignia Emblem -->
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="shrink-0 transition-transform duration-200 group-hover:scale-105"
      :class="sizeClasses.svg"
      aria-hidden="true"
    >
      <!-- Base container tile -->
      <rect
        x="2"
        y="2"
        width="24"
        height="24"
        rx="7"
        :fill="variant === 'inverse' ? '#ffffff' : 'var(--brand-ink, #141414)'"
      />
      <!-- Shelf tier 1 (top) -->
      <rect
        x="7"
        y="7"
        width="14"
        height="3"
        rx="1.5"
        :fill="variant === 'inverse' ? '#141414' : 'var(--brand-onink, #ffffff)'"
      />
      <!-- Shelf tier 2 (mid) -->
      <rect
        x="7"
        y="12.5"
        width="14"
        height="3"
        rx="1.5"
        :fill="variant === 'inverse' ? '#141414' : 'var(--brand-onink, #ffffff)'"
      />
      <!-- Shelf tier 3 (bottom accent slot) -->
      <rect x="7" y="18" width="9" height="3" rx="1.5" fill="var(--brand-accent, #0066ff)" />
    </svg>

    <!-- Wordmark -->
    <span
      v-if="variant !== 'mark-only'"
      class="font-display leading-none"
      :class="[sizeClasses.text, variant === 'inverse' ? 'text-white' : 'text-brand-ink']"
    >
      ShelfStack
    </span>
  </div>
</template>
