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
    label: 'Alamat',
    note,
    icon: 'pi pi-map-marker',
  }
})
</script>

<template>
  <div
    class="p-4 sm:p-5 rounded-card border border-brand-ink/30 bg-brand-canvas-soft/40 shadow-whisper space-y-3 transition-all"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1.5 min-w-0">
        <!-- Badges Strip (matching menu daftar alamat) -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <span
            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-brand-ink border border-brand-hair uppercase tracking-wide"
          >
            <i :class="[labelInfo.icon, 'text-[10px] text-brand-muted']" aria-hidden="true" />
            <span>{{ labelInfo.label }}</span>
          </span>

          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-ink text-white"
          >
            Alamat Pengiriman Aktif
          </span>
        </div>

        <!-- Recipient Header -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-display font-bold text-sm text-brand-ink">
            {{ address.name || 'Penerima' }}
          </span>
          <span
            v-if="address.phone"
            class="text-xs text-brand-muted font-medium tabular-nums flex items-center gap-1"
          >
            <i class="pi pi-phone text-[10px] text-brand-faint" aria-hidden="true" />
            {{ address.phone }}
          </span>
        </div>

        <!-- Address details -->
        <div class="text-xs text-brand-muted leading-relaxed space-y-0.5">
          <div class="flex items-start gap-1.5">
            <i
              class="pi pi-map-pin text-[11px] text-brand-faint shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div class="min-w-0">
              <p class="text-xs text-brand-ink font-semibold m-0 leading-relaxed">
                {{ address.street || 'Belum ada rincian jalan' }}
              </p>
              <p v-if="address.city" class="text-[11px] text-brand-muted m-0 mt-0.5">
                {{ address.city }}
                <span v-if="address.postal" class="font-mono text-brand-ink font-medium">
                  ({{ address.postal }})
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Landmark / Note -->
        <div
          v-if="labelInfo.note"
          class="mt-1.5 p-2 rounded-field bg-white border border-brand-hair text-[11px] text-brand-muted flex items-start gap-1.5 max-w-lg"
        >
          <i
            class="pi pi-info-circle text-[11px] text-brand-faint shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span class="leading-normal truncate">
            <strong class="font-semibold text-brand-ink">Patokan:</strong> {{ labelInfo.note }}
          </span>
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
