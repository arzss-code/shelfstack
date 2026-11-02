<script setup lang="ts">
import { ref } from 'vue'
import type { UserAddress } from '~~/shared/schemas/address'
import type { AdministrativeSelection } from '~~/shared/schemas/location'
import { formatAdministrativeAddress } from '~~/shared/data/locations/indonesia-regions'
import SavedAddressSelector from '~/components/checkout/SavedAddressSelector.vue'
import LocationPickerModal from '~/components/checkout/LocationPickerModal.vue'

interface AddressModel {
  name: string
  phone: string
  street: string
  city: string
  postal: string
  note: string
}

const props = withDefaults(
  defineProps<{
    modelValue: AddressModel
    errors?: Record<string, string>
    disabled?: boolean
    isLoggedIn?: boolean
    selectedSavedAddressId?: string | null
    saveAddressForNextOrder?: boolean
  }>(),
  {
    errors: () => ({}),
    disabled: false,
    isLoggedIn: false,
    selectedSavedAddressId: null,
    saveAddressForNextOrder: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [address: AddressModel]
  'update:saveAddressForNextOrder': [save: boolean]
  'select-saved': [saved: UserAddress]
}>()

const isLocationModalOpen = ref(false)

const updateField = (field: keyof AddressModel, val: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: val,
  })
}

const handleLocationSelect = (loc: AdministrativeSelection) => {
  emit('update:modelValue', {
    ...props.modelValue,
    city: formatAdministrativeAddress(loc.districtName, loc.cityName, loc.provinceName),
    postal: loc.postalCode,
  })
}

const toggleSave = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:saveAddressForNextOrder', target.checked)
}
</script>

<template>
  <fieldset :disabled="disabled" class="border-0 p-0 m-0 min-w-0 space-y-6">
    <div class="bg-brand-canvas border border-brand-hair rounded-card p-6 shadow-whisper space-y-4">
      <!-- Section Header -->
      <div class="flex items-center justify-between pb-3 border-b border-brand-hairsoft">
        <div class="flex items-center gap-2">
          <i class="pi pi-map-marker text-brand-ink text-base" />
          <h2 id="shipping-heading" class="font-display text-base font-bold text-brand-ink m-0">
            Alamat Pengiriman
          </h2>
        </div>
        <span class="text-[11px] text-brand-muted">Langkah 1 dari 2</span>
      </div>

      <!-- Saved Address Selector if logged in -->
      <div v-if="isLoggedIn" class="pb-4 border-b border-brand-hairsoft">
        <SavedAddressSelector
          :selected-id="selectedSavedAddressId"
          @select="emit('select-saved', $event)"
        />
      </div>

      <!-- Address Inputs Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Nama Penerima -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-brand-ink">
            Nama Penerima <span class="text-red-500">*</span>
          </label>
          <UiInput
            :model-value="modelValue.name"
            placeholder="cth. Atsiila Arya"
            :error="errors.name"
            @update:model-value="updateField('name', $event)"
          />
        </div>

        <!-- Nomor Telepon -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-brand-ink">
            Nomor Telepon / WhatsApp <span class="text-red-500">*</span>
          </label>
          <UiInput
            :model-value="modelValue.phone"
            placeholder="cth. 081234567890"
            :error="errors.phone"
            @update:model-value="updateField('phone', $event)"
          />
        </div>
      </div>

      <!-- Alamat Lengkap -->
      <div class="space-y-1">
        <label class="block text-xs font-semibold text-brand-ink">
          Alamat Lengkap (Jalan, No. Rumah, RT/RW, Patokan)
          <span class="text-red-500">*</span>
        </label>
        <UiInput
          :model-value="modelValue.street"
          placeholder="cth. Jl. Sudirman No. 42, RT 01/RW 04, Menteng"
          :error="errors.street"
          @update:model-value="updateField('street', $event)"
        />
      </div>

      <!-- Master Data Location Selector Button / Card -->
      <div class="space-y-1.5">
        <label class="block text-xs font-semibold text-brand-ink">
          Wilayah Pengiriman (Provinsi, Kota, Kecamatan &amp; Kode Pos)
          <span class="text-red-500">*</span>
        </label>

        <div
          v-if="modelValue.city"
          class="p-3 rounded-xl border border-brand-hair bg-brand-canvas-soft/70 flex items-center justify-between gap-3 transition-colors"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <div
              class="w-8 h-8 rounded-lg bg-brand-ink text-white flex items-center justify-center shrink-0"
            >
              <i class="pi pi-map-marker text-xs" />
            </div>
            <div class="min-w-0">
              <p class="font-display font-bold text-xs text-brand-ink m-0 truncate">
                {{ modelValue.city }}
              </p>
              <p class="text-[11px] text-brand-muted m-0 mt-0.5">
                Kode Pos:
                <span class="font-semibold text-brand-ink tabular">{{
                  modelValue.postal || '-'
                }}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            data-testid="change-location-btn"
            class="text-xs font-semibold text-brand-ink hover:underline shrink-0 px-2 py-1 rounded cursor-pointer"
            @click="isLocationModalOpen = true"
          >
            Ubah
          </button>
        </div>

        <button
          v-else
          type="button"
          data-testid="open-location-picker-btn"
          class="w-full flex items-center justify-between p-3.5 rounded-xl border border-dashed border-brand-hair hover:border-brand-ink bg-white hover:bg-brand-canvas-soft/30 transition-all text-left group cursor-pointer"
          @click="isLocationModalOpen = true"
        >
          <div
            class="flex items-center gap-2.5 text-brand-muted group-hover:text-brand-ink transition-colors"
          >
            <i class="pi pi-map-marker text-sm text-brand-ink" />
            <span class="text-xs font-medium">Pilih Provinsi, Kota, Kecamatan &amp; Kode Pos</span>
          </div>
          <span class="inline-flex items-center gap-1 text-xs font-semibold text-brand-ink">
            Cari Wilayah <i class="pi pi-chevron-right text-[10px]" />
          </span>
        </button>

        <p v-if="errors.city || errors.postal" class="text-[11px] text-red-600 m-0">
          {{ errors.city || errors.postal }}
        </p>
      </div>

      <!-- Catatan Pengiriman -->
      <div class="space-y-1">
        <label class="block text-xs font-semibold text-brand-ink">
          Catatan untuk Kurir (Opsional)
        </label>
        <UiInput
          :model-value="modelValue.note"
          placeholder="cth. Titipkan ke satpam jika penerima tidak ada di tempat"
          :error="errors.note"
          @update:model-value="updateField('note', $event)"
        />
      </div>

      <!-- Option Checkbox: Simpan alamat -->
      <div v-if="isLoggedIn" class="flex items-center gap-2 pt-3 border-t border-brand-hairsoft">
        <input
          id="save_address_checkbox"
          :checked="saveAddressForNextOrder"
          type="checkbox"
          class="rounded border-brand-hair text-brand-ink focus:ring-brand-ink w-4 h-4 cursor-pointer"
          @change="toggleSave"
        />
        <label
          for="save_address_checkbox"
          class="text-xs text-brand-ink font-medium cursor-pointer select-none"
        >
          Simpan alamat ini ke buku alamat saya
        </label>
      </div>
    </div>

    <!-- Indonesian Administrative Address Master Data Selector Modal -->
    <LocationPickerModal v-model="isLocationModalOpen" @select="handleLocationSelect" />
  </fieldset>
</template>
