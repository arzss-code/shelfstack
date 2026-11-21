<script setup lang="ts">
import { computed } from 'vue'

interface AddressModel {
  name: string
  phone: string
  street: string
  city: string
  postal: string
  note: string
}

const props = defineProps<{
  address: AddressModel
  isManualExpanded: boolean
}>()

const emit = defineEmits<{
  'change-address': []
  'toggle-manual': []
}>()

const labelInfo = computed(() => {
  const note = props.address.note || ''
  const match = note.match(/^\[(Rumah|Kantor|Apartemen|Lainnya)\]/i)
  if (match && match[1]) {
    const rawLabel = match[1]
    const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase()
    const cleanNote = note.replace(/^\[(Rumah|Kantor|Apartemen|Lainnya)\]\s*/i, '').trim()
    return {
      hasCategory: true,
      label,
      note: cleanNote,
      icon:
        label === 'Rumah'
          ? 'pi pi-home'
          : label === 'Kantor'
            ? 'pi pi-building'
            : label === 'Apartemen'
              ? 'pi pi-building-columns'
              : 'pi pi-tag',
    }
  }

  return {
    hasCategory: false,
    label: '',
    note,
    icon: 'pi pi-map-marker',
  }
})
</script>

<template>
  <div
    class="p-4 sm:p-5 rounded-xl border border-brand-hair bg-brand-canvas-soft/40 space-y-3 transition-all"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-2 min-w-0">
        <!-- Badges Strip -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <span
            v-if="labelInfo.hasCategory"
            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-brand-canvas text-brand-ink border border-brand-hair uppercase tracking-wide"
          >
            <i :class="[labelInfo.icon, 'text-[10px] text-brand-muted']" aria-hidden="true" />
            <span>{{ labelInfo.label }}</span>
          </span>

          <span
            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
          >
            <i class="pi pi-check text-[9px]" aria-hidden="true" />
            <span>Alamat Pengiriman Aktif</span>
          </span>
        </div>

        <!-- Recipient & Phone (Single mental chunk) -->
        <div class="flex items-baseline gap-1.5 flex-wrap">
          <h4 class="font-display font-bold text-sm text-brand-ink m-0 tracking-tight">
            {{ address.name || 'Penerima' }}
          </h4>
          <span v-if="address.phone" class="text-brand-faint text-xs">·</span>
          <span v-if="address.phone" class="text-xs text-brand-muted font-normal tabular-nums">
            {{ address.phone }}
          </span>
        </div>

        <!-- Address details (Street + City & Postal) -->
        <div class="text-xs space-y-0.5">
          <p class="text-xs text-brand-ink font-semibold m-0 leading-relaxed">
            {{ address.street || 'Belum ada rincian jalan' }}
          </p>
          <p v-if="address.city" class="text-xs text-brand-muted m-0 leading-normal">
            {{ address.city }}
            <span v-if="address.postal" class="text-brand-faint">·</span>
            <span v-if="address.postal">
              Kode Pos: <span class="font-medium text-brand-ink">{{ address.postal }}</span>
            </span>
          </p>
        </div>

        <!-- Courier Note (Subtle, non-competing) -->
        <div
          v-if="labelInfo.note"
          class="flex items-start gap-1.5 text-[11px] text-brand-muted pt-0.5 max-w-lg"
        >
          <i
            class="pi pi-info-circle text-[11px] text-brand-faint shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p class="m-0 leading-normal truncate">
            <span class="text-brand-faint font-medium">Catatan: </span>
            <span class="text-brand-ink font-medium">{{ labelInfo.note }}</span>
          </p>
        </div>
      </div>

      <UiButton
        type="button"
        variant="secondary"
        size="sm"
        class="text-xs shrink-0 rounded-full"
        data-testid="open-address-picker-btn"
        @click="emit('change-address')"
      >
        <i class="pi pi-sync text-[11px] mr-1.5" />
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
