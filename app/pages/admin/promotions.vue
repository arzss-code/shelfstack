<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import AdminFlashDealModal, {
  type FlashDealAdminRow,
} from '~/components/admin/promotions/AdminFlashDealModal.vue'
import AdminFlashDealTable from '~/components/admin/promotions/AdminFlashDealTable.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

useSeoMeta({
  title: 'Promo & Flash Sale - Admin ShelfStack',
})

interface ProductChoice {
  id: number
  name: string
  price: number
  price_cents?: number | null
  stock: number
}

const toast = useUiToast()
const confirm = useUiConfirm()

const deals = ref<FlashDealAdminRow[]>([])
const products = ref<ProductChoice[]>([])
const loading = ref(true)
const errorMsg = ref<string | null>(null)
const isModalOpen = ref(false)
const editingDeal = ref<FlashDealAdminRow | null>(null)

async function loadData() {
  loading.value = true
  errorMsg.value = null
  try {
    const [dealsRes, productsRes] = await Promise.all([
      $fetch<{ data: FlashDealAdminRow[] }>('/api/admin/promotions/flash-deals'),
      $fetch<{ data: ProductChoice[] }>('/api/products', { params: { limit: 100 } }),
    ])
    deals.value = dealsRes.data || []
    products.value = productsRes.data || []
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    errorMsg.value = e.data?.message || e.message || 'Gagal memuat daftar promo flash sale.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingDeal.value = null
  isModalOpen.value = true
}

function openEdit(deal: FlashDealAdminRow) {
  editingDeal.value = deal
  isModalOpen.value = true
}

function confirmArchive(deal: FlashDealAdminRow) {
  confirm.require({
    header: 'Arsipkan Flash Sale',
    message: `Hapus kampanye untuk "${deal.products?.name || `Produk #${deal.product_id}`}"?`,
    tone: 'danger',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    accept: async () => {
      try {
        await $fetch(`/api/admin/promotions/flash-deals/${deal.id}`, { method: 'DELETE' })
        toast.show({
          title: 'Diarsipkan',
          message: 'Kampanye flash sale dihapus.',
          tone: 'success',
        })
        await loadData()
      } catch (err: unknown) {
        const e = err as { data?: { message?: string }; message?: string }
        toast.show({
          title: 'Gagal',
          message: e.data?.message || e.message || 'Gagal mengarsipkan kampanye.',
          tone: 'error',
        })
      }
    },
  })
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="space-y-5">
    <AdminPageHeader
      title="Promo & Flash Sale"
      subtitle="Jadwal promo berbatas waktu dan kuota klaim produk."
    >
      <template #actions>
        <UiButton
          variant="outline"
          size="sm"
          icon="pi-refresh"
          :loading="loading"
          @click="loadData"
        >
          Muat Ulang
        </UiButton>
        <UiButton variant="primary" size="sm" icon="pi-plus" @click="openCreate">
          Buat Flash Sale
        </UiButton>
      </template>
    </AdminPageHeader>

    <UiAlert v-if="errorMsg" tone="danger" class="text-xs">
      <div class="flex items-center justify-between gap-3">
        <span>{{ errorMsg }}</span>
        <UiButton size="sm" variant="outline" @click="loadData">Coba Lagi</UiButton>
      </div>
    </UiAlert>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-20 rounded-card bg-brand-field animate-pulse" />
    </div>

    <UiEmptyState
      v-else-if="deals.length === 0"
      icon="pi-bolt"
      title="Belum Ada Kampanye Flash Sale"
      description="Buat kampanye Flash Sale resmi agar blok promo dan hitung mundur aktif di beranda toko."
      action-label="Buat Flash Sale Pertama"
      @action="openCreate"
    />

    <AdminFlashDealTable
      v-else
      :deals="deals"
      :loading="loading"
      @edit="openEdit"
      @archive="confirmArchive"
    />

    <AdminFlashDealModal
      :show="isModalOpen"
      :editing-deal="editingDeal"
      :products="products"
      @close="isModalOpen = false"
      @saved="loadData"
    />
  </div>
</template>
