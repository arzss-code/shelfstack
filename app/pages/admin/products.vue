<script setup lang="ts">
import ProductList from '~/features/products/components/ProductList.vue'
import ProductForm from '~/features/products/components/ProductForm.vue'
import StockMovementsModal from '~/features/products/components/StockMovementsModal.vue'
import AdminProductVariantsModal from '~/components/admin/products/AdminProductVariantsModal.vue'
import AdminCategoryManagerModal from '~/components/admin/products/AdminCategoryManagerModal.vue'

useSeoMeta({
  title: 'Kelola Produk',
})

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  productStore,
  isFormVisible,
  editingProduct,
  isStockModalVisible,
  stockAuditProduct,
  isVariantModalVisible,
  variantProduct,
  isCategoryModalVisible,
  searchQuery,
  activeTab,
  sortOption,
  sortOptionsList,
  tabItems,
  filteredProducts,
  openStockMovements,
  openVariantsModal,
  openCategoryManagerModal,
  openAddForm,
  openEditForm,
  handleSave,
  handleDelete,
  handleRestore,
} = useAdminProducts()

const handleProductRestocked = (newStock: number) => {
  if (stockAuditProduct.value) {
    stockAuditProduct.value.stock = newStock
  }
  productStore.fetchProducts()
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
            :options="sortOptionsList"
            size="sm"
            title="Mengurutkan tampilan saat ini"
          />
        </div>

        <UiButton variant="secondary" icon="pi-tags" @click="openCategoryManagerModal">
          Kelola Kategori
        </UiButton>
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
        @manage-variants="openVariantsModal"
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
        @manage-variants="openVariantsModal"
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
      @restocked="handleProductRestocked"
    />

    <!-- Container for Variant Matrix Modal -->
    <AdminProductVariantsModal
      :show="isVariantModalVisible"
      :product="variantProduct"
      @close="isVariantModalVisible = false"
      @updated="productStore.fetchProducts()"
    />

    <!-- Container for Category CRUD Modal -->
    <AdminCategoryManagerModal
      :show="isCategoryModalVisible"
      @close="isCategoryModalVisible = false"
      @updated="productStore.fetchProducts()"
    />
  </div>
</template>
