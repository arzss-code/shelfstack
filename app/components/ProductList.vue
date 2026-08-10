<script setup lang="ts">
import type { Product } from '~/stores/product'

defineProps<{
  products: Product[]
  loading: boolean
}>()

const emit = defineEmits<{
  edit: [product: Product]
  delete: [id: number]
}>()
</script>

<template>
  <Card>
    <template #content>
      <DataTable :value="products" :loading="loading" stripedRows tableStyle="min-width: 100%">
          <template #empty>Belum ada produk.</template>
          
          <Column header="Gambar" style="width: 15%">
            <template #body="slotProps">
              <img v-if="slotProps.data.image_url" :src="slotProps.data.image_url" alt="Produk" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />
              <div v-else style="width: 50px; height: 50px; background-color: var(--p-surface-200); border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                <i class="pi pi-image" style="color: var(--p-text-muted-color);"></i>
              </div>
            </template>
          </Column>
          
          <Column field="name" header="Nama Produk" style="width: 45%"></Column>
          
          <Column field="price" header="Harga" style="width: 20%">
            <template #body="slotProps">
              <span style="font-weight: 600; color: var(--p-primary-color);">${{ slotProps.data.price }}</span>
            </template>
          </Column>

          <Column style="width: 20%">
            <template #body="slotProps">
              <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <Button icon="pi pi-pencil" severity="info" rounded text aria-label="Edit" @click="emit('edit', slotProps.data)" />
                <Button icon="pi pi-trash" severity="danger" rounded text aria-label="Delete" @click="emit('delete', slotProps.data.id)" />
              </div>
            </template>
          </Column>
      </DataTable>
    </template>
  </Card>
</template>
