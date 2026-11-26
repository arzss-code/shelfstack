<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import { useClientTableSort } from '~/composables/useClientTableSort'
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
  return { label: 'Berlangsung', variant: 'success' }
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

const promoColumns = [
  { key: 'product', label: 'Produk', ariaLabel: 'produk', align: 'left' as const },
  { key: 'discount', label: 'Diskon', ariaLabel: 'persentase diskon', align: 'center' as const },
  { key: 'promo_price', label: 'Harga Promo', ariaLabel: 'harga promo', align: 'right' as const },
  { key: 'claimed', label: 'Kuota Klaim', ariaLabel: 'kuota klaim', align: 'center' as const },
  { key: 'starts_at', label: 'Jadwal Promo', ariaLabel: 'jadwal promo', align: 'left' as const },
  { key: 'status', label: 'Status', ariaLabel: 'status promo', align: 'left' as const },
]

const {
  sortKey,
  sortDirection,
  sortedItems: sortedDeals,
  onSortChange,
  getAriaSort,
} = useClientTableSort(deals, {
  product: (d) => d.products?.name || `Produk #${d.product_id}`,
  discount: (d) => d.discount_percentage,
  promo_price: (d) => d.promo_price_cents,
  claimed: (d) => d.claimed,
  starts_at: (d) => new Date(d.starts_at).getTime() || 0,
  status: (d) => getDealStatusBadge(d).label,
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

    <div
      v-else
      class="overflow-hidden rounded-card border border-brand-hair bg-brand-canvas shadow-whisper"
    >
      <div
        tabindex="0"
        role="region"
        aria-label="Tabel daftar kampanye flash sale"
        class="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-ink"
      >
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr
              class="border-b border-brand-hair bg-brand-canvas-soft text-[11px] font-semibold uppercase tracking-wider text-brand-muted"
            >
              <th
                v-for="col in promoColumns"
                :key="col.key"
                scope="col"
                class="py-2.5 px-3.5 whitespace-nowrap"
                :class="
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                "
                :aria-sort="getAriaSort(col.key)"
              >
                <UiSortHeader
                  :sort-key="col.key"
                  :label="col.label"
                  :align="col.align"
                  :active-key="sortKey"
                  :direction="sortDirection"
                  @sort="onSortChange"
                >
                  {{ col.label }}
                </UiSortHeader>
              </th>
              <th scope="col" class="py-2.5 px-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-brand-hairsoft text-brand-ink">
            <tr
              v-for="deal in sortedDeals"
              :key="deal.id"
              class="hover:bg-brand-canvas-soft/50 transition-colors"
            >
              <td class="py-2.5 px-3.5 font-semibold text-brand-ink max-w-[220px] truncate">
                {{ deal.products?.name || `Produk #${deal.product_id}` }}
              </td>
              <td class="py-2.5 px-3.5 text-center whitespace-nowrap">
                <UiBadge :label="`-${deal.discount_percentage}%`" variant="danger" />
              </td>
              <td
                class="py-2.5 px-3.5 text-right font-display font-bold tabular-nums whitespace-nowrap"
              >
                {{ formatRupiah(deal.promo_price_cents / 100) }}
              </td>
              <td class="py-2.5 px-3.5 text-center text-brand-muted tabular-nums whitespace-nowrap">
                {{ deal.claimed }} / {{ deal.quota }}
              </td>
              <td class="py-2.5 px-3.5 text-brand-muted tabular-nums whitespace-nowrap">
                {{ formatDateTime(deal.starts_at) }} - {{ formatDateTime(deal.ends_at) }}
              </td>
              <td class="py-2.5 px-3.5 whitespace-nowrap">
                <UiBadge
                  :label="getDealStatusBadge(deal).label"
                  :variant="getDealStatusBadge(deal).variant"
                />
              </td>
              <td class="py-2.5 px-3.5 text-right whitespace-nowrap">
                <div class="inline-flex items-center gap-1">
                  <UiIconButton
                    icon="pi-pencil"
                    label="Ubah flash sale"
                    size="sm"
                    @click="openEdit(deal)"
                  />
                  <UiIconButton
                    icon="pi-trash"
                    label="Hapus flash sale"
                    variant="danger"
                    size="sm"
                    @click="confirmArchive(deal)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
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
