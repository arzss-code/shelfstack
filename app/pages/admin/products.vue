<script setup lang="ts">
import { useProductStore } from '~/features/products/stores/product'
import type { Product } from '~/types/product'
import ProductList from '~/features/products/components/ProductList.vue'
import ProductForm from '~/features/products/components/ProductForm.vue'
import StockMovementsModal from '~/features/products/components/StockMovementsModal.vue'
import { sortProducts, type SortDir, type SortKey } from '~/features/products/utils/product-sort'

useSeoMeta({
  title: 'Kelola Produk',
})

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const productStore = useProductStore()
const toast = useUiToast()
const confirm = useUiConfirm()

const isFormVisible = ref(false)
const editingProduct = ref<Product | null>(null)
const isStockModalVisible = ref(false)
const stockAuditProduct = ref<Product | null>(null)
const searchQuery = ref('')
const activeTab = ref('0')
const sortOption = ref('name-asc')

const openStockMovements = (product: Product) => {
  stockAuditProduct.value = product
  isStockModalVisible.value = true
}

const criticalStockProducts = computed(() =>
  productStore.products.filter((p) => (p.stock ?? 0) < 5),
)

const tabItems = computed(() => [
  { value: '0', label: 'Produk Aktif' },
  {
    value: '2',
    label: 'Stok Kritis',
    count: criticalStockProducts.value.length,
    countTone: 'danger' as const,
  },
  { value: '1', label: 'Keranjang Sampah' },
])

const filteredProducts = computed(() => {
  const src =
    activeTab.value === '1'
      ? productStore.deletedProducts
      : activeTab.value === '2'
        ? criticalStockProducts.value
        : productStore.products
  const q = searchQuery.value.trim().toLowerCase()
  const list = !q ? src : src.filter((p) => p.name.toLowerCase().includes(q))
  const [k, d] = sortOption.value.split('-') as [SortKey, SortDir]
  return sortProducts(list, k, d)
})

watch(activeTab, async (newVal) => {
  if (newVal === '1' && productStore.deletedProducts.length === 0) {
    try {
      await productStore.fetchDeletedProducts()
    } catch (e) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Gagal memuat keranjang sampah',
        life: 3000,
      })
    }
  }
})

onMounted(async () => {
  try {
    await productStore.fetchProducts()
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Gagal Memuat Data',
      detail: error instanceof Error ? error.message : 'Gagal mengambil daftar produk.',
      life: 5000,
    })
  }
})

const openAddForm = () => {
  editingProduct.value = null
  isFormVisible.value = true
}

const openEditForm = (product: Product) => {
  editingProduct.value = product
  isFormVisible.value = true
}

