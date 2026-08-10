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
          
          <Column header="Gambar" style="width: 10%">
            <template #body="slotProps">
              <img v-if="slotProps.data.image_url" :src="slotProps.data.image_url" alt="Produk" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" />
              <div v-else style="width: 50px; height: 50px; background-color: var(--p-surface-200); border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                <i class="pi pi-image" style="color: var(--p-text-muted-color);"></i>
              </div>
            </template>
          </Column>
          
          <Column field="name" header="Nama Produk" style="width: 25%"></Column>
          
          <Column field="price" header="Harga" style="width: 15%">
            <template #body="slotProps">
              <span style="font-weight: 600; color: var(--p-primary-color);">Rp {{ slotProps.data.price.toLocaleString('id-ID') }}</span>
            </template>
          </Column>

          <Column field="description" header="Deskripsi" style="width: 25%">
            <template #body="slotProps">
              <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; color: var(--p-text-muted-color);">
                {{ slotProps.data.description || '-' }}
              </div>
            </template>
          </Column>

          <Column field="link" header="Link" style="width: 10%">
            <template #body="slotProps">
              <a v-if="slotProps.data.link" :href="slotProps.data.link" target="_blank" style="color: var(--p-primary-color); text-decoration: none;">
                <i class="pi pi-external-link"></i> Buka
              </a>
              <span v-else style="color: var(--p-text-muted-color);">-</span>
            </template>
          </Column>

          <Column style="width: 20%">
            <template #body="slotProps">
              <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <NuxtLink :to="`/product/${slotProps.data.id}`" style="text-decoration: none;">
                  <Button icon="pi pi-eye" severity="secondary" rounded text aria-label="Detail" />
                </NuxtLink>
                <Button icon="pi pi-pencil" severity="info" rounded text aria-label="Edit" @click="emit('edit', slotProps.data)" />
                <Button icon="pi pi-trash" severity="danger" rounded text aria-label="Delete" @click="emit('delete', slotProps.data.id)" />
              </div>
            </template>
          </Column>
      </DataTable>
    </template>
  </Card>
</template>
