<script setup lang="ts">
import { ref } from 'vue'
import type { AdministrativeSelection } from '~~/shared/schemas/location'
import { formatAdministrativeAddress } from '~~/shared/data/locations/indonesia-regions'
import UiInput from '~/components/ui/UiInput.vue'
import UiButton from '~/components/ui/UiButton.vue'
import LocationPickerModal from '~/components/checkout/LocationPickerModal.vue'

const props = withDefaults(
  defineProps<{
    city: string
    postal: string
    errorCity?: string
    errorPostal?: string
    disabled?: boolean
  }>(),
  {
    errorCity: '',
    errorPostal: '',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:city': [val: string]
  'update:postal': [val: string]
}>()

const isLocationModalOpen = ref(false)
const showManualLocationInputs = ref(false)

const handleLocationSelect = (loc: AdministrativeSelection) => {
  const formattedCity = formatAdministrativeAddress(
    loc.districtName,
    loc.cityName,
    loc.provinceName,
  )
  emit('update:city', formattedCity)
  emit('update:postal', loc.postalCode)
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <label class="text-xs font-semibold text-brand-ink sm:text-sm block">
        Kota atau Kecamatan &amp; Kode Pos
      </label>
      <button
        type="button"
        class="text-[11px] font-semibold text-brand-accent hover:underline border-0 bg-transparent cursor-pointer p-0"
        @click="showManualLocationInputs = !showManualLocationInputs"
      >
        {{ showManualLocationInputs ? 'Sembunyikan Input Manual' : 'Input Manual Wilayah' }}
      </button>
    </div>

    <!-- Selected Location Review Card -->
    <div
      v-if="city"
      class="p-3.5 rounded-card border border-brand-hair bg-white flex items-center justify-between gap-3 shadow-xs"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <span
          class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"
        >
          <i class="pi pi-map-marker text-xs" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <p class="text-xs font-bold text-brand-ink m-0 truncate">
            {{ city }}
          </p>
          <p class="text-[11px] font-mono text-brand-muted m-0 mt-0.5">
            Kode Pos: <span class="font-bold text-brand-ink">{{ postal || '-' }}</span>
          </p>
        </div>
      </div>

      <UiButton
        variant="secondary"
        size="xs"
        type="button"
        icon="pi pi-pencil"
        class="shrink-0 active:scale-95"
        :disabled="disabled"
        @click="isLocationModalOpen = true"
      >
        Ubah
      </UiButton>
    </div>

    <!-- Unselected Location Trigger -->
    <div
      v-else
      class="p-3.5 rounded-card border border-dashed border-brand-hair hover:border-brand-ink/40 transition-colors bg-white flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2.5 min-w-0">
        <i class="pi pi-map text-sm text-brand-faint shrink-0" aria-hidden="true" />
        <span class="text-xs text-brand-muted truncate">
          Pilih provinsi, kota, kecamatan, dan kode pos
        </span>
      </div>
      <UiButton
        variant="secondary"
        size="xs"
        type="button"
        icon="pi pi-chevron-right"
        icon-pos="right"
        :disabled="disabled"
        class="shrink-0 active:scale-95"
        @click="isLocationModalOpen = true"
      >
        Pilih Wilayah
      </UiButton>
    </div>

    <p v-if="errorCity" class="text-[11px] text-rose-600 m-0">
      {{ errorCity }}
    </p>

    <!-- Manual Inputs Fallback (Collapsible) -->
    <div v-show="showManualLocationInputs" class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
      <div class="sm:col-span-2">
        <UiInput
          :model-value="city"
          label="Kota / Wilayah (Teks)"
          placeholder="Kota / Kabupaten"
          :error="errorCity"
          :disabled="disabled"
          @update:model-value="$emit('update:city', $event)"
        />
      </div>
      <div>
        <UiInput
          :model-value="postal"
          label="Kode Pos"
          placeholder="40132"
          numeric
          :error="errorPostal"
          :disabled="disabled"
          @update:model-value="$emit('update:postal', $event)"
        />
      </div>
    </div>

    <LocationPickerModal v-model="isLocationModalOpen" @select="handleLocationSelect" />
  </div>
</template>
