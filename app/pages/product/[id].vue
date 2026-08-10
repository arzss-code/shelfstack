<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductStore, type Product } from '~/stores/product'

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()

const product = ref<Product | null>(null)
const loading = ref(true)

onMounted(async () => {
  const id = Number(route.params.id)
  if (!isNaN(id)) {
    product.value = await productStore.fetchProductById(id)
  }
  loading.value = false
})

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div style="max-width: 800px; margin: 0 auto; padding-top: 1rem;">
    <div style="margin-bottom: 1.5rem;">
      <Button icon="pi pi-arrow-left" label="Kembali" severity="secondary" text @click="goBack" />
    </div>

    <Card v-if="loading">
      <template #content>
        <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
          <Skeleton width="300px" height="300px" borderRadius="12px" />
          <div style="flex: 1; display: flex; flex-direction: column; gap: 1rem;">
            <Skeleton width="60%" height="2rem" />
            <Skeleton width="30%" height="1.5rem" />
            <Skeleton width="100%" height="6rem" />
          </div>
        </div>
      </template>
    </Card>

    <Card v-else-if="product">
      <template #content>
        <div style="display: flex; gap: 2.5rem; flex-wrap: wrap;">
          <!-- Gambar Produk -->
          <div style="flex-shrink: 0; width: 350px;">
            <img 
              v-if="product.image_url" 
              :src="product.image_url" 
              :alt="product.name" 
              style="width: 100%; height: auto; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" 
            />
            <div 
              v-else 
              style="width: 100%; height: 350px; background-color: var(--p-surface-200); border-radius: 12px; display: flex; align-items: center; justify-content: center;"
            >
              <i class="pi pi-image" style="font-size: 4rem; color: var(--p-text-muted-color);"></i>
            </div>
          </div>

          <!-- Detail Informasi -->
          <div style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">
            <div>
              <h1 style="margin: 0 0 0.5rem 0; font-size: 2rem; color: var(--p-text-color);">{{ product.name }}</h1>
              <span style="font-size: 1.5rem; font-weight: 600; color: var(--p-primary-color);">
                Rp {{ product.price.toLocaleString('id-ID') }}
              </span>
            </div>

            <div>
              <h3 style="margin: 0 0 0.5rem 0; color: var(--p-text-color);">Deskripsi</h3>
              <p style="margin: 0; line-height: 1.6; color: var(--p-text-muted-color); white-space: pre-wrap;">
                {{ product.description || 'Tidak ada deskripsi untuk produk ini.' }}
              </p>
            </div>

            <div v-if="product.link" style="margin-top: 1rem;">
              <a :href="product.link" target="_blank" style="text-decoration: none;">
                <Button label="Kunjungi Halaman Referensi" icon="pi pi-external-link" severity="primary" />
              </a>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <Card v-else>
      <template #content>
        <div style="text-align: center; padding: 3rem;">
          <i class="pi pi-exclamation-triangle" style="font-size: 3rem; color: var(--p-text-muted-color); margin-bottom: 1rem;"></i>
          <h2>Produk Tidak Ditemukan</h2>
          <p style="color: var(--p-text-muted-color);">Produk yang Anda cari mungkin telah dihapus atau tidak tersedia.</p>
        </div>
      </template>
    </Card>
  </div>
</template>
