<script setup lang="ts">
import { ref } from 'vue'
import type { CreateAddressInput } from '~~/shared/schemas/address'
import { createAddressSchema } from '~~/shared/schemas/address'
import type { AdministrativeSelection } from '~~/shared/schemas/location'
import { formatCityDisplay } from '~~/shared/data/locations/indonesia-regions'
import LocationPickerModal from '~/components/checkout/LocationPickerModal.vue'

const props = withDefaults(
  defineProps<{
    isSubmitting?: boolean
    error?: string
    initialDefault?: boolean
  }>(),
  {
    isSubmitting: false,
    error: '',
    initialDefault: false,
  },
)

const emit = defineEmits<{
  save: [data: CreateAddressInput]
  cancel: []
}>()

const isLocationModalOpen = ref(false)
const formErrors = ref<Record<string, string>>({})
const internalError = ref('')

const form = ref<CreateAddressInput>({
  name: '',
  phone: '',
  street: '',
  city: '',
  postal: '',
  note: '',
  is_default: props.initialDefault,
})

const handleLocationSelect = (loc: AdministrativeSelection) => {
  const cleanCity = formatCityDisplay(loc.cityName)
  form.value.city = `${cleanCity}, ${loc.provinceName}`
  form.value.postal = loc.postalCode
}

const handleSubmit = () => {
  formErrors.value = {}
  internalError.value = ''

  const validation = createAddressSchema.safeParse(form.value)
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors
    for (const [key, msgs] of Object.entries(fieldErrors)) {
      if (msgs && msgs[0]) {
        formErrors.value[key] = msgs[0]
      }
    }
    internalError.value = 'Mohon periksa data formulir yang belum sesuai.'
    return
  }

  emit('save', validation.data)
}
</script>

<template>
  <div class="bg-brand-canvas-soft border border-brand-hair rounded-card p-4 sm:p-5 space-y-4">
    <div class="flex items-center justify-between border-b border-brand-hairsoft pb-2">
      <h4
        class="font-display font-bold text-xs sm:text-sm text-brand-ink m-0 flex items-center gap-2"
      >
        <i class="pi pi-plus-circle text-brand-accent" />
        Tambah Alamat Pengiriman Baru
      </h4>
      <button
        type="button"
        class="text-brand-muted hover:text-brand-ink text-xs transition-colors cursor-pointer"
        @click="emit('cancel')"
      >
        <i class="pi pi-times" />
      </button>
    </div>

    <div
      v-if="error || internalError"
      class="p-2.5 bg-brand-danger-tint border border-brand-danger-edge rounded-field text-xs text-brand-danger-text flex items-center gap-2"
    >
      <i class="pi pi-exclamation-circle shrink-0" />
      <span>{{ error || internalError }}</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-semibold text-brand-ink mb-1">
          Nama Penerima <span class="text-red-500">*</span>
        </label>
        <UiInput v-model="form.name" placeholder="cth. Arya Santoso" :error="formErrors.name" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-brand-ink mb-1">
          Nomor Telepon / WhatsApp <span class="text-red-500">*</span>
        </label>
        <UiInput v-model="form.phone" placeholder="cth. 081234567890" :error="formErrors.phone" />
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold text-brand-ink mb-1">
        Alamat Lengkap <span class="text-red-500">*</span>
      </label>
      <UiInput
        v-model="form.street"
        placeholder="cth. Jl. Sudirman No. 42, RT 01/RW 04"
        :error="formErrors.street"
      />
    </div>

    <!-- Master Location Picker Button -->
    <div>
      <label class="block text-xs font-semibold text-brand-ink mb-1">
        Pilih Wilayah Resmi (Provinsi, Kota/Kabupaten &amp; Kode Pos)
      </label>
      <button
        type="button"
        data-testid="saved-address-location-picker-btn"
        class="w-full flex items-center justify-between p-2.5 rounded-lg border border-brand-hair hover:border-brand-ink bg-brand-canvas-soft/40 hover:bg-white text-xs transition-colors cursor-pointer"
        @click="isLocationModalOpen = true"
      >
        <span class="flex items-center gap-2 text-brand-muted truncate">
          <i class="pi pi-map-marker text-brand-ink text-xs shrink-0" />
          <span v-if="form.city" class="text-brand-ink font-medium truncate">
            {{ form.city }} ({{ form.postal || '-' }})
          </span>
          <span v-else>Pilih dari Master Data Wilayah Indonesia</span>
        </span>
        <span class="text-xs font-semibold text-brand-ink shrink-0 ml-2">Pilih Wilayah</span>
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="block text-xs font-semibold text-brand-ink mb-1">
          Kota / Kabupaten <span class="text-red-500">*</span>
        </label>
        <UiInput v-model="form.city" placeholder="cth. Jakarta Pusat" :error="formErrors.city" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-brand-ink mb-1">
          Kode Pos <span class="text-red-500">*</span>
        </label>
        <UiInput v-model="form.postal" placeholder="cth. 10220" :error="formErrors.postal" />
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold text-brand-ink mb-1">
        Catatan untuk Kurir (Opsional)
      </label>
      <UiInput
        v-model="form.note"
        placeholder="cth. Titipkan ke resepsionis"
        :error="formErrors.note"
      />
    </div>

    <div class="flex items-center gap-2 pt-1">
      <input
        id="is_default_checkbox"
        v-model="form.is_default"
        type="checkbox"
        class="rounded border-brand-hair text-brand-accent focus:ring-brand-accent w-4 h-4 cursor-pointer"
      />
      <label for="is_default_checkbox" class="text-xs text-brand-ink cursor-pointer select-none">
        Jadikan sebagai alamat utama
      </label>
    </div>

    <div class="flex items-center justify-end gap-2 pt-2 border-t border-brand-hairsoft">
      <UiButton
        variant="ghost"
        size="sm"
        class="text-xs"
        :disabled="isSubmitting"
        @click="emit('cancel')"
      >
        Batal
      </UiButton>
      <UiButton
        variant="primary"
        size="sm"
        class="text-xs"
        :loading="isSubmitting"
        @click="handleSubmit"
      >
        Simpan Alamat
      </UiButton>
    </div>

    <LocationPickerModal v-model="isLocationModalOpen" @select="handleLocationSelect" />
  </div>
</template>
