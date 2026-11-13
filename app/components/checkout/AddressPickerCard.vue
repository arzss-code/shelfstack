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
    role="radio"
    :aria-checked="isSelected"
    tabindex="0"
    :data-testid="`modal-address-card-${address.id}`"
    :class="[
      'group relative p-4 sm:p-4.5 rounded-card border-2 transition-all duration-150 text-left cursor-pointer flex flex-col justify-between gap-3 outline-none focus-visible:ring-2 focus-visible:ring-brand-ink/20',
      isSelected
        ? 'border-brand-ink bg-brand-canvas-soft/30 shadow-whisper'
        : 'border-brand-hair bg-white hover:border-brand-ink/40 hover:bg-brand-canvas-soft/10',
    ]"
    @click="emit('select', address)"
    @keydown.enter.prevent="emit('select', address)"
    @keydown.space.prevent="emit('select', address)"
  >
    <!-- Top Content Section with Radio Indicator -->
    <div class="flex items-start gap-3">
      <!-- Tactile Radio Indicator -->
      <div class="pt-0.5 shrink-0" aria-hidden="true">
        <div
          class="w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-150"
          :class="[
            isSelected
              ? 'border-brand-ink bg-brand-ink'
              : 'border-brand-hair bg-white group-hover:border-brand-ink/50',
          ]"
        >
          <div
            v-if="isSelected"
            class="w-1.5 h-1.5 rounded-full bg-white transition-transform scale-100"
          />
        </div>
      </div>

      <!-- Main Info Column -->
      <div class="flex-1 min-w-0 space-y-2">
        <!-- Badges & Action Header -->
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span
              v-if="labelInfo.hasCategory"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-brand-canvas text-brand-ink border border-brand-hair uppercase tracking-wide"
            >
              <i :class="[labelInfo.icon, 'text-[10px] text-brand-muted']" aria-hidden="true" />
              <span>{{ labelInfo.label }}</span>
            </span>

            <UiBadge v-if="address.is_default" label="Alamat Utama" variant="success" />

            <span
              v-if="labelInfo.label === 'Kantor'"
              class="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium"
            >
              Jam Kantor (Senin - Jumat)
            </span>
          </div>

          <!-- Quick Action: Set Default (if not default) -->
          <button
            v-if="!address.is_default"
            type="button"
            class="text-[10px] font-medium text-brand-muted hover:text-brand-ink hover:underline transition-colors border-0 bg-transparent cursor-pointer p-0 shrink-0 ml-auto"
            title="Jadikan Alamat Utama"
            @click.stop="(e) => emit('setDefault', address, e)"
          >
            Set Utama
          </button>
        </div>

        <!-- Recipient & Phone (Single mental chunk) -->
        <div class="flex items-baseline gap-1.5 flex-wrap">
          <h4 class="text-sm font-bold text-brand-ink m-0 tracking-tight">
            {{ address.name }}
          </h4>
          <span class="text-brand-faint text-xs">·</span>
          <span class="text-xs text-brand-muted tabular-nums">
            {{ address.phone }}
          </span>
        </div>

        <!-- Address Lines (Street + City & Postal) -->
        <div class="text-xs space-y-0.5">
          <p class="m-0 text-brand-ink font-semibold leading-relaxed line-clamp-2">
            {{ address.street }}
          </p>
          <p class="m-0 text-brand-muted text-xs leading-normal">
            {{ address.city }} <span class="text-brand-faint">·</span> Kode Pos:
            <span class="text-brand-ink font-medium">{{ address.postal }}</span>
          </p>
        </div>

        <!-- Courier Note (Subtle, non-competing) -->
        <div
          v-if="labelInfo.note"
          class="flex items-start gap-1.5 text-[11px] text-brand-muted pt-0.5"
        >
          <i
            class="pi pi-info-circle text-[11px] text-brand-faint shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p class="m-0 leading-normal">
            <span class="text-brand-faint font-medium">Catatan: </span>
            <span class="text-brand-ink font-medium">{{ labelInfo.note }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- Bottom Selection Footer -->
    <div
      class="pt-2.5 border-t border-brand-hair/60 flex items-center justify-between gap-2 mt-auto"
    >
      <div
        v-if="isSelected"
        class="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold"
      >
        <i class="pi pi-check-circle text-xs text-emerald-600" aria-hidden="true" />
        <span>Alamat Terpilih</span>
      </div>
      <span
        v-else
        class="text-[11px] text-brand-faint group-hover:text-brand-muted transition-colors"
      >
        Klik kartu untuk memilih
      </span>

      <UiButton
        v-if="!isSelected"
        variant="secondary"
        size="xs"
        class="text-[11px] py-1 px-3 shrink-0"
        @click.stop="emit('select', address)"
      >
        Pilih Alamat
      </UiButton>
    </div>
  </div>
</template>
