<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { UserAddress, CreateAddressInput } from '~~/shared/schemas/address'
import { createAddressSchema } from '~~/shared/schemas/address'
import { useAddresses } from '~/composables/useAddresses'

const props = withDefaults(
  defineProps<{
    selectedId?: string | null
  }>(),
  {
    selectedId: null,
  },
)

const emit = defineEmits<{
  select: [address: UserAddress]
}>()

const { addresses, loading, error, fetchAddresses, saveAddress, selectDefault } = useAddresses()

const isAddingNew = ref(false)
const isSubmittingNew = ref(false)
const addFormError = ref('')
const formErrors = ref<Record<string, string>>({})

const newAddressForm = ref<CreateAddressInput>({
  name: '',
  phone: '',
  street: '',
  city: '',
  postal: '',
  note: '',
  is_default: false,
})

onMounted(async () => {
  await fetchAddresses()
  if (addresses.value.length > 0) {
    const target = props.selectedId
      ? addresses.value.find((a) => a.id === props.selectedId)
      : addresses.value.find((a) => a.is_default) || addresses.value[0]

    if (target) {
      emit('select', target)
    }
  }
})

const handleSelect = (addr: UserAddress) => {
  emit('select', addr)
}

const handleSetDefault = async (addr: UserAddress, event: Event) => {
  event.stopPropagation()
  try {
    await selectDefault(addr.id)
    emit('select', addr)
  } catch {
    // Error is exposed in composable error state
  }
}

const openAddForm = () => {
  newAddressForm.value = {
    name: '',
    phone: '',
    street: '',
    city: '',
    postal: '',
    note: '',
    is_default: addresses.value.length === 0,
  }
  formErrors.value = {}
  addFormError.value = ''
  isAddingNew.value = true
}

const cancelAddForm = () => {
  isAddingNew.value = false
  formErrors.value = {}
  addFormError.value = ''
}

