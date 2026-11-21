<script setup lang="ts">
import type { FaqItem } from '~/data/faqs'
import UiBadge from '~/components/ui/UiBadge.vue'

defineProps<{
  item: FaqItem
  isOpen: boolean
}>()

defineEmits<{
  toggle: [id: string]
}>()

const getBadgeVariant = (
  category: string,
): 'default' | 'info' | 'warning' | 'success' | 'danger' => {
  switch (category) {
    case 'pembayaran':
      return 'info'
    case 'pengiriman':
      return 'warning'
    case 'garansi':
      return 'success'
    case 'pengembalian':
      return 'danger'
    case 'pemesanan':
    default:
      return 'default'
  }
}
</script>

<template>
  <article
    class="bg-brand-canvas border border-brand-hair rounded-card overflow-hidden transition-colors shadow-whisper"
    :class="{ 'border-brand-ink/40': isOpen }"
    data-testid="faq-item"
    :data-category="item.category"
    role="listitem"
  >
    <button
      :id="`faq-btn-${item.id}`"
      type="button"
      class="w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4 cursor-pointer bg-transparent border-0 focus-visible:ring-2 focus-visible:ring-brand-ink focus-visible:outline-none transition-colors select-none"
      :aria-expanded="isOpen"
      :aria-controls="`faq-panel-${item.id}`"
      data-testid="faq-toggle-button"
      @click="$emit('toggle', item.id)"
    >
      <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-left">
        <span class="self-start sm:self-center">
          <UiBadge :label="item.categoryLabel" :variant="getBadgeVariant(item.category)" />
        </span>
        <h2 class="font-display font-semibold text-brand-ink text-sm sm:text-base m-0 leading-snug">
          {{ item.question }}
        </h2>
      </div>
      <span
        class="w-7 h-7 rounded-full bg-brand-canvas-soft text-brand-muted flex items-center justify-center shrink-0 transition-transform duration-200"
        :class="{ 'rotate-180 bg-brand-ink text-white': isOpen }"
        aria-hidden="true"
      >
        <i class="pi pi-chevron-down text-xs" />
      </span>
    </button>

    <div
      v-show="isOpen"
      :id="`faq-panel-${item.id}`"
      role="region"
      :aria-labelledby="`faq-btn-${item.id}`"
      class="px-5 pb-5 sm:px-6 sm:pb-6 text-xs sm:text-sm text-brand-ink-soft leading-relaxed border-t border-brand-hair/60 pt-3"
      data-testid="faq-answer-panel"
    >
      <p class="m-0 leading-relaxed">{{ item.answer }}</p>
      <div v-if="item.actionLink" class="mt-3.5 pt-2 border-t border-brand-hair/40">
        <NuxtLink
          :to="item.actionLink.to"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink hover:underline no-underline"
        >
          <span>{{ item.actionLink.text }}</span>
          <i class="pi pi-arrow-right text-[10px]" aria-hidden="true" />
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
