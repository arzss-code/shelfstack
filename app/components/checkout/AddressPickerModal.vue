<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { UserAddress, CreateAddressInput } from '~~/shared/schemas/address'
import { useAddresses } from '~/composables/useAddresses'
import SavedAddressForm from '~/components/checkout/SavedAddressForm.vue'
import AddressPickerCard from '~/components/checkout/AddressPickerCard.vue'
import UiModal from '~/components/ui/UiModal.vue'
import UiEmptyState from '~/components/ui/UiEmptyState.vue'

type AddressCategoryFilter = 'all' | 'default' | 'rumah' | 'kantor'

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
const activeFilter = ref<AddressCategoryFilter>('all')

const filterOptions = [
  { id: 'all' as const, label: 'Semua' },
  { id: 'default' as const, label: 'Alamat Utama' },
  { id: 'rumah' as const, label: 'Rumah' },
  { id: 'kantor' as const, label: 'Kantor' },
]

watch(
  visible,
  (isOpen) => {
    if (isOpen) {
      isAddingNew.value = false
      addFormError.value = ''
      searchQuery.value = ''
      activeFilter.value = 'all'
      if (addresses.value.length === 0) {
        fetchAddresses().catch(() => {})
      }
    }
  },
  { immediate: true },
)

const filteredAddresses = computed(() => {
  let list = addresses.value

  if (activeFilter.value === 'default') {
    list = list.filter((a) => a.is_default)
  } else if (activeFilter.value === 'rumah') {
    list = list.filter(
      (a) =>
        a.note?.toLowerCase().includes('[rumah]') ||
        (!a.note?.includes('[kantor]') && !a.note?.includes('[apartemen]')),
    )
  } else if (activeFilter.value === 'kantor') {
    list = list.filter((a) => a.note?.toLowerCase().includes('[kantor]'))
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      a.street.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      (a.note && a.note.toLowerCase().includes(q)),
  )
})

const handleResetFilter = () => {
  searchQuery.value = ''
  activeFilter.value = 'all'
}

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
  } catch (err: unknown) {
    const errObj = err as { data?: { message?: string } } | null
    addFormError.value =
      errObj?.data?.message ||
      (err instanceof Error ? err.message : '') ||
      'Gagal menyimpan alamat baru.'
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

    <!-- View Mode: Address List & Filter Bar -->
    <div v-else class="space-y-4">
      <!-- Search Bar & Add Button (matching menu daftar alamat) -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div class="relative flex-1">
          <i
            class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-xs text-brand-faint"
            aria-hidden="true"
          />
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari penerima, jalan, atau kota..."
            class="w-full pl-8 pr-3 py-2 text-xs rounded-full border border-brand-hair bg-brand-canvas text-brand-ink placeholder:text-brand-faint focus:outline-none focus:border-brand-ink focus:ring-1 focus:ring-inset focus:ring-brand-ink transition-all"
          />
        </div>

        <UiButton
          variant="primary"
          size="sm"
          icon="pi-plus"
          class="text-xs shrink-0 rounded-full justify-center"
          data-testid="modal-add-address-btn"
          @click="isAddingNew = true"
        >
          Tambah Alamat
        </UiButton>
      </div>

      <!-- Filter Chips Strip (matching account/addresses.vue) -->
      <div
        v-if="addresses.length > 0"
        class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1"
        role="group"
        aria-label="Filter Kategori Alamat"
      >
        <button
          v-for="opt in filterOptions"
          :key="opt.id"
          type="button"
          class="px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer whitespace-nowrap active:scale-95"
          :class="[
            activeFilter === opt.id
              ? 'border-brand-ink bg-brand-ink text-brand-onink shadow-2xs'
              : 'border-brand-hair hover:border-brand-ink/30 text-brand-muted bg-brand-canvas hover:text-brand-ink',
          ]"
          @click="activeFilter = opt.id"
        >
          {{ opt.label }}
        </button>
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

      <!-- Empty State: Belum Ada Alamat (matching UiEmptyState in account/addresses.vue) -->
      <UiEmptyState
        v-else-if="!loading && addresses.length === 0"
        icon="pi-map"
        title="Belum Ada Alamat Tersimpan"
        description="Tambahkan alamat pengiriman untuk mempermudah proses checkout pesanan Anda."
        action-label="Tambah Alamat Baru"
        @action="isAddingNew = true"
      />

      <!-- Empty State: Filter Tidak Ditemukan -->
      <UiEmptyState
        v-else-if="filteredAddresses.length === 0"
        icon="pi-search"
        title="Alamat Tidak Ditemukan"
        description="Tidak ada alamat yang cocok dengan filter atau kata kunci pencarian Anda."
        action-label="Tampilkan Semua Alamat"
        @action="handleResetFilter"
      />

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
