<script setup lang="ts">
interface AddressModel {
  name: string
  phone: string
  street: string
  city: string
  postal: string
  note: string
}

defineProps<{
  address: AddressModel
  isManualExpanded: boolean
}>()

const emit = defineEmits<{
  'change-address': []
  'toggle-manual': []
}>()
</script>

<template>
  <div class="p-4 rounded-xl border border-brand-accent/40 bg-brand-accent-tint/15 space-y-3">
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-display font-bold text-sm text-brand-ink">
            {{ address.name || 'Penerima' }}
          </span>
          <span v-if="address.phone" class="text-xs text-brand-muted font-medium">
            ({{ address.phone }})
          </span>
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-ink text-white"
          >
            Alamat Terpilih
          </span>
        </div>
        <p class="text-xs text-brand-ink m-0 leading-relaxed">
          {{ address.street || 'Belum ada alamat jalan' }}
        </p>
        <p v-if="address.city" class="text-[11px] text-brand-muted m-0 font-medium">
          {{ address.city }}
          <span v-if="address.postal">({{ address.postal }})</span>
        </p>
      </div>

      <UiButton
        type="button"
        variant="secondary"
        size="sm"
        class="text-xs shrink-0 cursor-pointer"
        data-testid="open-address-picker-btn"
        @click="emit('change-address')"
      >
        <i class="pi pi-sync text-[11px] mr-1" />
        Ganti Alamat
      </UiButton>
    </div>

    <div class="pt-2 border-t border-brand-hairsoft flex items-center justify-between">
      <button
        type="button"
        class="text-[11px] text-brand-muted hover:text-brand-ink underline transition-colors cursor-pointer border-0 bg-transparent p-0"
        @click="emit('toggle-manual')"
      >
        {{ isManualExpanded ? 'Tutup rincian manual' : 'Edit rincian manual untuk pesanan ini' }}
      </button>
    </div>
  </div>
</template>