const handleSaveNewAddress = async () => {
  formErrors.value = {}
  addFormError.value = ''

  const validation = createAddressSchema.safeParse(newAddressForm.value)
  if (!validation.success) {
    const fieldErrors = validation.error.flatten().fieldErrors
    for (const [key, msgs] of Object.entries(fieldErrors)) {
      if (msgs && msgs[0]) {
        formErrors.value[key] = msgs[0]
      }
    }
    addFormError.value = 'Mohon periksa data formulir yang belum sesuai.'
    return
  }

  isSubmittingNew.value = true
  try {
    const created = await saveAddress(validation.data)
    isAddingNew.value = false
    emit('select', created)
  } catch (err: any) {
    addFormError.value = err?.data?.message || err?.message || 'Gagal menyimpan alamat baru.'
  } finally {
    isSubmittingNew.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header with Action -->
    <div class="flex items-center justify-between gap-2 pb-1">
      <div class="flex items-center gap-2">
        <i class="pi pi-bookmark text-brand-accent text-sm" />
        <h3 class="font-display text-sm font-bold text-brand-ink m-0">Alamat Tersimpan</h3>
        <span
          v-if="!loading && addresses.length > 0"
          class="text-[11px] font-semibold text-brand-muted bg-brand-canvas-soft px-2 py-0.5 rounded-full border border-brand-hairsoft"
        >
          {{ addresses.length }}
        </span>
      </div>

      <UiButton
        v-if="!isAddingNew"
        variant="outline"
        size="sm"
        icon="pi-plus"
        class="text-xs"
        @click="openAddForm"
      >
        Tambah Alamat Baru
      </UiButton>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        v-for="i in 2"
        :key="i"
        class="border border-brand-hairsoft rounded-card p-4 bg-brand-canvas-soft/40 animate-pulse space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="h-4 w-28 bg-brand-hair rounded" />
          <div class="h-4 w-12 bg-brand-hair rounded" />
        </div>
        <div class="h-3 w-44 bg-brand-hair/70 rounded" />
        <div class="h-3 w-36 bg-brand-hair/70 rounded" />
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="p-3 bg-brand-danger-tint border border-brand-danger-edge rounded-card flex items-center justify-between text-xs text-brand-danger-text"
    >
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-triangle shrink-0" />
        <span>{{ error }}</span>
      </div>
      <UiButton
        variant="ghost"
        size="sm"
        class="text-xs text-brand-danger-text"
        @click="fetchAddresses"
      >
        Coba Lagi
      </UiButton>
    </div>

    <!-- Form Tambah Alamat Baru Inline -->
    <div
      v-if="isAddingNew"
      class="bg-brand-canvas-soft border border-brand-hair rounded-card p-4 sm:p-5 space-y-4"
    >
      <div class="flex items-center justify-between border-b border-brand-hairsoft pb-2">
        <h4
          class="font-display font-bold text-xs sm:text-sm text-brand-ink m-0 flex items-center gap-2"
        >
          <i class="pi pi-plus-circle text-brand-accent" />
          Tambah Alamat Pengiriman Baru
        </h4>
        <button
          type="button"
          class="text-brand-muted hover:text-brand-ink text-xs transition-colors"
          @click="cancelAddForm"
        >
          <i class="pi pi-times" />
        </button>
      </div>

      <div
        v-if="addFormError"
        class="p-2.5 bg-brand-danger-tint border border-brand-danger-edge rounded-field text-xs text-brand-danger-text flex items-center gap-2"
      >
        <i class="pi pi-exclamation-circle shrink-0" />
        <span>{{ addFormError }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-brand-ink mb-1">
            Nama Penerima <span class="text-red-500">*</span>
          </label>
          <UiInput
            v-model="newAddressForm.name"
            placeholder="cth. Arya Santoso"
            :error="formErrors.name"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-brand-ink mb-1">
            Nomor Telepon / WhatsApp <span class="text-red-500">*</span>
          </label>
          <UiInput
            v-model="newAddressForm.phone"
            placeholder="cth. 081234567890"
            :error="formErrors.phone"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-brand-ink mb-1">
          Alamat Lengkap <span class="text-red-500">*</span>
        </label>
        <UiInput
          v-model="newAddressForm.street"
          placeholder="cth. Jl. Sudirman No. 42, RT 01/RW 04"
          :error="formErrors.street"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-brand-ink mb-1">
            Kota / Kabupaten <span class="text-red-500">*</span>
          </label>
          <UiInput
            v-model="newAddressForm.city"
            placeholder="cth. Jakarta Pusat"
            :error="formErrors.city"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-brand-ink mb-1">
            Kode Pos <span class="text-red-500">*</span>
          </label>
          <UiInput
            v-model="newAddressForm.postal"
            placeholder="cth. 10220"
            :error="formErrors.postal"
          />
        </div>
      </div>

      <div>
        <label class="block text-xs font-semibold text-brand-ink mb-1">
          Catatan untuk Kurir (Opsional)
        </label>
        <UiInput
          v-model="newAddressForm.note"
          placeholder="cth. Titipkan ke resepsionis"
          :error="formErrors.note"
        />
      </div>

      <div class="flex items-center gap-2 pt-1">
        <input
          id="is_default_checkbox"
          v-model="newAddressForm.is_default"
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
          :disabled="isSubmittingNew"
          @click="cancelAddForm"
        >
          Batal
        </UiButton>
        <UiButton
          variant="primary"
          size="sm"
          class="text-xs"
          :loading="isSubmittingNew"
          @click="handleSaveNewAddress"
        >
          Simpan Alamat
        </UiButton>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!loading && addresses.length === 0"
      class="p-6 border border-dashed border-brand-hair rounded-card text-center bg-brand-canvas-soft space-y-2"
    >
      <i class="pi pi-map text-2xl text-brand-muted" />
      <h4 class="font-display font-semibold text-xs sm:text-sm text-brand-ink m-0">
        Belum ada alamat tersimpan
      </h4>
      <p class="text-xs text-brand-muted m-0 max-w-sm mx-auto">
        Simpan alamat pengiriman untuk mempercepat transaksi pemesanan berikutnya.
      </p>
      <div class="pt-2">
        <UiButton variant="primary" size="sm" icon="pi-plus" class="text-xs" @click="openAddForm">
          + Tambah Alamat Baru
        </UiButton>
      </div>
    </div>

    <!-- List Saved Address Cards -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        v-for="addr in addresses"
        :key="addr.id"
        :class="[
          'relative p-4 rounded-card border transition-all text-left cursor-pointer flex flex-col justify-between gap-3',
          selectedId === addr.id
            ? 'border-brand-accent bg-brand-accent-tint/30 ring-2 ring-brand-accent shadow-whisper'
            : 'border-brand-hair bg-brand-canvas hover:border-brand-ink/40 hover:shadow-whisper',
        ]"
        @click="handleSelect(addr)"
      >
        <div class="space-y-1.5">
          <!-- Top Row: Name, Phone & Badge -->
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <span class="font-display font-bold text-xs sm:text-sm text-brand-ink block truncate">
                {{ addr.name }}
              </span>
              <span class="text-[11px] text-brand-muted block">
                {{ addr.phone }}
              </span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <span
                v-if="addr.is_default"
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-success-tint text-brand-success-text border border-brand-success-edge"
              >
                Utama
              </span>
              <button
                v-else
                type="button"
                class="text-[10px] text-brand-muted hover:text-brand-ink hover:underline transition-colors border-0 bg-transparent cursor-pointer p-0"
                title="Jadikan Alamat Utama"
                @click="(e) => handleSetDefault(addr, e)"
              >
                Set Utama
              </button>
            </div>
          </div>

          <!-- Street & City -->
          <p class="text-xs text-brand-ink m-0 leading-relaxed line-clamp-2">
            {{ addr.street }}
          </p>
          <p class="text-[11px] text-brand-muted m-0">{{ addr.city }}, {{ addr.postal }}</p>

          <!-- Note -->
          <div
            v-if="addr.note"
            class="text-[11px] text-brand-muted/90 flex items-center gap-1 pt-1 border-t border-brand-hairsoft truncate"
          >
            <i class="pi pi-info-circle text-[10px] shrink-0" />
            <span class="truncate">{{ addr.note }}</span>
          </div>
        </div>

        <!-- Action / Selection Status -->
        <div class="pt-2 border-t border-brand-hairsoft flex items-center justify-between gap-2">
          <div
            v-if="selectedId === addr.id"
            class="flex items-center gap-1.5 text-xs text-brand-accent font-semibold"
          >
            <i class="pi pi-check-circle text-sm" />
            <span>Alamat Terpilih</span>
          </div>
          <span v-else class="text-[11px] text-brand-muted"> Klik untuk memilih </span>

          <UiButton
            v-if="selectedId !== addr.id"
            variant="secondary"
            size="sm"
            class="text-[11px] py-1 px-3"
            @click.stop="handleSelect(addr)"
          >
            Pilih Alamat Ini
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>
