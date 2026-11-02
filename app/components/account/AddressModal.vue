<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { UserAddress, CreateAddressInput } from '~~/shared/schemas/address'
import type { AdministrativeSelection } from '~~/shared/schemas/location'
import { formatAdministrativeAddress } from '~~/shared/data/locations/indonesia-regions'
import { createAddressSchema } from '~~/shared/schemas/address'
import UiModal from '~/components/ui/UiModal.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiTextarea from '~/components/ui/UiTextarea.vue'
import UiButton from '~/components/ui/UiButton.vue'
import LocationPickerModal from '~/components/checkout/LocationPickerModal.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    addressToEdit?: UserAddress | null
    loading?: boolean
  }>(),
  {
    addressToEdit: null,
    loading: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  save: [data: CreateAddressInput]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const isLocationModalOpen = ref(false)

const form = ref<{
  name: string
  phone: string
  street: string
  city: string
  postal: string
  note: string
  is_default: boolean
}>({
  name: '',
  phone: '',
  street: '',
  city: '',
  postal: '',
  note: '',
  is_default: false,
})

const errors = ref<Record<string, string>>({})

watch(
  () => props.addressToEdit,
  (addr) => {
    if (addr) {
      form.value = {
        name: addr.name || '',
        phone: addr.phone || '',
        street: addr.street || '',
        city: addr.city || '',
        postal: addr.postal || '',
        note: addr.note || '',
        is_default: Boolean(addr.is_default),
      }
    } else {
      form.value = {
        name: '',
        phone: '',
        street: '',
        city: '',
        postal: '',
        note: '',
        is_default: false,
      }
    }
    errors.value = {}
  },
  { immediate: true },
)

const handleLocationSelect = (loc: AdministrativeSelection) => {
  form.value.city = formatAdministrativeAddress(loc.districtName, loc.cityName, loc.provinceName)
  form.value.postal = loc.postalCode
  if (errors.value.city) delete errors.value.city
  if (errors.value.postal) delete errors.value.postal
}

const handleSubmit = () => {
  errors.value = {}
  const parsed = createAddressSchema.safeParse(form.value)

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    for (const [key, messages] of Object.entries(fieldErrors)) {
      if (messages && messages.length > 0 && messages[0]) {
        errors.value[key] = messages[0]
      }
    }
    return
  }

  emit('save', parsed.data)
}
</script>

<template>
  <UiModal
    v-model:visible="isOpen"
    :title="addressToEdit ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Baru'"
    description="Isi detail alamat pengiriman secara akurat untuk memudahkan kurir mengantarkan pesanan."
    size="md"
  >
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UiInput
          v-model="form.name"
          label="Nama Penerima"
          placeholder="Contoh: Budi Santoso"
          :error="errors.name"
          :disabled="loading"
        />
        <UiInput
          v-model="form.phone"
          label="Nomor Telepon"
          placeholder="08123456789"
          :error="errors.phone"
          :disabled="loading"
        />
      </div>

      <UiTextarea
        v-model="form.street"
        label="Alamat Lengkap"
        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan..."
        :rows="3"
        :error="errors.street"
        :disabled="loading"
      />

      <!-- Cascade Location Picker Section -->
      <div class="space-y-2">
        <label class="text-xs font-semibold text-brand-ink sm:text-sm block">
          Wilayah Administratif &amp; Kode Pos
        </label>
        <div class="flex items-start gap-2">
          <div
            class="flex-1 min-w-0 px-3.5 py-2.5 rounded-field border bg-brand-canvas-soft text-xs text-brand-ink font-medium truncate"
            :class="[errors.city ? 'border-rose-300' : 'border-brand-hair']"
          >
            <span v-if="form.city" class="text-brand-ink">
              {{ form.city }} ({{ form.postal || 'Kode Pos' }})
            </span>
            <span v-else class="text-brand-muted">
              Belum memilih provinsi, kota &amp; kecamatan
            </span>
          </div>
          <UiButton
            variant="secondary"
            size="sm"
            type="button"
            icon="pi pi-map"
            :disabled="loading"
            class="shrink-0"
            @click="isLocationModalOpen = true"
          >
            Pilih Wilayah
          </UiButton>
        </div>
        <p v-if="errors.city" class="text-[11px] text-rose-600 m-0">
          {{ errors.city }}
        </p>
        <p v-else-if="errors.postal" class="text-[11px] text-rose-600 m-0">
          {{ errors.postal }}
        </p>
      </div>

      <!-- Quick Manual Override (Optional) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="sm:col-span-2">
          <UiInput
            v-model="form.city"
            label="Kota / Wilayah (Teks)"
            placeholder="Kota / Kabupaten"
            :error="errors.city"
            :disabled="loading"
          />
        </div>
        <div>
          <UiInput
            v-model="form.postal"
            label="Kode Pos"
            placeholder="40132"
            numeric
            :error="errors.postal"
            :disabled="loading"
          />
        </div>
      </div>

      <UiInput
        v-model="form.note"
        label="Catatan Pengiriman (Opsional)"
        placeholder="Contoh: Titipkan di pos satpam / pagar hitam"
        :disabled="loading"
      />

      <div class="pt-2">
        <label class="flex items-center gap-2.5 cursor-pointer text-xs text-brand-ink font-medium">
          <input
            v-model="form.is_default"
            type="checkbox"
            :disabled="loading"
            class="w-4 h-4 rounded border-brand-hair text-brand-ink focus:ring-brand-ink accent-brand-ink"
          />
          <span>Jadikan sebagai alamat pengiriman utama</span>
        </label>
      </div>

      <!-- Action Buttons Footer -->
      <div class="pt-4 border-t border-brand-hair flex items-center justify-end gap-3">
        <UiButton
          variant="secondary"
          size="sm"
          type="button"
          :disabled="loading"
          @click="isOpen = false"
        >
          Batal
        </UiButton>
        <UiButton variant="primary" size="sm" type="submit" :loading="loading">
          {{ addressToEdit ? 'Simpan Perubahan' : 'Tambah Alamat' }}
        </UiButton>
      </div>
    </form>

    <LocationPickerModal v-model="isLocationModalOpen" @select="handleLocationSelect" />
  </UiModal>
</template>
