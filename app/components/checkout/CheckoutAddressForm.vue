<script setup lang="ts">
import type { UserAddress } from '~~/shared/schemas/address'
import SavedAddressSelector from '~/components/checkout/SavedAddressSelector.vue'

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

const updateField = (field: keyof AddressModel, val: string) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: val,
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

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Kota / Kabupaten -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-brand-ink">
            Kota / Kabupaten <span class="text-red-500">*</span>
          </label>
          <UiInput
            :model-value="modelValue.city"
            placeholder="cth. Jakarta Pusat"
            :error="errors.city"
            @update:model-value="updateField('city', $event)"
          />
        </div>

        <!-- Kode Pos -->
        <div class="space-y-1">
          <label class="block text-xs font-semibold text-brand-ink">
            Kode Pos <span class="text-red-500">*</span>
          </label>
          <UiInput
            :model-value="modelValue.postal"
            placeholder="cth. 10220"
            :error="errors.postal"
            @update:model-value="updateField('postal', $event)"
          />
        </div>
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
  </fieldset>
</template>
