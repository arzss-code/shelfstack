<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProductStore, type Product } from '~/stores/product'

const productStore = useProductStore()

const isFormVisible = ref(false)
const editingProduct = ref<Product | null>(null)

onMounted(async () => {
  await productStore.fetchProducts()
})

const openAddForm = () => {
  editingProduct.value = null
  isFormVisible.value = true
}

const openEditForm = (product: Product) => {
  editingProduct.value = product
  isFormVisible.value = true
}

const handleSave = async (name: string, price: number, file: File | null) => {
  if (editingProduct.value) {
    await productStore.updateProduct(editingProduct.value.id, name, price, file)
  } else {
    await productStore.addProduct(name, price, file)
  }
}

const handleDelete = async (id: number) => {
  if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
    await productStore.deleteProduct(id)
  }
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 2rem;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
      <div>
        <h1 style="margin-bottom: 0.5rem;">Product Management</h1>
        <p style="color: var(--p-text-muted-color); margin-top: 0;">Kelola daftar produk, harga, dan gambar dari Supabase.</p>
      </div>
      <Button label="Tambah Produk" icon="pi pi-plus" @click="openAddForm" />
    </div>

    <!-- Container for Product List -->
    <ProductList 
      :products="productStore.products" 
      :loading="productStore.loading"
      @edit="openEditForm"
      @delete="handleDelete"
    />

    <!-- Container for Product Form Modal -->
    <ProductForm 
      v-model:visible="isFormVisible" 
      :initial-data="editingProduct" 
      @save="handleSave" 
    />
  </div>
</template>