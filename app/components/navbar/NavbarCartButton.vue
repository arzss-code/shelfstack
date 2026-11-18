<script setup lang="ts">
defineProps<{
  totalItems: number
  formattedTotalPrice: string
}>()

const emit = defineEmits<{
  open: []
}>()
</script>

<template>
  <UiTooltip position="bottom" align="end">
    <button
      type="button"
      class="relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-brand-ink hover:bg-brand-canvas-soft transition-colors active:scale-95 cursor-pointer"
      :aria-label="
        totalItems > 0 ? `Buka Keranjang Belanja (${totalItems} item)` : 'Buka Keranjang Belanja'
      "
      @click="emit('open')"
    >
      <i class="pi pi-shopping-bag text-base sm:text-lg text-brand-ink" />
      <span
        v-if="totalItems > 0"
        class="absolute top-1 right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-brand-ink text-brand-onink text-[10px] font-bold flex items-center justify-center ring-2 ring-brand-canvas tabular-nums shadow-xs leading-none"
        aria-hidden="true"
      >
        {{ totalItems > 99 ? '99+' : totalItems }}
      </span>
    </button>

    <template #content>
      <div v-if="totalItems > 0" class="space-y-1 min-w-[190px]">
        <div class="flex items-center justify-between gap-3 text-[11px] font-medium text-white/80">
          <span>Subtotal ({{ totalItems }} item)</span>
        </div>
        <div class="flex items-baseline justify-between gap-3">
          <span class="font-display text-sm font-bold text-white tabular-nums tracking-tight">
            {{ formattedTotalPrice }}
          </span>
          <span class="text-[10px] text-brand-accent font-semibold flex items-center gap-0.5">
            Buka <i class="pi pi-arrow-right text-[8px]" />
          </span>
        </div>
      </div>
      <div v-else class="text-[11px] text-white/80 flex items-center gap-2 py-0.5 min-w-[170px]">
        <i class="pi pi-shopping-bag text-xs text-white/60" />
        <span>Keranjang belanja kosong</span>
      </div>
    </template>
  </UiTooltip>
</template>
