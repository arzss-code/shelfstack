<script setup lang="ts">
import { useProductForm, type ProductFormInitialData } from '~/composables/useProductForm'

const props = defineProps<{
  initialData?: ProductFormInitialData | null
  loading?: boolean
}>()

const emit = defineEmits<{
  save: [
    name: string,
    price: number,
    description: string | null,
    link: string | null,
    file: File | null,
    stock: number,
    categoryId: string | null,
  ]
  cancel: []
}>()

const visible = defineModel<boolean>('visible', { default: false })

const {
  name,
  selectedFile,
  errors,
  priceModel,
  stockModel,
  categoryIdModel,
  categorySelectOptions,
  linkModel,
  descriptionModel,
  imageHint,
  onFileReject,
  handleSave,
  handleCancel,
} = useProductForm(() => props.initialData, visible, {
  onSave: (payload) => {
    emit(
      'save',
      payload.name,
      payload.price,
      payload.description,
      payload.link,
      payload.file,
      payload.stock,
      payload.categoryId,
    )
  },
  onCancel: () => emit('cancel'),
})
</script>

<template>
  <UiModal
    v-model:visible="visible"
    size="md"
    :title="initialData ? 'Edit Produk' : 'Tambah Produk'"
  >
    <div class="grid w-full grid-cols-1 gap-4">
      <!-- Nama Produk -->
      <UiInput
        id="name"
        v-model="name"
        label="Nama Produk"
        type="text"
        autocomplete="off"
        placeholder="Contoh: Kemeja Linen Vintage"
        :error="errors.name"
      />

      <!-- Kategori Produk Dropdown -->
      <UiSelect
        id="category"
        v-model="categoryIdModel"
        :options="categorySelectOptions"
        label="Kategori Produk"
        placeholder="Pilih Kategori"
        block
        :error="errors.category_id"
      />

      <!-- Harga & Stok (Grid 2 Kolom) -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <UiInput
          id="price"
          v-model="priceModel"
          label="Harga (IDR)"
          type="number"
          numeric
          :step="1"
          placeholder="Contoh: 150000"
          :error="errors.price"
        />

        <UiInput
          id="stock"
          v-model="stockModel"
          label="Stok Fisik"
          type="number"
          numeric
          :min="0"
          :step="1"
          :error="errors.stock"
        />
      </div>

      <!-- Deskripsi -->
      <UiTextarea id="description" v-model="descriptionModel" label="Deskripsi" :rows="3" />

      <!-- Tautan Referensi -->
      <UiInput
        id="link"
        v-model="linkModel"
        label="Tautan Referensi (Opsional)"
        type="text"
        placeholder="https://..."
        :error="errors.link"
      />

      <!-- Upload Gambar -->
      <UiFileField
        v-model="selectedFile"
        label="Gambar Produk"
        accept="image/jpeg,image/png,image/webp"
        :hint="imageHint"
        @reject="onFileReject"
      />
    </div>

    <template #footer>
      <UiButton variant="secondary" @click="handleCancel">Batal</UiButton>
      <UiButton variant="primary" :loading="loading" @click="handleSave">Simpan</UiButton>
    </template>
  </UiModal>
</template>
