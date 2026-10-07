<script setup lang="ts">
import type { Product } from '~/types/product'
import { getProductSpecs } from '~/utils/product-specs'

const props = defineProps<{
  product: Product
}>()

const specs = computed(() => getProductSpecs(props.product))
</script>

<template>
  <UiCard :padded="true" class="space-y-4">
    <div class="flex items-center justify-between border-b border-brand-hairsoft pb-3">
      <div class="flex items-center gap-2">
        <i class="pi pi-sliders-h text-brand-ink text-sm" />
        <h3 class="font-display text-base font-bold text-brand-ink m-0">
          Spesifikasi Teknis &amp; Material
        </h3>
      </div>
      <span
        class="text-[11px] font-semibold text-brand-muted bg-brand-canvas px-2.5 py-1 rounded-full border border-brand-hair"
      >
        Standar Kurasi Resmi
      </span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
      <div
        v-for="spec in specs"
        :key="spec.label"
        class="flex items-start gap-3 p-3 rounded-field bg-brand-canvas-soft border border-brand-hairsoft hover:border-brand-hair transition-colors"
      >
        <div
          v-if="spec.icon"
          class="w-7 h-7 rounded-full bg-brand-canvas border border-brand-hair flex items-center justify-center shrink-0 text-brand-ink mt-0.5"
        >
          <i :class="spec.icon" class="text-xs" />
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-[11px] uppercase tracking-wider font-semibold text-brand-muted">
            {{ spec.label }}
          </span>
          <span class="text-xs font-bold text-brand-ink break-words mt-0.5">
            {{ spec.value }}
          </span>
        </div>
      </div>
    </div>
  </UiCard>
</template>
