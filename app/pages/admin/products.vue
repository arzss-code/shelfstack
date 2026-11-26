<script setup lang="ts">
import AdminPageHeader from '~/components/admin/AdminPageHeader.vue'
import ProductList from '~/features/products/components/ProductList.vue'
import AdminProductTable from '~/components/admin/products/AdminProductTable.vue'
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
  viewMode,
  sortOptionsList,
  tabItems,
  filteredProducts,
  setViewMode,
  resetProductFilters,
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
  <div class="space-y-5">
    <AdminPageHeader title="Kelola Produk" subtitle="Daftar produk, varian, harga, dan stok.">
      <template #actions>
        <UiButton variant="outline" size="sm" icon="pi-tags" @click="openCategoryManagerModal">
          Kategori
        </UiButton>
        <UiButton variant="primary" size="sm" icon="pi-plus" @click="openAddForm">
          Tambah Produk
        </UiButton>
      </template>
    </AdminPageHeader>

    <!-- Toolbar Tabs, Filter, & View Mode -->
    <div
      class="flex flex-col gap-3 rounded-card border border-brand-hair bg-brand-canvas p-3 shadow-whisper"
    >
      <div class="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
        <UiTabs
          v-model="activeTab"
          :items="tabItems"
          aria-label="Tampilan katalog produk"
          class="self-start max-w-full xl:shrink-0"
        />

        <div class="flex flex-wrap items-center gap-2">
          <div class="w-full sm:w-48">
            <label for="admin-products-search" class="sr-only">Cari produk</label>
            <UiInput
              id="admin-products-search"
              v-model="searchQuery"
              size="sm"
              type="search"
              left-icon="pi-search"
              placeholder="Cari produk..."
              autocomplete="off"
            />
          </div>

          <div class="w-full sm:w-40">
            <label for="product-sort" class="sr-only">Urutkan tampilan saat ini</label>
            <UiSelect
              id="product-sort"
              v-model="sortOption"
              :options="sortOptionsList"
              size="sm"
              block
              prefix="Urut:"
              title="Mengurutkan tampilan saat ini"
            />
          </div>

          <div
            role="group"
            aria-label="Mode tampilan daftar produk"
            class="inline-flex items-center rounded-full border border-brand-hair bg-brand-canvas-soft p-0.5 shrink-0"
          >
            <button
              type="button"
              :aria-pressed="viewMode === 'grid'"
              data-testid="products-view-grid"
              :class="[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer border-0',
                viewMode === 'grid'
                  ? 'bg-brand-ink text-brand-onink shadow-whisper'
                  : 'bg-transparent text-brand-muted hover:text-brand-ink',
              ]"
              @click="setViewMode('grid')"
            >
              <i class="pi pi-th-large text-[11px]" aria-hidden="true" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              :aria-pressed="viewMode === 'table'"
              data-testid="products-view-table"
              :class="[
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer border-0',
                viewMode === 'table'
                  ? 'bg-brand-ink text-brand-onink shadow-whisper'
                  : 'bg-transparent text-brand-muted hover:text-brand-ink',
              ]"
              @click="setViewMode('table')"
            >
              <i class="pi pi-table text-[11px]" aria-hidden="true" />
              <span>Tabel</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Produk Aktif & Stok Kritis -->
    <div v-if="activeTab !== '1'" class="space-y-4">
      <AdminProductTable
        v-if="viewMode === 'table'"
        :products="filteredProducts"
        :loading="productStore.loading"
        :is-searching="searchQuery.trim().length > 0"
        @edit="openEditForm"
        @delete="handleDelete"
        @view-stock-movements="openStockMovements"
        @manage-variants="openVariantsModal"
        @reset-filters="resetProductFilters"
      />
      <ProductList
        v-else
        :products="filteredProducts"
        :loading="productStore.loading"
        :is-searching="searchQuery.trim().length > 0"
        density="admin"
        @edit="openEditForm"
        @delete="handleDelete"
        @view-stock-movements="openStockMovements"
        @manage-variants="openVariantsModal"
        @reset-filters="resetProductFilters"
      />

      <!-- Load More Button -->
      <div
        v-if="
          viewMode === 'grid' && activeTab === '0' && productStore.hasMore && !searchQuery.trim()
        "
        class="flex justify-center pt-2"
      >
        <UiButton
          variant="outline"
          size="sm"
          icon="pi-sync"
          :loading="productStore.loading"
          @click="productStore.fetchProducts(true)"
        >
          Muat Lebih Banyak
        </UiButton>
      </div>
    </div>

    <!-- Keranjang Sampah -->
    <div v-else class="space-y-4">
      <AdminProductTable
        v-if="viewMode === 'table'"
        :products="filteredProducts"
        :loading="productStore.loading"
        :is-searching="searchQuery.trim().length > 0"
        is-trash
        @restore="handleRestore"
        @reset-filters="resetProductFilters"
      />
      <ProductList
        v-else
        :products="filteredProducts"
        :loading="productStore.loading"
        :is-searching="searchQuery.trim().length > 0"
        density="admin"
        is-trash
        @restore="handleRestore"
        @reset-filters="resetProductFilters"
      />

      <!-- Load More Button (Trash) -->
      <div
        v-if="viewMode === 'grid' && productStore.hasMoreDeleted && !searchQuery.trim()"
        class="flex justify-center pt-2"
      >
        <UiButton
          variant="outline"
          size="sm"
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
