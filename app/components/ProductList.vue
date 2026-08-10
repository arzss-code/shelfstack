<script setup lang="ts">
import type { Product } from "~/stores/product";

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
      style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      "
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
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end">
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
      style="
        text-align: center;
        padding: 4rem 2rem;
        background-color: var(--p-content-background);
        border-radius: 16px;
        border: 1px dashed var(--p-content-border-color);
      "
    >
      <template v-if="isSearching">
        <i
          class="pi pi-search"
          style="
            font-size: 2.5rem;
            color: var(--p-text-muted-color);
            margin-bottom: 1.5rem;
          "
        ></i>
        <h3
          style="
            margin: 0 0 0.5rem 0;
            color: var(--p-text-color);
            font-weight: 600;
            font-size: 1.25rem;
          "
        >
          Pencarian tidak ditemukan
        </h3>
        <p style="margin: 0; color: var(--p-text-muted-color)">
          Tidak ada produk yang cocok dengan kata kunci pencarian Anda.
        </p>
      </template>
      <template v-else>
        <i
          class="pi pi-box"
          style="
            font-size: 2.5rem;
            color: var(--p-text-muted-color);
            margin-bottom: 1.5rem;
          "
        ></i>
        <h3
          style="
            margin: 0 0 0.5rem 0;
            color: var(--p-text-color);
            font-weight: 600;
            font-size: 1.25rem;
          "
        >
          Katalog masih kosong
        </h3>
        <p style="margin: 0; color: var(--p-text-muted-color)">
          Silakan klik tombol "Tambah Produk" untuk mulai mengelola etalase.
        </p>
      </template>
    </div>

    <!-- Product Grid -->
    <!-- Product Grid -->
    <div
      v-else
      style="
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      "
    >
      <div
        v-for="product in products"
        :key="product.id"
        class="product-card"
        @click="router.push(`/product/${product.id}`)"
      >
        <!-- Image Container -->
        <div
          style="
            position: relative;
            padding-top: 66.66%;
            width: 100%;
            border-bottom: 1px solid var(--p-content-border-color);
          "
        >
          <img
            v-if="product.image_url"
            :src="product.image_url"
            :alt="product.name"
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
            "
          />
          <div
            v-else
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: var(--p-surface-100);
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <i
              class="pi pi-image"
              style="font-size: 2.5rem; color: var(--p-text-muted-color)"
            ></i>
          </div>
        </div>

        <!-- Content -->
        <div
          style="
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
          "
        >
          <h3
            style="
              margin: 0 0 0.25rem 0;
              font-size: 1.15rem;
              font-weight: 600;
              color: var(--p-text-color);
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            "
          >
            {{ product.name }}
          </h3>
          <span
            style="
              font-size: 1rem;
              font-weight: 600;
              color: var(--p-primary-color);
              margin-bottom: 0.75rem;
            "
          >
            Rp {{ product.price.toLocaleString("id-ID") }}
          </span>

          <p
            style="
              margin: 0 0 1.25rem 0;
              color: var(--p-text-muted-color);
              font-size: 0.9rem;
              line-height: 1.5;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              flex-grow: 1;
            "
          >
            {{ product.description || "Tidak ada deskripsi." }}
          </p>

          <!-- Actions -->
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: auto;
            "
            @click.stop
          >
            <a
              v-if="product.link"
              :href="product.link"
              target="_blank"
              class="product-link"
            >
              <i class="pi pi-external-link" style="font-size: 0.75rem"></i>
              Referensi
            </a>
            <span v-else></span>
            <!-- spacer -->

            <div style="display: flex; gap: 0.25rem">
              <Button
                icon="pi pi-pencil"
                severity="secondary"
                text
                rounded
                aria-label="Edit"
                style="width: 2.25rem; height: 2.25rem; padding: 0"
                @click="emit('edit', product)"
              />
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                aria-label="Delete"
                style="width: 2.25rem; height: 2.25rem; padding: 0"
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
