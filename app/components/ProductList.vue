<script setup lang="ts">
import type { Product } from "~/types/product";

defineProps<{
  products: Product[];
  loading: boolean;
  isSearching?: boolean;
}>();

const emit = defineEmits<{
  edit: [product: Product];
  delete: [id: number];
}>();

const router = useRouter();
</script>

<template>
  <div>
    <!-- Loading State: Skeleton Grid -->
    <div
      v-if="loading"
      class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6"
    >
      <Card v-for="i in 6" :key="i">
        <template #header>
          <Skeleton height="200px" style="border-radius: 12px 12px 0 0" />
        </template>
        <template #title>
          <Skeleton width="80%" height="1.5rem" />
        </template>
        <template #subtitle>
          <Skeleton width="40%" height="1rem" />
        </template>
        <template #content>
          <Skeleton width="100%" height="3rem" />
        </template>
        <template #footer>
          <div class="flex gap-2 justify-end">
            <Skeleton shape="circle" size="2.5rem" />
            <Skeleton shape="circle" size="2.5rem" />
            <Skeleton shape="circle" size="2.5rem" />
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="products.length === 0"
      class="text-center py-16 px-8 bg-[color:var(--p-content-background)] rounded-2xl border border-dashed border-[color:var(--p-content-border-color)]"
    >
      <template v-if="isSearching">
        <i
          class="pi pi-search text-4xl text-[color:var(--p-text-muted-color)] mb-6"
        ></i>
        <h3
          class="m-0 mb-2 text-[color:var(--p-text-color)] font-semibold text-xl"
        >
          Pencarian tidak ditemukan
        </h3>
        <p class="m-0 text-[color:var(--p-text-muted-color)]">
          Tidak ada produk yang cocok dengan kata kunci pencarian Anda.
        </p>
      </template>
      <template v-else>
        <i
          class="pi pi-box text-4xl text-[color:var(--p-text-muted-color)] mb-6"
        ></i>
        <h3
          class="m-0 mb-2 text-[color:var(--p-text-color)] font-semibold text-xl"
        >
          Katalog masih kosong
        </h3>
        <p class="m-0 text-[color:var(--p-text-muted-color)]">
          Silakan klik tombol "Tambah Produk" untuk mulai mengelola etalase.
        </p>
      </template>
    </div>

    <!-- Product Grid -->
    <div
      v-else
      class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6"
    >
      <div
        v-for="product in products"
        :key="product.id"
        class="product-card"
        @click="router.push(`/product/${product.id}`)"
      >
        <!-- Image Container -->
        <div
          class="relative pt-[66.66%] w-full border-b border-[color:var(--p-content-border-color)]"
        >
          <img
            v-if="product.image_url"
            :src="product.image_url"
            :alt="product.name"
            class="absolute top-0 left-0 w-full h-full object-cover"
          />
          <div
            v-else
            class="absolute top-0 left-0 w-full h-full bg-[color:var(--p-surface-100)] flex items-center justify-center"
          >
            <i
              class="pi pi-image text-4xl text-[color:var(--p-text-muted-color)]"
            ></i>
          </div>
        </div>

        <!-- Content -->
        <div class="p-5 flex flex-col flex-grow">
          <h3
            class="m-0 mb-1 text-[1.15rem] font-semibold text-[color:var(--p-text-color)] whitespace-nowrap overflow-hidden text-ellipsis"
          >
            {{ product.name }}
          </h3>
          <span
            class="text-base font-semibold text-[color:var(--p-primary-color)] mb-3"
          >
            Rp {{ product.price.toLocaleString("id-ID") }}
          </span>

          <p
            class="m-0 mb-5 text-[color:var(--p-text-muted-color)] text-[0.9rem] leading-relaxed line-clamp-2 flex-grow"
          >
            {{ product.description || "Tidak ada deskripsi." }}
          </p>

          <!-- Actions -->
          <div class="flex justify-between items-center mt-auto" @click.stop>
            <a
              v-if="product.link"
              :href="product.link"
              target="_blank"
              class="product-link"
            >
              <i class="pi pi-external-link text-[0.75rem]"></i>
              Referensi
            </a>
            <span v-else></span>
            <!-- spacer -->

            <div class="flex gap-1">
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                aria-label="Edit"
                class="w-9 h-9 p-0"
                @click="emit('edit', product)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                aria-label="Delete"
                class="w-9 h-9 p-0"
                @click="emit('delete', product.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  background-color: var(--p-content-background);
  border: 1px solid var(--p-content-border-color);
  border-radius: 12px;
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  cursor: pointer;
  height: 100%;
}
.product-card:hover {
  border-color: var(--p-primary-color);
  transform: translateY(-4px);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
.product-link {
  color: var(--p-text-muted-color);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: color 0.2s ease;
}
.product-link:hover {
  color: var(--p-primary-color);
}
</style>
