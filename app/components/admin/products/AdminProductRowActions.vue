<script setup lang="ts">
import type { Product } from '~/types/product'

defineProps<{
  product: Product
  isTrash?: boolean
}>()

const emit = defineEmits<{
  edit: [product: Product]
  delete: [id: number]
  restore: [id: number]
  viewStockMovements: [product: Product]
  manageVariants: [product: Product]
}>()
</script>

<template>
  <div class="inline-flex items-center justify-end gap-0.5">
    <template v-if="isTrash">
      <UiButton size="xs" variant="outline" icon="pi-replay" @click="emit('restore', product.id)">
        Restore
      </UiButton>
    </template>
    <template v-else>
      <UiTooltip text="Kelola Varian" position="top">
        <UiIconButton
          icon="pi-sitemap"
          label="Kelola Varian Produk"
          size="sm"
          @click="emit('manageVariants', product)"
        />
      </UiTooltip>
      <UiTooltip text="Riwayat Mutasi Stok" position="top">
        <UiIconButton
          icon="pi-history"
          label="Riwayat Mutasi Stok"
          size="sm"
          @click="emit('viewStockMovements', product)"
        />
      </UiTooltip>
      <UiTooltip text="Ubah Produk" position="top">
        <UiIconButton
          icon="pi-pencil"
          label="Ubah Produk"
          size="sm"
          @click="emit('edit', product)"
        />
      </UiTooltip>
      <UiTooltip text="Hapus Produk" position="top" align="end">
        <UiIconButton
          icon="pi-trash"
          label="Hapus Produk"
          variant="danger"
          size="sm"
          @click="emit('delete', product.id)"
        />
      </UiTooltip>
    </template>
  </div>
</template>
