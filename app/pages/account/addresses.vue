<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { UserAddress, CreateAddressInput } from '~~/shared/schemas/address'
import { useAddresses } from '~/composables/useAddresses'
import { useUiToast } from '~/composables/useUiToast'
import { useUiConfirm } from '~/composables/useUiConfirm'
import AccountNavTabs from '~/components/account/AccountNavTabs.vue'
import AddressCard from '~/components/account/AddressCard.vue'
import AddressModal from '~/components/account/AddressModal.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiEmptyState from '~/components/ui/UiEmptyState.vue'
import UiSkeleton from '~/components/ui/UiSkeleton.vue'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Buku Alamat - ShelfStack',
  description: 'Kelola buku alamat pengiriman tersimpan Anda di ShelfStack.',
})

const {
  addresses,
  loading,
  fetchAddresses,
  saveAddress,
  updateAddress,
  deleteAddress,
  selectDefault,
} = useAddresses()

const toast = useUiToast()
const confirm = useUiConfirm()

const isModalOpen = ref(false)
const editingAddress = ref<UserAddress | null>(null)
const isSubmitting = ref(false)
const updatingDefaultId = ref<string | null>(null)
const searchQuery = ref('')

onMounted(async () => {
  await fetchAddresses()
})

const filteredAddresses = computed(() => {
  if (!searchQuery.value.trim()) return addresses.value
  const q = searchQuery.value.toLowerCase().trim()
  return addresses.value.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.street.toLowerCase().includes(q) ||
      a.phone.includes(q),
  )
})

const handleOpenCreateModal = () => {
  editingAddress.value = null
  isModalOpen.value = true
}

const handleOpenEditModal = (addr: UserAddress) => {
  editingAddress.value = addr
  isModalOpen.value = true
}

const handleSetDefault = async (addr: UserAddress) => {
  updatingDefaultId.value = addr.id
  try {
    await selectDefault(addr.id)
    toast.show({
      title: 'Alamat Utama Berhasil Diubah',
      message: `"${addr.name}" kini menjadi alamat pengiriman utama Anda.`,
      tone: 'success',
    })
  } catch (err: unknown) {
    const e = err as { message?: string }
    toast.show({
      title: 'Gagal Mengubah Alamat Utama',
      message: e.message || 'Terjadi kesalahan sistem.',
      tone: 'error',
    })
  } finally {
    updatingDefaultId.value = null
  }
}

const handleDelete = (addr: UserAddress) => {
  confirm.require({
    header: 'Hapus Alamat Pengiriman',
    message: `Apakah Anda yakin ingin menghapus alamat "${addr.name}"? Tindakan ini tidak dapat dibatalkan.`,
    tone: 'danger',
    acceptLabel: 'Hapus Alamat',
    rejectLabel: 'Batal',
    accept: async () => {
      try {
        await deleteAddress(addr.id)
        toast.show({
          title: 'Alamat Dihapus',
          message: 'Alamat berhasil dihapus dari buku alamat Anda.',
          tone: 'success',
        })
      } catch (err: unknown) {
        const e = err as { message?: string }
        toast.show({
          title: 'Gagal Menghapus Alamat',
          message: e.message || 'Terjadi kendala saat menghapus alamat.',
          tone: 'error',
        })
      }
    },
  })
}

