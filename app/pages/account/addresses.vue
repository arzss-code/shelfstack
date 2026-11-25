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
  <div class="space-y-4 pb-16">
    <!-- Desktop Breadcrumbs -->
    <nav
      aria-label="Breadcrumbs"
      class="hidden sm:flex items-center gap-2 text-xs font-medium text-brand-muted overflow-x-auto"
    >
      <NuxtLink
        to="/"
        class="hover:text-brand-ink no-underline text-brand-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-sm"
      >
        ShelfStack
      </NuxtLink>
      <span class="text-brand-faint" aria-hidden="true">/</span>
      <span class="text-brand-ink font-semibold">Daftar Alamat</span>
    </nav>

    <!-- 2-Column Account Layout -->
    <div class="flex flex-col xl:flex-row gap-4 xl:gap-6 items-start">
      <AccountSidebar />

      <div class="flex-1 min-w-0 w-full space-y-3.5">
        <!-- Compact Header matching Wishlist & Orders -->
        <header
          class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3.5 border-b border-brand-hair"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h1
                class="font-display text-lg sm:text-2xl font-bold text-brand-ink tracking-[-0.02em] m-0 [text-wrap:balance]"
              >
                Daftar Alamat
              </h1>
              <span
                v-if="addresses.length > 0"
                class="px-2 py-0.5 rounded-full bg-brand-canvas-soft border border-brand-hair text-brand-ink text-[11px] font-semibold tabular-nums"
              >
                {{ addresses.length }}
              </span>
            </div>
            <p class="text-xs text-brand-muted m-0 mt-1 [text-wrap:pretty]">
              Kelola alamat pengiriman tersimpan agar proses checkout lebih cepat.
            </p>
          </div>

          <UiButton
            variant="primary"
            size="xs"
            icon="pi-plus"
            class="self-start sm:self-auto shrink-0 sm:px-4 sm:py-2"
            @click="handleOpenCreateModal"
          >
            Tambah Alamat
          </UiButton>
        </header>

        <!-- Compact Filter Strip -->
        <AddressFilterBar
          v-if="addresses.length > 1 || searchQuery.trim().length > 0 || activeFilter !== 'all'"
          v-model:search-query="searchQuery"
          v-model:active-filter="activeFilter"
        />

        <!-- State: Loading Skeleton -->
        <div
          v-if="loading && (!addresses || addresses.length === 0)"
          role="status"
          aria-busy="true"
          class="grid grid-cols-1 md:grid-cols-2 gap-3.5"
        >
          <span class="sr-only">Memuat daftar alamat…</span>
          <div
            v-for="i in 4"
            :key="i"
            class="p-4 rounded-card border border-brand-hair bg-brand-canvas space-y-2.5"
          >
            <div class="flex justify-between">
              <UiSkeleton width="w-32" height="h-4" />
              <UiSkeleton width="w-16" height="h-4" shape="pill" />
            </div>
            <UiSkeleton width="w-full" height="h-3.5" />
            <UiSkeleton width="w-3/4" height="h-3.5" />
          </div>
        </div>

        <!-- State: Empty -->
        <UiEmptyState
          v-else-if="!addresses || addresses.length === 0"
          icon="pi-map-marker"
          title="Belum Ada Alamat Tersimpan"
          description="Tambahkan alamat pengiriman pertama Anda untuk mempercepat proses checkout."
          action-label="Tambah Alamat Baru"
          @action="handleOpenCreateModal"
        />

        <!-- State: Filtered Empty -->
        <UiEmptyState
          v-else-if="filteredAddresses.length === 0"
          icon="pi-search"
          title="Tidak Ada Alamat yang Cocok"
          description="Ubah kata kunci pencarian atau reset filter untuk melihat semua alamat tersimpan."
          action-label="Reset Filter"
          @action="handleResetFilter"
        />

        <!-- State: Address Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
