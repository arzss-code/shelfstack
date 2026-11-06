<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { UserAddress, CreateAddressInput } from '~~/shared/schemas/address'
import type { AddressFilterType } from '~/components/account/AddressFilterBar.vue'
import { useAddresses } from '~/composables/useAddresses'
import { useUiToast } from '~/composables/useUiToast'
import { useUiConfirm } from '~/composables/useUiConfirm'
import AccountSidebar from '~/components/account/AccountSidebar.vue'
import AddressCard from '~/components/account/AddressCard.vue'
import AddressModal from '~/components/account/AddressModal.vue'
import AddressFilterBar from '~/components/account/AddressFilterBar.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiEmptyState from '~/components/ui/UiEmptyState.vue'
import UiSkeleton from '~/components/ui/UiSkeleton.vue'

definePageMeta({ middleware: 'auth' })

useSeoMeta({
  title: 'Daftar Alamat Pengiriman - ShelfStack',
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
const activeFilter = ref<AddressFilterType>('all')

onMounted(async () => {
  await fetchAddresses()
})

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

  if (!searchQuery.value.trim()) return list
  const q = searchQuery.value.toLowerCase().trim()
  return list.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.street.toLowerCase().includes(q) ||
      a.phone.includes(q),
  )
})

const handleResetFilter = () => {
  searchQuery.value = ''
  activeFilter.value = 'all'
}

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
  <div class="space-y-6 pb-16">
    <!-- Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="flex items-center gap-2 text-xs font-medium text-brand-muted pb-2 overflow-x-auto"
    >
      <NuxtLink to="/" class="hover:text-brand-ink no-underline text-brand-muted transition-colors">
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint">/</span>
      <span class="text-brand-ink font-semibold">Daftar Alamat</span>
    </nav>

    <!-- 2-Column Tokopedia / Shopee Master Layout (Sidebar on xl, Horizontal Tabs on < xl) -->
    <div class="flex flex-col xl:flex-row gap-6 items-start">
      <AccountSidebar />

      <!-- Right Main Content Panel -->
      <div class="flex-1 min-w-0 w-full space-y-6">
        <!-- Page Header Card -->
        <div
          class="bg-brand-canvas border border-brand-hair rounded-card p-5 sm:p-6 shadow-whisper"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-hair"
          >
            <div>
              <div class="flex items-center gap-2.5">
                <h2 class="text-lg sm:text-xl font-display font-bold text-brand-ink m-0">
                  Daftar Alamat Pengiriman
                </h2>
                <span
                  v-if="addresses.length > 0"
                  class="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-ink text-white tabular-nums"
                >
                  {{ addresses.length }}
                </span>
              </div>
              <p class="text-xs text-brand-muted m-0 mt-1">
                Kelola alamat pengiriman untuk mempermudah dan mempercepat pesanan belanja Anda.
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

          <AddressFilterBar
            v-if="addresses.length > 0"
            v-model:search-query="searchQuery"
            v-model:active-filter="activeFilter"
          />
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
        <UiEmptyState
          v-else-if="filteredAddresses.length === 0"
          icon="pi-search"
          title="Tidak ada alamat yang cocok"
          description="Coba gunakan kata kunci pencarian atau filter yang lain."
          action-label="Reset Filter Pencarian"
          @action="handleResetFilter"
        />

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
      </div>
    </div>

    <!-- Address Modal -->
    <AddressModal
      v-model="isModalOpen"
      :address-to-edit="editingAddress"
      :loading="isSubmitting"
      @save="handleSaveModal"
    />
  </div>
</template>
