<script setup lang="ts">
import { useProductStore } from '~/features/products/stores/product'
import type { Product } from '~/types/product'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import ProductList from '~/features/products/components/ProductList.vue'
import ProductForm from '~/features/products/components/ProductForm.vue'
import StockMovementsModal from '~/features/products/components/StockMovementsModal.vue'

useSeoMeta({
  title: 'Kelola Produk',
})

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const productStore = useProductStore()
const toast = useToast()
const confirm = useConfirm()

const isFormVisible = ref(false)
const editingProduct = ref<Product | null>(null)
const isStockModalVisible = ref(false)
const stockAuditProduct = ref<Product | null>(null)
const searchQuery = ref('')
const activeTab = ref('0')

const openStockMovements = (product: Product) => {
  stockAuditProduct.value = product
  isStockModalVisible.value = true
}

const criticalStockProducts = computed(() => {
  return productStore.products.filter((p) => (p.stock ?? 0) < 5)
})

const filteredProducts = computed(() => {
  let sourceList: Product[] = []
  if (activeTab.value === '0') {
    sourceList = productStore.products
  } else if (activeTab.value === '1') {
    sourceList = productStore.deletedProducts
  } else if (activeTab.value === '2') {
    sourceList = criticalStockProducts.value
  }
  if (!searchQuery.value.trim()) return sourceList
  const query = searchQuery.value.toLowerCase()
  return sourceList.filter((p) => p.name.toLowerCase().includes(query))
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
    icon: 'pi pi-exclamation-triangle',
    acceptProps: { label: 'Hapus', severity: 'danger' },
    rejectProps: { label: 'Batal', severity: 'secondary', outlined: true },
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
    icon: 'pi pi-info-circle',
    acceptProps: { label: 'Restore', severity: 'success' },
    rejectProps: { label: 'Batal', severity: 'secondary', outlined: true },
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
    <div class="flex justify-between items-end mb-10 flex-wrap gap-6">
      <div>
        <h1 class="m-0 mb-1 text-4xl font-bold tracking-tight text-surface-900 dark:text-surface-0">
          Kelola Produk
        </h1>
        <p class="m-0 text-lg text-surface-500 dark:text-surface-400">
          Tambah, ubah, dan arsipkan katalog ShelfStack.
        </p>
      </div>

      <div class="flex gap-4 items-center flex-wrap">
        <IconField icon-position="left">
          <InputIcon class="pi pi-search text-surface-400 dark:text-surface-500" />
          <InputText v-model="searchQuery" placeholder="Cari produk..." class="w-[280px]" />
        </IconField>

        <Button label="Tambah Produk" icon="pi pi-plus" severity="primary" @click="openAddForm" />
      </div>
    </div>

    <Tabs v-model:value="activeTab" class="!bg-transparent">
      <TabList class="!bg-transparent">
        <Tab value="0">Produk Aktif</Tab>
        <Tab value="2">
          <div class="flex items-center gap-2">
            <span>Stok Kritis</span>
            <span
              v-if="criticalStockProducts.length > 0"
              class="rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-bold px-2 py-0.5 text-[10px]"
            >
              {{ criticalStockProducts.length }}
            </span>
          </div>
        </Tab>
        <Tab value="1">Keranjang Sampah</Tab>
      </TabList>
      <TabPanels class="px-0 pb-0 !bg-transparent">
        <TabPanel value="0">
          <ProductList
            :products="filteredProducts"
            :loading="productStore.loading"
            :is-searching="searchQuery.trim().length > 0"
            @edit="openEditForm"
            @delete="handleDelete"
            @view-stock-movements="openStockMovements"
          />

          <!-- Load More Button -->
          <div
            v-if="productStore.hasMore && !searchQuery.trim()"
            class="flex justify-center mt-8 mb-4"
          >
            <Button
              label="Muat Lebih Banyak"
              icon="pi pi-sync"
              :loading="productStore.loading"
              severity="secondary"
              rounded
              @click="productStore.fetchProducts(true)"
            />
          </div>
        </TabPanel>

        <TabPanel value="2">
          <ProductList
            :products="filteredProducts"
            :loading="productStore.loading"
            :is-searching="searchQuery.trim().length > 0"
            @edit="openEditForm"
            @delete="handleDelete"
            @view-stock-movements="openStockMovements"
          />
        </TabPanel>

        <TabPanel value="1">
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
            <Button
              label="Muat Lebih Banyak"
              icon="pi pi-sync"
              :loading="productStore.loading"
              severity="secondary"
              rounded
              @click="productStore.fetchDeletedProducts(true)"
            />
          </div>
        </TabPanel>
      </TabPanels>
    </Tabs>

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
