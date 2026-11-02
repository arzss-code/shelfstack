<script setup lang="ts">
import type { UserAddress } from '~~/shared/schemas/address'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'

defineProps<{
  address: UserAddress
  loading?: boolean
}>()

const emit = defineEmits<{
  edit: [address: UserAddress]
  delete: [address: UserAddress]
  setDefault: [address: UserAddress]
}>()
</script>

<template>
  <div
    class="relative rounded-card border bg-brand-canvas p-5 transition-all duration-200 shadow-whisper hover:shadow-floating flex flex-col justify-between"
    :class="[
      address.is_default
        ? 'border-brand-ink/40 ring-1 ring-brand-ink/10'
        : 'border-brand-hair hover:border-brand-ink/20',
    ]"
  >
    <!-- Card Top Content -->
    <div>
      <div class="flex items-start justify-between gap-3 mb-2.5">
        <div class="flex items-center gap-2 flex-wrap">
          <h3 class="text-sm font-bold text-brand-ink m-0 tracking-tight">
            {{ address.name }}
          </h3>
          <UiBadge v-if="address.is_default" label="Alamat Utama" variant="success" />
        </div>
        <span class="text-xs font-mono text-brand-muted shrink-0 tabular-nums">
          {{ address.phone }}
        </span>
      </div>

      <div class="text-xs text-brand-muted leading-relaxed space-y-1 mb-4">
        <p class="m-0 text-brand-ink font-medium">
          {{ address.street }}
        </p>
        <p class="m-0">
          {{ address.city }}
        </p>
        <p class="m-0 font-mono text-brand-faint">Kode Pos: {{ address.postal }}</p>
        <p
          v-if="address.note"
          class="m-0 pt-1 text-[11px] text-brand-muted italic flex items-center gap-1.5"
        >
          <i class="pi pi-info-circle text-[10px]" />
          <span>Catatan: {{ address.note }}</span>
        </p>
      </div>
    </div>

    <!-- Card Action Buttons -->
    <div
      class="pt-3 border-t border-brand-hair flex items-center justify-between gap-2 flex-wrap mt-auto"
    >
      <div>
        <UiButton
          v-if="!address.is_default"
          variant="ghost"
          size="xs"
          :disabled="loading"
          class="text-xs font-semibold text-brand-accent hover:text-brand-accent-hover p-0"
          @click="emit('setDefault', address)"
        >
          Jadikan Utama
        </UiButton>
        <span v-else class="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
          <i class="pi pi-check text-[10px]" />
          <span>Pengiriman default</span>
        </span>
      </div>

      <div class="flex items-center gap-2">
        <UiButton
          variant="secondary"
          size="xs"
          :disabled="loading"
          icon="pi pi-pencil"
          @click="emit('edit', address)"
        >
          Ubah
        </UiButton>
        <UiButton
          variant="danger"
          size="xs"
          :disabled="loading"
          icon="pi pi-trash"
          aria-label="Hapus alamat"
          @click="emit('delete', address)"
        >
          Hapus
        </UiButton>
      </div>
    </div>
  </div>
</template>
