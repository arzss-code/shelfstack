<script setup lang="ts">
import { computed } from 'vue'
import type { UserAddress } from '~~/shared/schemas/address'
import UiBadge from '~/components/ui/UiBadge.vue'
import UiButton from '~/components/ui/UiButton.vue'

const props = defineProps<{
  address: UserAddress
  loading?: boolean
  isSettingDefault?: boolean
}>()

const emit = defineEmits<{
  edit: [address: UserAddress]
  delete: [address: UserAddress]
  setDefault: [address: UserAddress]
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
    class="relative rounded-card border bg-brand-canvas p-5 sm:p-6 transition-all duration-200 shadow-whisper hover:shadow-floating flex flex-col justify-between"
    :class="[
      address.is_default
        ? 'border-brand-ink/40 ring-1 ring-brand-ink/10 bg-gradient-to-b from-brand-canvas to-brand-canvas-soft/30'
        : 'border-brand-hair hover:border-brand-ink/20',
    ]"
  >
    <!-- Card Top Content -->
    <div class="space-y-2.5">
      <!-- Badges Strip -->
      <div
        v-if="labelInfo.hasCategory || address.is_default"
        class="flex items-center gap-1.5 flex-wrap"
      >
        <span
          v-if="labelInfo.hasCategory"
          class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-white text-brand-ink border border-brand-hair uppercase tracking-wide"
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

      <!-- Recipient Header -->
      <div class="flex items-baseline gap-1.5 flex-wrap">
        <h3 class="text-sm font-bold text-brand-ink m-0 tracking-tight">
          {{ address.name }}
        </h3>
        <span class="text-brand-faint text-xs">·</span>
        <span class="text-xs text-brand-muted tabular-nums">
          {{ address.phone }}
        </span>
      </div>

      <!-- Address Details -->
      <div class="text-xs space-y-0.5 mb-4">
        <p class="m-0 text-brand-ink font-semibold leading-relaxed">
          {{ address.street }}
        </p>
        <p class="m-0 text-brand-muted text-xs leading-normal">
          {{ address.city }} <span class="text-brand-faint">·</span> Kode Pos:
          <span class="text-brand-ink font-semibold">{{ address.postal }}</span>
        </p>

        <!-- Courier Landmark Note (Subtle, non-competing) -->
        <div
          v-if="labelInfo.note"
          class="flex items-start gap-1.5 text-[11px] text-brand-muted pt-1"
        >
          <i
            class="pi pi-compass text-[11px] text-brand-faint shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p class="m-0 leading-normal">
            <span class="text-brand-faint font-medium">Patokan: </span>
            <span class="text-brand-ink font-medium">{{ labelInfo.note }}</span>
          </p>
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
          Jadikan Alamat Utama
        </UiButton>
        <div v-else class="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5">
          <i class="pi pi-check-circle text-xs text-emerald-600" aria-hidden="true" />
          <span>Alamat Utama Pengiriman</span>
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
