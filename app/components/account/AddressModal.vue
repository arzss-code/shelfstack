<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { UserAddress, CreateAddressInput } from '~~/shared/schemas/address'
import { createAddressSchema } from '~~/shared/schemas/address'
import UiModal from '~/components/ui/UiModal.vue'
import UiInput from '~/components/ui/UiInput.vue'
import UiTextarea from '~/components/ui/UiTextarea.vue'
import UiButton from '~/components/ui/UiButton.vue'
import AddressLocationField from '~/components/account/AddressLocationField.vue'

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

const addressLabels = [
  { id: 'Rumah', label: 'Rumah', icon: 'pi pi-home', hint: 'Pengiriman setiap hari (24 jam)' },
  {
    id: 'Kantor',
    label: 'Kantor',
    icon: 'pi pi-building',
    hint: 'Disarankan saat jam operasional kantor (Senin - Jumat 08.00 - 17.00)',
  },
  {
    id: 'Apartemen',
    label: 'Apartemen',
    icon: 'pi pi-building-columns',
    hint: 'Sertakan nomor unit dan titipkan di reception/lobby',
  },
  { id: 'Lainnya', label: 'Lainnya', icon: 'pi pi-tag', hint: 'Pengiriman sesuai catatan khusus' },
]

const selectedLabel = ref<string>('Rumah')

const form = ref<{
  name: string
  phone: string
  street: string
  city: string
  postal: string
  noteText: string
  is_default: boolean
}>({
  name: '',
  phone: '',
  street: '',
  city: '',
  postal: '',
  noteText: '',
  is_default: false,
})

const errors = ref<Record<string, string>>({})

watch(
  () => props.addressToEdit,
  (addr) => {
    if (addr) {
      let rawNote = addr.note || ''
      let detectedLabel = 'Rumah'
      const match = rawNote.match(/^\[(Rumah|Kantor|Apartemen|Lainnya)\]/i)
      if (match && match[1]) {
        detectedLabel = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
        rawNote = rawNote.replace(/^\[(Rumah|Kantor|Apartemen|Lainnya)\]\s*/i, '').trim()
      }

      selectedLabel.value = detectedLabel
      form.value = {
        name: addr.name || '',
        phone: addr.phone || '',
        street: addr.street || '',
        city: addr.city || '',
        postal: addr.postal || '',
        noteText: rawNote,
        is_default: Boolean(addr.is_default),
      }
    } else {
      selectedLabel.value = 'Rumah'
      form.value = {
        name: '',
        phone: '',
        street: '',
        city: '',
        postal: '',
        noteText: '',
        is_default: false,
      }
    }
    errors.value = {}
  },
  { immediate: true },
)

const handleSubmit = () => {
  errors.value = {}

  const labelPrefix = `[${selectedLabel.value}]`
  const combinedNote = form.value.noteText.trim()
    ? `${labelPrefix} ${form.value.noteText.trim()}`
    : labelPrefix

  const payloadToValidate = {
    name: form.value.name,
    phone: form.value.phone,
    street: form.value.street,
    city: form.value.city,
    postal: form.value.postal,
    note: combinedNote,
    is_default: form.value.is_default,
  }

  const parsed = createAddressSchema.safeParse(payloadToValidate)

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
      <!-- Pilihan Label Alamat (Tokopedia / Shopee Signature Pattern) -->
      <div>
        <label class="text-xs font-semibold text-brand-ink sm:text-sm block mb-1.5">
          Label Alamat
        </label>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            v-for="item in addressLabels"
            :key="item.id"
            type="button"
            class="px-3 py-2 rounded-field text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            :class="[
              selectedLabel === item.id
                ? 'bg-brand-ink text-white border-brand-ink shadow-xs font-semibold'
                : 'bg-brand-canvas text-brand-ink border-brand-hair hover:bg-brand-canvas-soft',
            ]"
            @click="selectedLabel = item.id"
          >
            <i :class="[item.icon, 'text-xs']" />
            <span>{{ item.label }}</span>
          </button>
        </div>
        <p class="text-[11px] text-brand-muted m-0 mt-1 italic">
          {{ addressLabels.find((l) => l.id === selectedLabel)?.hint }}
        </p>
      </div>

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

      <!-- Cascade Location Picker Subcomponent -->
      <AddressLocationField
        v-model:city="form.city"
        v-model:postal="form.postal"
        :error-city="errors.city"
        :error-postal="errors.postal"
        :disabled="loading"
      />

      <UiTextarea
        v-model="form.street"
        label="Alamat Lengkap"
        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, nomor unit..."
        :rows="3"
        :error="errors.street"
        :disabled="loading"
      />

      <UiInput
        v-model="form.noteText"
        label="Catatan untuk Kurir (Opsional)"
        placeholder="Contoh: Titipkan di pos satpam / rumah cat biru samping warung"
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
          class="active:scale-95"
          @click="isOpen = false"
        >
          Batal
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          type="submit"
          :loading="loading"
          class="active:scale-95"
        >
          {{ addressToEdit ? 'Simpan Perubahan' : 'Tambah Alamat' }}
        </UiButton>
      </div>
    </form>
  </UiModal>
</template>
