<script setup lang="ts">
import type { UserAddress } from '~~/shared/schemas/address'

defineProps<{
  address: UserAddress
  isSelected: boolean
}>()

const emit = defineEmits<{
  select: [addr: UserAddress]
  setDefault: [addr: UserAddress, event: Event]
}>()
</script>

<template>
  <div
    role="radio"
    :aria-checked="isSelected"
    tabindex="0"
    :data-testid="`modal-address-card-${address.id}`"
    :class="[
      'relative p-4 rounded-card border transition-all text-left cursor-pointer flex flex-col justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-brand-ink/20',
      isSelected
        ? 'border-brand-accent bg-brand-accent-tint/30 ring-2 ring-brand-accent shadow-whisper'
        : 'border-brand-hair bg-white hover:border-brand-ink/40 hover:shadow-whisper',
    ]"
    @click="emit('select', address)"
    @keydown.enter.prevent="emit('select', address)"
    @keydown.space.prevent="emit('select', address)"
  >
    <div class="space-y-1.5">
      <!-- Top Row: Name, Phone & Default Badge -->
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <span class="font-display font-bold text-xs sm:text-sm text-brand-ink block truncate">
            {{ address.name }}
          </span>
          <span class="text-[11px] text-brand-muted block">
            {{ address.phone }}
          </span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <span
            v-if="address.is_default"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-success-tint text-brand-success-text border border-brand-success-edge"
          >
            Utama
          </span>
          <button
            v-else
            type="button"
            class="text-[10px] text-brand-muted hover:text-brand-ink hover:underline transition-colors border-0 bg-transparent cursor-pointer p-0"
            title="Jadikan Alamat Utama"
            @click="(e) => emit('setDefault', address, e)"
          >
            Set Utama
          </button>
        </div>
      </div>

      <!-- Full Street Address -->
      <p class="text-xs text-brand-ink m-0 leading-relaxed line-clamp-2">
        {{ address.street }}
      </p>
      <p class="text-[11px] text-brand-muted m-0 font-medium">
        {{ address.city }}, {{ address.postal }}
      </p>

      <!-- Note if present -->
      <div
        v-if="address.note"
        class="text-[11px] text-brand-muted/90 flex items-center gap-1 pt-1 border-t border-brand-hairsoft truncate"
      >
        <i class="pi pi-info-circle text-[10px] shrink-0" />
        <span class="truncate">{{ address.note }}</span>
      </div>
    </div>

    <!-- Bottom Row: Selection Indicator & Action -->
    <div class="pt-2 border-t border-brand-hairsoft flex items-center justify-between gap-2">
      <div
        v-if="isSelected"
        class="flex items-center gap-1.5 text-xs text-brand-accent font-semibold"
      >
        <i class="pi pi-check-circle text-sm" />
        <span>Alamat Terpilih</span>
      </div>
      <span v-else class="text-[11px] text-brand-muted">Klik untuk memilih</span>

      <UiButton
        v-if="!isSelected"
        variant="secondary"
        size="sm"
        class="text-[11px] py-1 px-3"
        @click.stop="emit('select', address)"
      >
        Pilih Alamat
      </UiButton>
    </div>
  </div>
</template>
