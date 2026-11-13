<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { UserAddress, CreateAddressInput } from '~~/shared/schemas/address'
import { useAddresses } from '~/composables/useAddresses'
import SavedAddressForm from '~/components/checkout/SavedAddressForm.vue'
import AddressPickerCard from '~/components/checkout/AddressPickerCard.vue'
import UiModal from '~/components/ui/UiModal.vue'

const visible = defineModel<boolean>('visible', { default: false })

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
const searchQuery = ref('')

watch(
  visible,
  (isOpen) => {
    if (isOpen) {
      isAddingNew.value = false
      addFormError.value = ''
      searchQuery.value = ''
      if (addresses.value.length === 0) {
        fetchAddresses().catch(() => {})
      }
    }
  },
  { immediate: true },
)

const filteredAddresses = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return addresses.value
  return addresses.value.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      a.street.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      (a.note && a.note.toLowerCase().includes(q)),
  )
})

const handleSelect = (addr: UserAddress) => {
  emit('select', addr)
  visible.value = false
}

const handleSetDefault = async (addr: UserAddress, event: Event) => {
  event.stopPropagation()
  try {
    await selectDefault(addr.id)
  } catch {
    // Handled in composable
  }
}

const handleSaveNewAddress = async (data: CreateAddressInput) => {
  addFormError.value = ''
  isSubmittingNew.value = true
  try {
    const created = await saveAddress(data)
    isAddingNew.value = false
    emit('select', created)
    visible.value = false
  } catch (err: any) {
    addFormError.value = err?.data?.message || err?.message || 'Gagal menyimpan alamat baru.'
  } finally {
    isSubmittingNew.value = false
  }
}
</script>

<template>
  <UiModal
    v-model:visible="visible"
    :title="isAddingNew ? 'Tambah Alamat Pengiriman Baru' : 'Pilih Alamat Pengiriman'"
    :description="
      isAddingNew
        ? 'Lengkapi rincian alamat pengiriman baru untuk melanjutkan pesanan.'
        : 'Pilih salah satu alamat tersimpan untuk pengiriman paket pesanan Anda.'
    "
    size="lg"
  >
    <!-- View Mode: Add New Address Form -->
    <div v-if="isAddingNew" class="space-y-4">
      <div class="flex items-center justify-between pb-2 border-b border-brand-hairsoft">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-ink transition-colors cursor-pointer border-0 bg-transparent p-0"
          @click="isAddingNew = false"
        >
          <i class="pi pi-arrow-left text-[11px]" />
          <span>Kembali ke Daftar Alamat</span>
        </button>
      </div>

      <SavedAddressForm
        :is-submitting="isSubmittingNew"
        :error="addFormError"
        :initial-default="addresses.length === 0"
        @save="handleSaveNewAddress"
        @cancel="isAddingNew = false"
      />
    </div>

    <!-- View Mode: Address List & Search -->
    <div v-else class="space-y-4">
      <!-- Search & Add Action Header -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div class="relative flex-1">
          <i
            class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-brand-muted"
          />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari penerima, jalan, atau kota..."
            class="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-brand-hair bg-white focus:outline-none focus:ring-2 focus:ring-brand-ink/20 focus:border-brand-ink transition-colors placeholder:text-brand-muted/70"
          />
        </div>

        <UiButton
          variant="primary"
          size="sm"
          icon="pi-plus"
          class="text-xs shrink-0 rounded-lg justify-center"
          data-testid="modal-add-address-btn"
          @click="isAddingNew = true"
        >
          Tambah Alamat
        </UiButton>
      </div>

      <!-- Loading State Skeleton -->
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

      <!-- Error Alert -->
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

      <!-- Empty State -->
      <div
        v-else-if="!loading && addresses.length === 0"
        class="p-8 border border-dashed border-brand-hair rounded-card text-center bg-brand-canvas-soft space-y-3"
      >
        <div
          class="w-12 h-12 rounded-full bg-brand-canvas flex items-center justify-center mx-auto border border-brand-hair text-brand-muted"
        >
          <i class="pi pi-map text-lg" />
        </div>
        <div class="space-y-1">
          <h4 class="font-display font-semibold text-sm text-brand-ink m-0">
            Belum Ada Alamat Tersimpan
          </h4>
          <p class="text-xs text-brand-muted m-0 max-w-sm mx-auto">
            Simpan alamat tujuan pengiriman Anda untuk memudahkan proses transaksi sekarang dan
            berikutnya.
          </p>
        </div>
        <div class="pt-2">
          <UiButton
            variant="primary"
            size="sm"
            icon="pi-plus"
            class="text-xs rounded-lg"
            @click="isAddingNew = true"
          >
            Buat Alamat Sekarang
          </UiButton>
        </div>
      </div>

      <!-- Empty Filtered Results -->
      <div
        v-else-if="filteredAddresses.length === 0"
        class="p-6 border border-dashed border-brand-hair rounded-card text-center bg-brand-canvas-soft text-xs text-brand-muted"
      >
        Tidak ada alamat yang cocok dengan pencarian "{{ searchQuery }}".
      </div>

      <!-- Address Cards Grid -->
      <div
        v-else
        role="radiogroup"
        aria-label="Daftar Alamat Tersimpan"
        class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1"
      >
        <AddressPickerCard
          v-for="addr in filteredAddresses"
          :key="addr.id"
          :address="addr"
          :is-selected="selectedId === addr.id"
          @select="handleSelect"
          @set-default="handleSetDefault"
        />
      </div>
    </div>
  </UiModal>
</template>
