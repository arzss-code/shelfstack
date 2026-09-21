<script setup lang="ts">
import { useProductStore } from '~/features/products/stores/product'
import { useToast } from 'primevue/usetoast'
import ProductList from '~/features/products/components/ProductList.vue'

useSeoMeta({
  title: 'ShelfStack — Etalase & Admin Produk',
  description:
    'ShelfStack: etalase publik yang cepat dan jelas, plus dashboard admin untuk kelola produk, stok, dan audit. Dibangun dengan Nuxt 4 dan Supabase.',
})

interface Category {
  id: string
  name: string
  slug: string
}

const productStore = useProductStore()
const toast = useToast()

const categories = ref<Category[]>([])
const featured = computed(() => productStore.products.slice(0, 6))

// Visual hero memakai foto produk asli bila ada, fallback foto netral.
const heroProduct = computed(
  () => productStore.products.find((p) => p.image_url) ?? productStore.products[0] ?? null,
)
const heroImage = computed(
  () => heroProduct.value?.image_url || 'https://picsum.photos/seed/shelfstack-hero/880/660',
)

onMounted(async () => {
  try {
    await productStore.fetchProducts()
  } catch (error: unknown) {
    toast.add({
      severity: 'error',
      summary: 'Gagal Memuat Etalase',
      detail: error instanceof Error ? error.message : 'Gagal mengambil daftar produk.',
      life: 5000,
    })
  }

  try {
    const res = await $fetch<{ status: string; data: Category[] }>('/api/categories')
    categories.value = res.data ?? []
  } catch {
    // Kategori opsional di beranda (tabel baru ada setelah migrasi Fase 1 di-push)
    categories.value = []
  }
})
</script>