const handleSaveModal = async (payload: CreateAddressInput) => {
  isSubmitting.value = true
  try {
    if (editingAddress.value) {
      await updateAddress(editingAddress.value.id, payload)
      toast.show({
        title: 'Alamat Diperbarui',
        message: 'Perubahan alamat pengiriman berhasil disimpan.',
        tone: 'success',
      })
    } else {
      await saveAddress(payload)
      toast.show({
        title: 'Alamat Ditambahkan',
        message: 'Alamat pengiriman baru berhasil disimpan ke buku alamat.',
        tone: 'success',
      })
    }
    isModalOpen.value = false
  } catch (err: unknown) {
    const e = err as { message?: string }
    toast.show({
      title: 'Gagal Menyimpan Alamat',
      message: e.message || 'Silakan periksa kembali data isian formulir.',
      tone: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-brand-canvas-soft pb-16 pt-6">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <AccountNavTabs />

      <!-- Page Subheader -->
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-brand-hair"
      >
        <div>
          <div class="flex items-center gap-2.5">
            <h2 class="text-xl font-display font-bold text-brand-ink m-0">
              Buku Alamat Pengiriman
            </h2>
            <span
              v-if="addresses.length > 0"
              class="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-ink text-white tabular-nums"
            >
              {{ addresses.length }}
            </span>
          </div>
          <p class="text-xs text-brand-muted m-0 mt-1">
            Kelola daftar alamat tersimpan untuk mempermudah dan mempercepat proses checkout pesanan
            Anda.
          </p>
        </div>

        <UiButton
          variant="primary"
          size="sm"
          icon="pi pi-plus"
          class="shrink-0 active:scale-95"
          @click="handleOpenCreateModal"
        >
          Tambah Alamat Baru
        </UiButton>
      </div>

      <!-- Quick Search Bar (when multiple addresses exist) -->
      <div v-if="addresses.length > 2" class="mb-6 max-w-sm">
        <div class="relative">
          <i
            class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-brand-faint"
            aria-hidden="true"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama penerima atau kota..."
            class="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-brand-hair bg-brand-canvas text-brand-ink placeholder:text-brand-faint focus:outline-none focus:border-brand-ink transition-colors"
          />
        </div>
      </div>

      <!-- State: Loading Skeleton -->
      <div
        v-if="loading && (!addresses || addresses.length === 0)"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div
          v-for="i in 4"
          :key="i"
          class="p-5 rounded-card border border-brand-hair bg-brand-canvas space-y-3"
        >
          <div class="flex justify-between">
            <UiSkeleton width="w-32" height="h-5" />
            <UiSkeleton width="w-20" height="h-4" />
          </div>
          <UiSkeleton width="w-full" height="h-4" />
          <UiSkeleton width="w-3/4" height="h-4" />
          <UiSkeleton width="w-1/2" height="h-4" />
        </div>
      </div>

      <!-- State: Empty -->
      <div v-else-if="!addresses || addresses.length === 0">
        <UiEmptyState
          icon="pi-map-marker"
          title="Belum Ada Alamat Tersimpan"
          description="Anda belum memiliki alamat pengiriman yang tersimpan di akun Anda. Tambahkan alamat pertama Anda sekarang untuk mempermudah transaksi."
          action-label="Tambah Alamat Baru"
          @action="handleOpenCreateModal"
        />
      </div>

      <!-- State: Filtered Empty -->
      <div
        v-else-if="filteredAddresses.length === 0"
        class="text-center py-12 bg-brand-canvas rounded-card border border-brand-hair p-8"
      >
        <p class="text-sm font-semibold text-brand-ink m-0">Tidak ada alamat yang cocok</p>
        <p class="text-xs text-brand-muted m-0 mt-1">
          Coba gunakan kata kunci pencarian yang lain.
        </p>
        <UiButton variant="ghost" size="xs" class="mt-3" @click="searchQuery = ''">
          Reset Pencarian
        </UiButton>
      </div>

      <!-- State: Address Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AddressCard
          v-for="addr in filteredAddresses"
          :key="addr.id"
          :address="addr"
          :loading="loading"
          :is-setting-default="updatingDefaultId === addr.id"
          @edit="handleOpenEditModal"
          @delete="handleDelete"
          @set-default="handleSetDefault"
        />
      </div>

      <!-- Address Modal -->
      <AddressModal
        v-model="isModalOpen"
        :address-to-edit="editingAddress"
        :loading="isSubmitting"
        @save="handleSaveModal"
      />
    </div>
  </main>
</template>
