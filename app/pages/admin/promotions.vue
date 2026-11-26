<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import AdminFlashDealModal, {
  type FlashDealAdminRow,
} from '~/components/admin/promotions/AdminFlashDealModal.vue'
import { formatRupiah } from '~/utils/format'

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

function getDealStatusBadge(deal: FlashDealAdminRow): {
  label: string
  variant: 'success' | 'info' | 'warning' | 'default'
} {
  if (!deal.is_active) return { label: 'Nonaktif', variant: 'default' }
  const now = Date.now()
  const start = new Date(deal.starts_at).getTime()
  const end = new Date(deal.ends_at).getTime()
  if (now < start) return { label: 'Terjadwal', variant: 'info' }
  if (now > end || deal.claimed >= deal.quota) return { label: 'Berakhir', variant: 'warning' }
  return { label: 'Aktif Live', variant: 'success' }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
      subtitle="Atur jadwal flash sale, kuota klaim, dan harga promo produk."
      :breadcrumbs="[{ label: 'Dashboard', to: '/admin' }, { label: 'Promo & Flash Sale' }]"
    >
      <template #actions>
        <UiButton
          variant="outline"
          size="sm"
          icon="pi-refresh"
          :loading="loading"
          @click="loadData"
        >
          Segarkan Data
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

    <div v-else class="grid grid-cols-1 gap-3">
      <article
        v-for="deal in deals"
        :key="deal.id"
        class="rounded-card border border-brand-hair bg-brand-canvas p-4 sm:p-5 shadow-whisper flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="space-y-1.5 min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="m-0 font-display text-sm sm:text-base font-bold text-brand-ink truncate">
              {{ deal.products?.name || `Produk #${deal.product_id}` }}
            </h2>
            <UiBadge
              :label="getDealStatusBadge(deal).label"
              :variant="getDealStatusBadge(deal).variant"
            />
            <UiBadge :label="`-${deal.discount_percentage}%`" variant="danger" />
          </div>

          <div
            class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-muted tabular-nums"
          >
            <span>
              Harga Promo:
              <strong class="text-brand-ink">{{
                formatRupiah(deal.promo_price_cents / 100)
              }}</strong>
            </span>
            <span>Kuota Klaim: {{ deal.claimed }} / {{ deal.quota }}</span>
            <span
              >Jadwal: {{ formatDateTime(deal.starts_at) }} -
              {{ formatDateTime(deal.ends_at) }}</span
            >
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <UiButton size="sm" variant="secondary" icon="pi-pencil" @click="openEdit(deal)">
            Edit
          </UiButton>
          <UiButton size="sm" variant="danger" icon="pi-trash" @click="confirmArchive(deal)">
            Hapus
          </UiButton>
        </div>
      </article>
    </div>

    <AdminFlashDealModal
      :show="isModalOpen"
      :editing-deal="editingDeal"
      :products="products"
      @close="isModalOpen = false"
      @saved="loadData"
    />
  </div>
</template>
