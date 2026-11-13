<script setup lang="ts">
import { computed } from 'vue'
import type { UserAddress } from '~~/shared/schemas/address'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'

const props = defineProps<{
  address: UserAddress
  isSelected: boolean
}>()

const emit = defineEmits<{
  select: [addr: UserAddress]
  setDefault: [addr: UserAddress, event: Event]
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
    role="radio"
    :aria-checked="isSelected"
    tabindex="0"
    :data-testid="`modal-address-card-${address.id}`"
    :class="[
      'relative p-4 sm:p-5 rounded-card border transition-all duration-200 text-left cursor-pointer flex flex-col justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-brand-ink/20',
      isSelected
        ? 'border-brand-ink bg-brand-canvas-soft/50 ring-2 ring-brand-ink shadow-floating'
        : 'border-brand-hair bg-white hover:border-brand-ink/40 hover:shadow-whisper',
    ]"
    @click="emit('select', address)"
    @keydown.enter.prevent="emit('select', address)"
    @keydown.space.prevent="emit('select', address)"
  >
    <div class="space-y-2.5">
      <!-- Badges Strip (matching menu daftar alamat) -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <span
          class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-canvas text-brand-ink border border-brand-hair uppercase tracking-wide"
        >
          <i :class="[labelInfo.icon, 'text-[10px] text-brand-muted']" aria-hidden="true" />
          <span>{{ labelInfo.label }}</span>
        </span>

        <UiBadge v-if="address.is_default" label="Alamat Utama" variant="success" />

        <span
          v-if="labelInfo.label === 'Kantor'"
          class="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium"
        >
          Jam Kantor (Senin - Jumat)
        </span>
      </div>

      <!-- Recipient Header -->
      <div class="flex items-start justify-between gap-2">
        <h4 class="text-sm font-bold text-brand-ink m-0 tracking-tight truncate">
          {{ address.name }}
        </h4>
        <div class="flex items-center text-xs text-brand-muted shrink-0 tabular-nums">
          <i class="pi pi-phone text-[10px] text-brand-faint mr-1" aria-hidden="true" />
          <span>{{ address.phone }}</span>
        </div>
      </div>

      <!-- Address Details with Map Pin -->
      <div class="text-xs text-brand-muted leading-relaxed space-y-1">
        <div class="flex items-start gap-2">
          <i
            class="pi pi-map-pin text-[12px] text-brand-faint shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div class="min-w-0">
            <p class="m-0 text-brand-ink font-semibold line-clamp-2">
              {{ address.street }}
            </p>
            <p class="m-0 text-brand-muted mt-0.5">
              {{ address.city }}
            </p>
            <p class="m-0 text-[11px] font-mono text-brand-faint mt-0.5">
              Kode Pos: <span class="text-brand-ink font-semibold">{{ address.postal }}</span>
            </p>
          </div>
        </div>

        <!-- Landmark / Patokan Note -->
        <div
          v-if="labelInfo.note"
          class="mt-2 p-2 rounded-field bg-brand-canvas-soft border border-brand-hair text-[11px] text-brand-muted flex items-start gap-1.5"
        >
          <i
            class="pi pi-info-circle text-[11px] text-brand-faint shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span class="leading-normal">
            <strong class="font-semibold text-brand-ink">Patokan:</strong> {{ labelInfo.note }}
          </span>
        </div>
      </div>
    </div>

    <!-- Bottom Action Row -->
    <div class="pt-3 border-t border-brand-hair flex items-center justify-between gap-2 mt-auto">
      <div v-if="isSelected" class="flex items-center gap-1.5 text-xs text-brand-ink font-bold">
        <i class="pi pi-check-circle text-sm text-brand-success" />
        <span>Alamat Terpilih</span>
      </div>
      <span v-else class="text-[11px] text-brand-muted">Klik untuk memilih</span>

      <div class="flex items-center gap-2">
        <button
          v-if="!address.is_default"
          type="button"
          class="text-[10px] text-brand-muted hover:text-brand-ink hover:underline transition-colors border-0 bg-transparent cursor-pointer p-0"
          title="Jadikan Alamat Utama"
          @click.stop="(e) => emit('setDefault', address, e)"
        >
          Set Utama
        </button>

        <UiButton
          v-if="!isSelected"
          variant="secondary"
          size="xs"
          class="text-[11px] py-1 px-3"
          @click.stop="emit('select', address)"
        >
          Pilih Alamat
        </UiButton>
      </div>
    </div>
  </div>
</template>
