<script setup lang="ts">
import { useProductStore } from '~/features/products/stores/product'
import type { Product } from '~/types/product'
import { useToast } from 'primevue/usetoast'

const product = ref<Product | null>(null)

useSeoMeta({
  title: () => (product.value ? product.value.name : 'Detail Produk'),
})

const route = useRoute()
const router = useRouter()
const productStore = useProductStore()
const toast = useToast()

const loading = ref(true)

onMounted(async () => {
  const id = Number(route.params.id)
  if (!isNaN(id)) {
    try {
      product.value = await productStore.fetchProductById(id)
    } catch (error: any) {
      toast.add({
        severity: 'error',
        summary: 'Gagal Memuat Produk',
        detail: error?.message || 'Terjadi kesalahan.',
        life: 5000,
      })
    }
  }
  loading.value = false
})

const goBack = () => {
  router.push('/')
}
</script>

<template>
  <div class="mx-auto w-full max-w-5xl pt-4">
    <nav aria-label="Breadcrumb" class="mb-6 flex items-center gap-2 text-sm text-brand-muted">
      <NuxtLink to="/" class="no-underline hover:text-brand-body"> Beranda </NuxtLink>
      <i class="pi pi-angle-right text-xs text-brand-faint" aria-hidden="true" />
      <NuxtLink to="/katalog" class="no-underline hover:text-brand-body"> Katalog </NuxtLink>
      <i v-if="product" class="pi pi-angle-right text-xs text-brand-faint" aria-hidden="true" />
      <span v-if="product" class="max-w-60 truncate font-bold text-brand-body">
        {{ product.name }}
      </span>
    </nav>

    <div class="mb-6">
      <Button icon="pi pi-arrow-left" label="Kembali" severity="secondary" text @click="goBack" />
    </div>

    <Card v-if="loading">
      <template #content>
        <div class="grid gap-10 md:grid-cols-2">
          <Skeleton width="100%" height="380px" style="border-radius: 16px" />
          <div class="flex flex-col gap-4">
            <Skeleton width="60%" height="2rem" />
            <Skeleton width="30%" height="1.5rem" />
            <Skeleton width="100%" height="6rem" />
          </div>
        </div>
      </template>
    </Card>

    <Card v-else-if="product" :pt="{ body: { class: '!p-6 md:!p-10' } }">
      <template #content>
        <div class="grid gap-10 md:grid-cols-2">
          <!-- Gambar Produk -->
          <div class="overflow-hidden rounded-[32px]">
            <img
              v-if="product.image_url"
              :src="product.image_url"
              :alt="product.name"
              class="block aspect-[4/3] w-full object-cover"
            />
            <div v-else class="flex aspect-[4/3] w-full items-center justify-center bg-brand-soft">
              <i class="pi pi-image text-5xl text-brand-faint" />
            </div>
          </div>

          <!-- Detail Informasi -->
          <div class="flex flex-col gap-6 py-2">
            <div>
              <h1
                class="m-0 mb-2 text-balance text-4xl font-medium leading-[1.17] text-brand-ink md:text-5xl"
              >
                {{ product.name }}
              </h1>
              <span class="text-[28px] font-bold leading-[1.21] tabular-nums text-brand-body">
                Rp {{ product.price.toLocaleString('id-ID') }}
              </span>
            </div>

            <div>
              <h2 class="m-0 mb-2 text-lg font-bold leading-[1.44]">Deskripsi</h2>
              <p
                class="m-0 max-w-prose whitespace-pre-wrap text-base leading-[1.5] text-brand-muted"
              >
                {{ product.description || 'Tidak ada deskripsi untuk produk ini.' }}
              </p>
            </div>

            <div v-if="product.link">
              <a
                :href="product.link"
                target="_blank"
                rel="noopener"
                class="inline-block rounded-full border-2 border-brand-ink bg-transparent px-[28px] py-[12px] text-sm font-bold text-brand-ink no-underline transition-colors hover:bg-brand-ink hover:text-brand-onink"
              >
                Kunjungi Halaman Referensi
              </a>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <Card v-else>
      <template #content>
        <div class="px-4 py-12 text-center">
          <i
            class="pi pi-exclamation-triangle mb-4 block text-5xl text-surface-400 dark:text-surface-500"
          />
          <h2 class="m-0 mb-2 text-2xl font-bold">Produk Tidak Ditemukan</h2>
          <p class="m-0 mb-6 text-surface-500 dark:text-surface-400">
            Produk yang Anda cari mungkin telah dihapus atau tidak tersedia.
          </p>
          <NuxtLink
            to="/katalog"
            class="inline-block rounded-full bg-brand-ink px-[30px] py-[14px] text-sm font-bold text-brand-onink no-underline transition-colors hover:bg-brand-inkhover"
          >
            Kembali ke Katalog
          </NuxtLink>
        </div>
      </template>
    </Card>
  </div>
</template>