const handleSave = async (
  name: string,
  price: number,
  description: string | null,
  link: string | null,
  file: File | null,
  stock = 0,
  categoryId: string | null = null,
) => {
  try {
    if (editingProduct.value) {
      await productStore.updateProduct(
        editingProduct.value.id,
        name,
        price,
        description,
        link,
        file,
        stock,
        categoryId,
      )
      toast.add({
        severity: 'success',
        summary: 'Berhasil',
        detail: 'Produk berhasil diperbarui.',
        life: 3000,
      })
    } else {
      await productStore.addProduct(name, price, description, link, file, stock, categoryId)
      toast.add({
        severity: 'success',
        summary: 'Berhasil',
        detail: 'Produk baru berhasil ditambahkan.',
        life: 3000,
      })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan tidak terduga.'
    const isRls = message.includes('row-level security policy')
    toast.add({
      severity: 'error',
      summary: isRls ? 'Akses Ditolak (RLS)' : 'Gagal Menyimpan',
      detail: isRls ? 'Supabase menolak operasi. Pastikan RLS Policy sudah diatur.' : message,
      life: isRls ? 8000 : 5000,
    })
  }
}

const handleDelete = async (id: number) => {
  confirm.require({
    message: 'Apakah Anda yakin ingin menghapus produk ini?',
    header: 'Konfirmasi Penghapusan',
    tone: 'danger',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    accept: async () => {
      try {
        await productStore.deleteProduct(id)
        toast.add({
          severity: 'success',
          summary: 'Terhapus',
          detail: 'Produk berhasil dihapus.',
          life: 3000,
        })
      } catch (error: unknown) {
        toast.add({
          severity: 'error',
          summary: 'Gagal Menghapus',
          detail: error instanceof Error ? error.message : 'Terjadi kesalahan.',
          life: 5000,
        })
      }
    },
  })
}

const handleRestore = async (id: number) => {
  confirm.require({
    message: 'Apakah Anda yakin ingin mengembalikan produk ini dari keranjang sampah?',
    header: 'Konfirmasi Restore',
    tone: 'success',
    acceptLabel: 'Restore',
    rejectLabel: 'Batal',
    accept: async () => {
      try {
        await productStore.restoreProduct(id)
        toast.add({
          severity: 'success',
          summary: 'Berhasil',
          detail: 'Produk berhasil dikembalikan.',
          life: 3000,
        })
        productStore.fetchProducts()
      } catch (error: unknown) {
        toast.add({
          severity: 'error',
          summary: 'Gagal Mengembalikan',
          detail: error instanceof Error ? error.message : 'Terjadi kesalahan.',
          life: 5000,
        })
      }
    },
  })
}
</script>

<template>
  <div>
    <!-- Header & Search & Add Button -->
    <div class="flex flex-wrap items-end justify-between gap-6 mb-10">
      <div>
        <h1
          class="font-display text-2xl sm:text-3xl font-bold tracking-tight text-brand-ink m-0 mb-1"
        >
          Kelola Produk
        </h1>
        <p class="text-xs sm:text-sm text-brand-muted m-0">
          Tambah, ubah, dan arsipkan katalog ShelfStack.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <div class="w-full sm:w-[280px]">
          <UiInput
            v-model="searchQuery"
            size="sm"
            left-icon="pi-search"
            placeholder="Cari produk..."
            autocomplete="off"
          />
        </div>

        <div class="w-full sm:w-[170px]">
          <label for="product-sort" class="sr-only">Urutkan tampilan saat ini</label>
          <UiSelect
            id="product-sort"
            v-model="sortOption"
            size="sm"
            title="Mengurutkan tampilan saat ini"
          >
            <option value="name-asc">Nama A-Z</option>
            <option value="price-asc">Termurah</option>
            <option value="price-desc">Termahal</option>
            <option value="stock-asc">Stok tersedikit</option>
          </UiSelect>
        </div>

        <UiButton variant="primary" icon="pi-plus" @click="openAddForm">Tambah Produk</UiButton>
      </div>
    </div>

    <UiTabs v-model="activeTab" :items="tabItems" aria-label="Tampilan katalog produk" />

    <!-- Produk Aktif -->
    <div v-if="activeTab === '0'" class="mt-6">
      <ProductList
        :products="filteredProducts"
        :loading="productStore.loading"
        :is-searching="searchQuery.trim().length > 0"
        @edit="openEditForm"
        @delete="handleDelete"
        @view-stock-movements="openStockMovements"
      />

      <!-- Load More Button -->
      <div v-if="productStore.hasMore && !searchQuery.trim()" class="flex justify-center mt-8 mb-4">
        <UiButton
          variant="secondary"
          icon="pi-sync"
          :loading="productStore.loading"
          @click="productStore.fetchProducts(true)"
        >
          Muat Lebih Banyak
        </UiButton>
      </div>
    </div>

    <!-- Stok Kritis -->
    <div v-else-if="activeTab === '2'" class="mt-6">
      <ProductList
        :products="filteredProducts"
        :loading="productStore.loading"
        :is-searching="searchQuery.trim().length > 0"
        @edit="openEditForm"
        @delete="handleDelete"
        @view-stock-movements="openStockMovements"
      />
    </div>

    <!-- Keranjang Sampah -->
    <div v-else class="mt-6">
      <ProductList
        :products="filteredProducts"
        :loading="productStore.loading"
        :is-searching="searchQuery.trim().length > 0"
        is-trash
        @restore="handleRestore"
      />

      <!-- Load More Button (Trash) -->
      <div
        v-if="productStore.hasMoreDeleted && !searchQuery.trim()"
        class="flex justify-center mt-8 mb-4"
      >
        <UiButton
          variant="secondary"
          icon="pi-sync"
          :loading="productStore.loading"
          @click="productStore.fetchDeletedProducts(true)"
        >
          Muat Lebih Banyak
        </UiButton>
      </div>
    </div>

    <!-- Container for Product Form Modal -->
    <ProductForm
      v-model:visible="isFormVisible"
      :initial-data="editingProduct"
      :loading="productStore.loading"
      @save="handleSave"
    />

    <!-- Container for Stock Movements Audit Modal -->
    <StockMovementsModal
      :show="isStockModalVisible"
      :product="stockAuditProduct"
      @close="isStockModalVisible = false"
    />
  </div>
</template>