<template>
  <div>
    <!-- Hero: foto memimpin, copy ringkas, dua CTA (button-primary + button-secondary) -->
    <section class="grid items-center gap-8 py-12 md:grid-cols-12 md:py-20">
      <div class="md:col-span-5">
        <h1
          class="m-0 mb-5 max-w-xl text-balance text-4xl font-medium leading-[1.16] text-brand-ink md:text-[64px]"
        >
          Etalase rapi di depan, operasional tertib di belakang.
        </h1>
        <p class="m-0 mb-8 max-w-xl text-lg leading-[1.44] text-brand-body">
          Etalase publik yang cepat dan jelas, plus dashboard admin untuk kelola produk, stok, dan
          audit.
        </p>
        <div class="flex flex-wrap gap-4">
          <NuxtLink
            to="/katalog"
            class="rounded-full bg-brand-ink px-[30px] py-[14px] text-sm font-bold text-brand-onink no-underline transition-colors hover:bg-brand-inkhover"
          >
            Lihat Katalog
          </NuxtLink>
          <NuxtLink
            to="/auth/login"
            class="rounded-full border-2 border-brand-ink bg-transparent px-[28px] py-[12px] text-sm font-bold text-brand-ink no-underline transition-colors hover:bg-brand-ink hover:text-brand-onink"
          >
            Masuk
          </NuxtLink>
        </div>
      </div>

      <div class="relative md:col-span-7">
        <div class="overflow-hidden rounded-[32px]">
          <img
            :src="heroImage"
            :alt="heroProduct ? heroProduct.name : 'Etalase ShelfStack'"
            width="880"
            height="660"
            fetchpriority="high"
            class="block aspect-[4/3] w-full object-cover"
          />
        </div>
        <NuxtLink
          v-if="heroProduct"
          :to="`/product/${heroProduct.id}`"
          class="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4 rounded-2xl border border-brand-hairsoft bg-brand-canvas px-6 py-4 no-underline shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-colors hover:border-brand-ink sm:right-auto"
        >
          <span>
            <span class="block max-w-52 truncate text-base font-bold text-brand-body">
              {{ heroProduct.name }}
            </span>
            <span class="block text-base font-bold tabular-nums text-brand-body">
              Rp {{ heroProduct.price.toLocaleString('id-ID') }}
            </span>
          </span>
          <span
            class="shrink-0 rounded-full bg-brand-cobalt px-5 py-2.5 text-sm font-bold text-white"
          >
            Lihat detail
          </span>
        </NuxtLink>
      </div>
    </section>

    <!-- Kategori: pill tabs -->
    <section v-if="categories.length > 0" class="pb-20">
      <div class="mb-6 flex items-end justify-between gap-4">
        <h2 class="m-0 text-4xl font-medium leading-[1.17] md:text-5xl">Jelajah Kategori</h2>
        <NuxtLink
          to="/katalog"
          class="shrink-0 text-base font-bold text-brand-cobaltdeep no-underline"
        >
          Lihat semua
        </NuxtLink>
      </div>
      <div class="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
        <NuxtLink
          v-for="cat in categories"
          :key="cat.id"
          to="/katalog"
          class="shrink-0 rounded-full border border-brand-hair bg-brand-canvas px-4 py-2 text-sm font-bold text-brand-body no-underline transition-colors hover:border-brand-ink"
        >
          {{ cat.name }}
        </NuxtLink>
      </div>
    </section>

    <!-- Produk Unggulan -->
    <section class="pb-20">
      <div class="mb-8">
        <h2 class="m-0 mb-2 text-4xl font-medium leading-[1.17] md:text-5xl">Produk Unggulan</h2>
        <div class="flex items-end justify-between gap-4">
          <p class="m-0 text-lg text-brand-body">
            Pilihan terlaris minggu ini, langsung dari katalog.
          </p>
          <NuxtLink
            to="/katalog"
            class="shrink-0 text-base font-bold text-brand-cobaltdeep no-underline"
          >
            Lihat semua
          </NuxtLink>
        </div>
      </div>
      <ProductList :products="featured" :loading="productStore.loading" hide-actions />
    </section>

    <!-- Kenapa: editorial rows -->
    <section class="pb-20">
      <h2 class="m-0 mb-2 text-4xl font-medium leading-[1.17] md:text-5xl">Kenapa ShelfStack</h2>
      <div class="divide-y divide-brand-hairsoft">
        <div class="flex gap-6 py-8">
          <i class="pi pi-th-large mt-1 shrink-0 text-2xl text-brand-body" />
          <div>
            <h3 class="m-0 mb-1 text-2xl font-medium leading-[1.25]">Satu katalog, dua wajah</h3>
            <p class="m-0 max-w-2xl text-base leading-[1.5] text-brand-muted">
              Nama, harga, foto, dan deskripsi dikelola sekali di dashboard lalu tampil konsisten di
              etalase. Tidak ada data ganda yang bisa basi sebelah.
            </p>
          </div>
        </div>
        <div class="flex gap-6 py-8">
          <i class="pi pi-shield mt-1 shrink-0 text-2xl text-brand-body" />
          <div>
            <h3 class="m-0 mb-1 text-2xl font-medium leading-[1.25]">Aksi penting dijaga peran</h3>
            <p class="m-0 max-w-2xl text-base leading-[1.5] text-brand-muted">
              Pengunjung hanya membaca etalase. Tambah, ubah, hapus, dan restore butuh akun admin,
              dan aturannya ditegakkan sampai level database.
            </p>
          </div>
        </div>
        <div class="flex gap-6 py-8">
          <i class="pi pi-history mt-1 shrink-0 text-2xl text-brand-body" />
          <div>
            <h3 class="m-0 mb-1 text-2xl font-medium leading-[1.25]">Semua tercatat otomatis</h3>
            <p class="m-0 max-w-2xl text-base leading-[1.5] text-brand-muted">
              Setiap perubahan produk masuk Activity Log realtime. Audit berjalan sendiri tanpa
              kerja tambahan.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Strip promo -->
    <section class="mb-20 rounded-[32px] bg-brand-strip px-8 py-16 md:px-16">
      <div class="flex flex-wrap items-center justify-between gap-8">
        <div class="max-w-xl">
          <h2 class="m-0 mb-3 text-4xl font-medium leading-[1.17] text-white md:text-5xl">
            Kelola katalogmu sendiri
          </h2>
          <p class="m-0 text-lg leading-[1.44] text-white/80">
            Masuk untuk tambah produk, atur stok, dan pantau aktivitas toko dari satu dashboard.
          </p>
        </div>
        <NuxtLink
          to="/auth/login"
          class="rounded-full bg-white px-[30px] py-[14px] text-sm font-bold text-[#0a1317] no-underline transition-colors hover:bg-brand-soft"
        >
          Masuk
        </NuxtLink>
      </div>
    </section>

    <!-- Kaki landing -->
    <footer class="border-t border-brand-hairsoft px-1 py-16">
      <div class="grid gap-10 md:grid-cols-12">
        <div class="md:col-span-6">
          <span class="text-lg font-bold tracking-tight">ShelfStack</span>
          <p class="m-0 mt-2 max-w-sm text-sm leading-[1.43] text-brand-muted">
            Etalase publik dan dashboard admin untuk katalog produk. Rapi di depan, tertib di
            belakang.
          </p>
        </div>
        <nav class="md:col-span-3" aria-label="Belanja">
          <h3 class="m-0 mb-3 text-sm font-bold">Belanja</h3>
          <ul class="m-0 list-none p-0 text-sm">
            <li>
              <NuxtLink to="/katalog" class="no-underline text-brand-muted hover:text-brand-body">
                Katalog
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <nav class="md:col-span-3" aria-label="Admin">
          <h3 class="m-0 mb-3 text-sm font-bold">Admin</h3>
          <ul class="m-0 list-none p-0 text-sm">
            <li class="mb-2">
              <NuxtLink
                to="/auth/login"
                class="no-underline text-brand-muted hover:text-brand-body"
              >
                Masuk
              </NuxtLink>
            </li>
            <li class="mb-2">
              <NuxtLink
                to="/admin/products"
                class="no-underline text-brand-muted hover:text-brand-body"
              >
                Kelola Produk
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                to="/admin/activities"
                class="no-underline text-brand-muted hover:text-brand-body"
              >
                Activity Log
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
      <div
        class="mt-10 flex flex-wrap justify-between gap-4 border-t border-brand-hairsoft pt-6 text-xs text-brand-faint"
      >
        <span>ShelfStack. Etalase dan admin katalog.</span>
        <span>Dibangun dengan Nuxt 4 dan Supabase</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>
