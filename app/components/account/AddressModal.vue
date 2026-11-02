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
const showManualLocationInputs = ref(false)

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
      showManualLocationInputs.value = false
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
      showManualLocationInputs.value = false
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
    description="Isi detail alamat pengiriman secara akurat untuk memudahkan kurir mengantarkan pesanan Anda."
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
        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, patokan lokasi..."
        :rows="3"
        :error="errors.street"
        :disabled="loading"
      />

      <!-- Cascade Location Picker Section -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-semibold text-brand-ink sm:text-sm block">
            Wilayah Administratif &amp; Kode Pos
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
          v-if="form.city"
          class="p-3.5 rounded-card border border-brand-hair bg-brand-canvas-soft/70 flex items-center justify-between gap-3 shadow-xs"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            <span
              class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"
            >
              <i class="pi pi-map-marker text-xs" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <p class="text-xs font-bold text-brand-ink m-0 truncate">
                {{ form.city }}
              </p>
              <p class="text-[11px] font-mono text-brand-muted m-0 mt-0.5">
                Kode Pos: <span class="font-bold text-brand-ink">{{ form.postal || '-' }}</span>
              </p>
            </div>
          </div>

          <UiButton
            variant="secondary"
            size="xs"
            type="button"
            icon="pi pi-pencil"
            class="shrink-0"
            :disabled="loading"
            @click="isLocationModalOpen = true"
          >
            Ubah
          </UiButton>
        </div>

        <!-- Unselected Location Trigger -->
        <div
          v-else
          class="p-3.5 rounded-card border border-dashed border-brand-hair hover:border-brand-ink/40 transition-colors bg-brand-canvas-soft flex items-center justify-between gap-3"
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
      </div>

      <!-- Manual Inputs Fallback (Collapsible or if explicitly toggled) -->
      <div v-show="showManualLocationInputs" class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
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
        label="Catatan Pengiriman untuk Kurir (Opsional)"
        placeholder="Contoh: Titipkan di pos satpam / pagar hitam / dekat masjid"
        :disabled="loading"
      />

      <div class="pt-2">
        <label
          class="flex items-center gap-2.5 cursor-pointer text-xs text-brand-ink font-medium select-none"
        >
          <input
            v-model="form.is_default"
            type="checkbox"
            :disabled="loading"
            class="w-4 h-4 rounded border-brand-hair text-brand-ink focus:ring-brand-ink accent-brand-ink cursor-pointer"
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
