<script setup lang="ts">
import type { UserAddress } from '~~/shared/schemas/address'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'

defineProps<{
  address: UserAddress
  loading?: boolean
  isSettingDefault?: boolean
}>()

const emit = defineEmits<{
  edit: [address: UserAddress]
  delete: [address: UserAddress]
  setDefault: [address: UserAddress]
}>()
</script>

<template>
  <div
    class="relative rounded-card border bg-brand-canvas p-5 sm:p-6 transition-all duration-200 shadow-whisper hover:shadow-floating flex flex-col justify-between"
    :class="[
      address.is_default
        ? 'border-brand-ink/40 ring-1 ring-brand-ink/10 bg-gradient-to-b from-brand-canvas to-brand-canvas-soft/30'
        : 'border-brand-hair hover:border-brand-ink/20',
    ]"
  >
    <!-- Card Top Content -->
    <div>
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex items-center gap-2 flex-wrap min-w-0">
          <h3 class="text-sm font-bold text-brand-ink m-0 tracking-tight truncate">
            {{ address.name }}
          </h3>
          <UiBadge v-if="address.is_default" label="Alamat Utama" variant="success" />
        </div>
        <div class="flex items-center text-xs text-brand-muted shrink-0 tabular-nums">
          <i class="pi pi-phone text-[10px] text-brand-faint mr-1" aria-hidden="true" />
          <span>{{ address.phone }}</span>
        </div>
      </div>

      <div class="text-xs text-brand-muted leading-relaxed space-y-1.5 mb-5">
        <div class="flex items-start gap-2">
          <i
            class="pi pi-map-pin text-[12px] text-brand-faint shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div class="min-w-0">
            <p class="m-0 text-brand-ink font-semibold">
              {{ address.street }}
            </p>
            <p class="m-0 text-brand-muted mt-0.5">
              {{ address.city }}
            </p>
            <p class="m-0 text-[11px] font-mono text-brand-faint mt-0.5">
              Kode Pos: {{ address.postal }}
            </p>
          </div>
        </div>

        <div
          v-if="address.note"
          class="mt-2.5 p-2.5 rounded-field bg-brand-canvas-soft border border-brand-hair text-[11px] text-brand-muted flex items-start gap-1.5"
        >
          <i
            class="pi pi-info-circle text-[11px] text-brand-faint shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span class="italic leading-normal">Catatan: {{ address.note }}</span>
        </div>
      </div>
    </div>

    <!-- Card Action Buttons -->
    <div
      class="pt-3.5 border-t border-brand-hair flex items-center justify-between gap-2 flex-wrap mt-auto"
    >
      <div>
        <UiButton
          v-if="!address.is_default"
          variant="ghost"
          size="xs"
          :loading="isSettingDefault"
          :disabled="loading"
          class="text-xs font-semibold text-brand-accent hover:text-brand-accent-hover p-0 active:scale-95"
          @click="emit('setDefault', address)"
        >
          Jadikan Utama
        </UiButton>
        <div v-else class="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
          <i class="pi pi-check-circle text-xs text-emerald-600" aria-hidden="true" />
          <span>Pengiriman Default</span>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UiButton
          variant="secondary"
          size="xs"
          :disabled="loading"
          icon="pi pi-pencil"
          class="active:scale-95"
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
          class="active:scale-95"
          @click="emit('delete', address)"
        >
          Hapus
        </UiButton>
      </div>
    </div>
  </div>
</template>
